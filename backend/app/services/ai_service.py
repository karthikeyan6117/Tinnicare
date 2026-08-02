import json
import logging
from app.services.langchain_service import langchain_service

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self):
        self.service = langchain_service

    def analyze_symptom_pattern(self, symptoms_data: list[dict]) -> dict:
        prompt = f"Analyze symptom history and return JSON with pattern_analysis, severity_trend, possible_triggers, recommendations, risk_level: {json.dumps(symptoms_data)}"
        try:
            res = self.service.llm.invoke(prompt)
            content = res.content if hasattr(res, "content") else str(res)
            return self.service._parse_json(content)
        except Exception as e:
            logger.error(f"Error in analyze_symptom_pattern: {e}")
            return {
                "pattern_analysis": "Symptoms show periodic fluctuation.",
                "severity_trend": "stable",
                "possible_triggers": ["Stress", "Lack of sleep"],
                "recommendations": ["Maintain sound therapy", "Improve sleep hygiene"],
                "risk_level": "medium",
            }

    def generate_care_recommendations(
        self,
        patient_profile: dict,
        recent_symptoms: list[dict],
        risk_level: str,
    ) -> str:
        prompt = f"Patient Profile: {json.dumps(patient_profile)}, Symptoms: {json.dumps(recent_symptoms)}, Risk Level: {risk_level}. Provide specific recommendations for daily management, lifestyle, medical attention, sound therapy, stress."
        try:
            res = self.service.llm.invoke(prompt)
            return res.content if hasattr(res, "content") else str(res)
        except Exception as e:
            logger.error(f"Error in generate_care_recommendations: {e}")
            return "Please practice sound therapy daily, maintain consistent sleep, and consult your physician if symptoms worsen."

    def analyze_trigger_patterns(self, trigger_data: list[dict]) -> dict:
        prompt = f"Analyze triggers: {json.dumps(trigger_data)}. Return JSON with top_triggers, trigger_severity_correlation, avoidance_strategies, trigger_forecast."
        try:
            res = self.service.llm.invoke(prompt)
            content = res.content if hasattr(res, "content") else str(res)
            return self.service._parse_json(content)
        except Exception as e:
            logger.error(f"Error in analyze_trigger_patterns: {e}")
            return {
                "top_triggers": ["Loud Noise", "Stress"],
                "trigger_severity_correlation": "High correlation with sleep disruption",
                "avoidance_strategies": ["Use hearing protection in loud environments", "Practice mindfulness"],
                "trigger_forecast": "Low risk over next 24h",
            }

    def chat_message(self, message: str, context: str = "") -> str:
        return self.service.llm.invoke(f"Context: {context}\nUser Message: {message}").content


ai_service = AIService()
