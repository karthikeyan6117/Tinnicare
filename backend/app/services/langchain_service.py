import json
import logging
from typing import List, Dict, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser

from app.core.config import settings
from app.services.prediction_service import risk_predictor, PredictionInput
from app.models.health_record import SymptomRecord, TriggerRecord
from app.models.user import PatientProfile, User
from app.models.chat import ChatMessage
from app.models.assessment import RiskAssessment

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "llama-3.3-70b-versatile"


class LangChainService:
    def __init__(self):
        self.llm = ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model_name=DEFAULT_MODEL,
            temperature=0.3,
            max_tokens=1024,
            verbose=settings.LANGCHAIN_VERBOSE,
        )
        self.output_parser = StrOutputParser()

    def get_patient_context(self, user_id: UUID, db: Session) -> Dict[str, Any]:
        """Retrieve patient history, profile, ML risk predictions, and recent chat memory."""
        context = {
            "profile": None,
            "symptoms": [],
            "triggers": [],
            "ml_risk": None,
            "history_messages": [],
        }

        # 1. Fetch Profile
        profile = db.query(PatientProfile).filter(PatientProfile.user_id == user_id).first()
        if profile:
            context["profile"] = {
                "tinnitus_type": profile.tinnitus_type or profile.sound_type,
                "affected_ear": profile.affected_ear,
                "duration": profile.tinnitus_duration,
                "onset": profile.tinnitus_onset,
                "severity_level": profile.severity_level or profile.severity_rating,
                "medical_conditions": profile.medical_conditions or profile.existing_conditions,
                "sleep_hours": profile.sleep_hours,
                "daily_stress": profile.daily_stress,
                "exercise": profile.exercise,
                "hearing_aid": profile.hearing_aid,
            }

        # 2. Fetch Recent Symptoms
        symptoms = (
            db.query(SymptomRecord)
            .filter(SymptomRecord.patient_id == user_id)
            .order_by(SymptomRecord.recorded_at.desc())
            .limit(20)
            .all()
        )
        symptom_list = []
        for s in symptoms:
            symptom_list.append({
                "severity": s.severity.value,
                "loudness": s.loudness_level,
                "stress": s.stress_level,
                "sleep": s.sleep_quality,
                "duration": s.duration_minutes,
                "recorded_at": s.recorded_at.isoformat() if s.recorded_at else None,
            })
        context["symptoms"] = symptom_list

        # 3. Fetch Triggers
        triggers = (
            db.query(TriggerRecord)
            .filter(TriggerRecord.patient_id == user_id)
            .order_by(TriggerRecord.created_at.desc())
            .limit(10)
            .all()
        )
        context["triggers"] = [
            {"type": t.trigger_type, "notes": t.notes} for t in triggers
        ]

        # 4. Execute ML Risk Predictor (Linear Regression)
        if symptom_list:
            latest = symptom_list[0]
            pred_input = PredictionInput(
                severity=1 if latest["severity"] == "mild" else (2 if latest["severity"] == "moderate" else (3 if latest["severity"] == "severe" else 4)),
                duration_minutes=latest["duration"] or 30,
                stress_level=latest["stress"] or 5,
                sleep_quality=latest["sleep"] or 5,
                loudness_level=latest["loudness"] or 5,
                frequency_hz=4000.0,
                recent_triggers_count=len(context["triggers"]),
            )
            context["ml_risk"] = risk_predictor.predict(pred_input)

        # 5. Fetch Chat History (Conversation Memory)
        chat_records = (
            db.query(ChatMessage)
            .filter(ChatMessage.user_id == user_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(10)
            .all()
        )
        # Reverse to chronological order
        chat_records.reverse()
        history = []
        for msg in chat_records:
            history.append(HumanMessage(content=msg.message))
            if msg.response:
                history.append(AIMessage(content=msg.response))
        context["history_messages"] = history

        return context

    def chat(self, user_id: UUID, message: str, db: Session) -> str:
        """Process chat query using LangChain LCEL pipeline with conversation memory & ML context."""
        context = self.get_patient_context(user_id, db)

        system_prompt = """You are TinniCare AI, an empathetic tinnitus care assistant focused on management, coping strategies, sound therapy, and lifestyle support.
You are not diagnosing medical conditions. Always encourage a clinical consultation if symptoms worsen or risk is high.

Patient Context:
- Profile: {profile_json}
- Recent Symptom Trend (Last 20 entries): {symptoms_json}
- ML Risk Model Assessment: {ml_risk_json}

Guidelines:
1. Directly answer the user's question first, in the first paragraph.
2. If the user asks for a specific detail, provide that exact detail and avoid unrelated advice.
3. Use a ChatGPT-style conversational flow with warm, easy-to-follow language.
4. Start with a brief empathetic acknowledgement only if it supports clarity.
5. Use short paragraphs, and when helpful, include numbered steps or bullet points.
6. Keep the tone supportive, practical, and patient-friendly.
7. Avoid jargon, and explain concepts simply.
8. If the patient reports severe symptoms or high risk, mention clinical consultation as needed, but do not add extra warnings otherwise.
9. Keep answers concise and focused. Do not add irrelevant details or repeat the question unnecessarily.
"""

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{message}"),
        ])

        chain = prompt_template | self.llm | self.output_parser

        try:
            response = chain.invoke({
                "profile_json": json.dumps(context["profile"] or {}),
                "symptoms_json": json.dumps(context["symptoms"]),
                "ml_risk_json": json.dumps(context["ml_risk"] or {}),
                "history": context["history_messages"],
                "message": message,
            })
            return response
        except Exception as e:
            logger.error(f"LangChain chat invocation error: {e}")
            return (
                "I am currently having trouble processing your request with the AI engine. "
                "However, please remember to take deep breaths, try background soothing sounds like rain or white noise, "
                "and consult a medical professional if your symptoms escalate."
            )

    def analyze_daily_check(self, user_id: UUID, daily_data: dict, db: Session) -> dict:
        """Analyze a newly submitted daily check entry and generate instant personalized recommendations."""
        context = self.get_patient_context(user_id, db)

        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a tinnitus specialist AI. Analyze the patient's daily check entry alongside their historical ML risk trends. Return ONLY valid JSON."),
            ("human", """
Daily Check Entry: {daily_check}
Historical Context & ML Risk: {ml_risk}

Return a valid JSON object with the following fields:
- "insight": Short narrative analysis of today's symptoms vs trends.
- "risk_category": "low", "medium", or "high"
- "therapy_recommendation": Recommended sound therapy or relaxation technique.
- "sleep_tip": Specific sleep advice based on reported sleep & severity.
- "lifestyle_advice": Quick actionable habit or stress tip for today.
""")
        ])

        chain = prompt | self.llm | self.output_parser

        try:
            result = chain.invoke({
                "daily_check": json.dumps(daily_data),
                "ml_risk": json.dumps(context["ml_risk"] or {}),
            })
            return self._parse_json(result)
        except Exception as e:
            logger.error(f"LangChain daily check analysis error: {e}")
            return {
                "insight": "Thank you for logging your daily symptoms. Consistent tracking helps identify patterns.",
                "risk_category": daily_data.get("severity", "medium"),
                "therapy_recommendation": "Try 15-20 minutes of pink or brown broadband noise to relax.",
                "sleep_tip": "Keep a consistent sleep schedule and avoid bright screens 1 hour before bed.",
                "lifestyle_advice": "Stay hydrated and practice 5-minute deep breathing exercise.",
            }

    def generate_report(self, user_id: UUID, db: Session) -> dict:
        """Generate a comprehensive patient tinnitus report for doctors or patient overview."""
        context = self.get_patient_context(user_id, db)
        user = db.query(User).filter(User.id == user_id).first()

        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a clinical tinnitus specialist AI producing a comprehensive medical status summary report."),
            ("human", """
Patient Name: {patient_name}
Patient Profile: {profile}
Symptom Logs: {symptoms}
Known Triggers: {triggers}
ML Linear Regression Model Risk Assessment: {ml_risk}

Provide a detailed summary structured as JSON with:
- "patient_summary": Overview of patient's tinnitus condition
- "severity_score": ML predicted severity score out of 10
- "risk_level": "low", "medium", or "high"
- "key_triggers": list of identified triggers
- "clinical_insights": Detailed clinical narrative for doctor/patient
- "actionable_care_plan": list of concrete recommended steps
""")
        ])

        chain = prompt | self.llm | self.output_parser

        try:
            res = chain.invoke({
                "patient_name": user.full_name if user else "Patient",
                "profile": json.dumps(context["profile"] or {}),
                "symptoms": json.dumps(context["symptoms"]),
                "triggers": json.dumps(context["triggers"]),
                "ml_risk": json.dumps(context["ml_risk"] or {}),
            })
            return self._parse_json(res)
        except Exception as e:
            logger.error(f"LangChain report generation error: {e}")
            return {
                "patient_summary": f"Summary report for {user.full_name if user else 'Patient'}",
                "severity_score": context["ml_risk"].get("predicted_severity_score", 5.0) if context["ml_risk"] else 5.0,
                "risk_level": context["ml_risk"].get("predicted_risk", "medium") if context["ml_risk"] else "medium",
                "key_triggers": [t["type"] for t in context["triggers"]],
                "clinical_insights": "Patient requires ongoing monitoring of symptom frequency, sleep quality, and stress levels.",
                "actionable_care_plan": [
                    "Continue daily symptom check-ins",
                    "Utilize sound therapy sessions before sleep",
                    "Maintain stress reduction routine",
                ],
            }

    def generate_sound_therapy_recommendation(self, profile: dict) -> dict:
        """Generate an AI recommendation and personalized sound therapy from ML-estimated tinnitus profile."""
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a tinnitus sound-therapy specialist AI. Based on the patient's ML-estimated tinnitus pitch (frequency) and loudness (intensity), recommend a personalized sound therapy. Return ONLY valid JSON."),
            ("human", """
Patient Profile & Linear Regression Estimates:
{profile}

Return a valid JSON object with exactly these fields:
- "ai_recommendation": Personalized narrative recommendation that references the estimated frequency and intensity, explaining what the values suggest and how to manage the tinnitus.
- "sound_therapy": an object with "sound_type" (e.g. pink noise, brown noise, ocean waves, pure-tone masking, nature sounds), "target_frequency_hz" (a masking frequency tuned near the estimated tinnitus frequency, or 0 for broadband noise), "duration_minutes" (suggested session length, 10-30), and "description" (how to use this therapy).
""")
        ])

        chain = prompt | self.llm | self.output_parser

        try:
            result = self._parse_json(chain.invoke({"profile": json.dumps(profile)}))
            if not isinstance(result.get("sound_therapy"), dict):
                result["sound_therapy"] = {}
            return result
        except Exception as e:
            logger.error(f"LangChain sound therapy generation error: {e}")
            freq = profile.get("estimated_frequency_hz", 0)
            return {
                "ai_recommendation": (
                    f"Your estimated tinnitus pitch is around {freq} Hz with a loudness of "
                    f"{profile.get('estimated_intensity_db', 0)} dB. This suggests sound masking therapy "
                    "using gentle broadband noise at a comfortable volume can help reduce the perceived contrast."
                ),
                "sound_therapy": {
                    "sound_type": "pink noise",
                    "target_frequency_hz": freq,
                    "duration_minutes": 20,
                    "description": "Play pink noise at a volume slightly below your tinnitus loudness for 20 minutes, ideally in quiet surroundings.",
                },
            }

    def _parse_json(self, response: str) -> dict:
        try:
            cleaned = response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned.replace("```json", "").replace("```", "").strip()
            elif cleaned.startswith("```"):
                cleaned = cleaned.replace("```", "").strip()
            return json.loads(cleaned)
        except Exception:
            return {"raw_response": response}


langchain_service = LangChainService()
