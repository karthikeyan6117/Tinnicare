import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { endpoints } from "../constants/api";
import {
  Activity, User, Heart, Ear, Battery, Check, ChevronRight, ChevronLeft, Ruler, Weight, Briefcase,
} from "lucide-react";

const inputClass = "w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all duration-200 bg-white";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
const selectClass = "w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all duration-200 bg-white appearance-none cursor-pointer";

const MEDICAL_OPTIONS = [
  "Hearing Loss", "Diabetes", "High Blood Pressure", "Ear Infection",
  "Stress", "Anxiety", "Depression",
];

const EAR_OPTIONS = ["Left", "Right", "Both"];
const TYPE_OPTIONS = ["Ringing", "Buzzing", "Hissing", "Whistling", "Clicking", "Other"];
const ONSET_OPTIONS = ["Less than 1 month", "6 months", "1 year", "5 years"];

type FormData = {
  basic: { age: string; date_of_birth: string; gender: string; occupation: string; height: string; weight: string; hearing_aid: string };
  medical: { conditions: string[] };
  medicalHistory?: string;
  tinnitus: {
    ear: string;
    type: string;
    durationHours: string;
    durationMinutes: string;
    totalMinutes: number | null;
    onset: string;
    rating: string;
  };
  lifestyle: { smoking: string; caffeine: string; substance_consumption: string; exercise: string; sleep_hours: string; daily_stress: string; noise_exposure: string };
};

const STEPS = [
  { id: "basic", label: "Basic Info", icon: User },
  { id: "medical", label: "Medical History", icon: Heart },
  { id: "tinnitus", label: "Tinnitus", icon: Ear },
  { id: "lifestyle", label: "Lifestyle", icon: Battery },
];

export default function CreateProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormData>({
    basic: { age: "", date_of_birth: "", gender: "", occupation: "", height: "", weight: "", hearing_aid: "" },
    medical: { conditions: [] },
    medicalHistory: "",
    tinnitus: { ear: "", type: "", durationHours: "", durationMinutes: "", totalMinutes: null, onset: "", rating: "" },
    lifestyle: { smoking: "", caffeine: "", substance_consumption: "", exercise: "", sleep_hours: "", daily_stress: "", noise_exposure: "" },
  });

  const updateMedicalHistory = (v: string) => setForm(f => ({ ...f, medicalHistory: v }));

  const updateBasic = (k: string, v: string) => setForm(f => ({ ...f, basic: { ...f.basic, [k]: v } }));
  const updateLifestyle = (k: string, v: string) => setForm(f => ({ ...f, lifestyle: { ...f.lifestyle, [k]: v } }));

  const toggleCondition = (cond: string) => {
    setForm(f => {
      let conditions: string[];
      if (cond === "None") {
        conditions = f.medical.conditions.includes("None") ? [] : ["None"];
      } else {
        conditions = f.medical.conditions.includes(cond)
          ? f.medical.conditions.filter(c => c !== cond)
          : [...f.medical.conditions.filter(c => c !== "None"), cond];
      }
      return { ...f, medical: { ...f.medical, conditions } };
    });
  };

  const updateTinnitus = (k: string, v: string) => setForm(f => ({ ...f, tinnitus: { ...f.tinnitus, [k]: v } }));

  const updateTinnitusDuration = (field: "durationHours" | "durationMinutes", value: string) => {
    const digits = value.replace(/\D/g, "");
    const max = field === "durationHours" ? 24 : 59;
    const sanitized = digits === "" ? "" : String(Math.min(max, Math.max(0, parseInt(digits, 10))));
    const display = field === "durationMinutes" && sanitized !== "" ? String(Number(sanitized)).padStart(2, "0") : sanitized;

    setForm(f => {
      const updatedTinnitus = { ...f.tinnitus, [field]: display } as typeof f.tinnitus;
      const hours = parseInt(updatedTinnitus.durationHours, 10) || 0;
      const minutes = parseInt(updatedTinnitus.durationMinutes, 10) || 0;
      updatedTinnitus.totalMinutes = hours * 60 + minutes;
      return { ...f, tinnitus: updatedTinnitus };
    });
  };

  const tinnitusDurationHours = form.tinnitus.durationHours === "" ? 0 : parseInt(form.tinnitus.durationHours, 10);
  const tinnitusDurationMinutes = form.tinnitus.durationMinutes === "" ? 0 : parseInt(form.tinnitus.durationMinutes, 10);
  const isTinnitusDurationValid =
    !Number.isNaN(tinnitusDurationHours) &&
    !Number.isNaN(tinnitusDurationMinutes) &&
    tinnitusDurationHours >= 0 &&
    tinnitusDurationHours <= 24 &&
    tinnitusDurationMinutes >= 0 &&
    tinnitusDurationMinutes <= 59 &&
    (tinnitusDurationHours > 0 || tinnitusDurationMinutes > 0);

  const tinnitusDurationError = !isTinnitusDurationValid && (form.tinnitus.durationHours !== "" || form.tinnitus.durationMinutes !== "")
    ? "Please enter a valid duration between 1 minute and 24 hours 59 minutes."
    : "";

  const canProceed = () => {
    if (step === 0) return form.basic.age !== "" || form.basic.date_of_birth !== "";
    if (step === 2) return isTinnitusDurationValid;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await api.put(endpoints.auth.profileUpdate, {
        basic: {
          age: parseInt(form.basic.age) || 0,
          date_of_birth: form.basic.date_of_birth || null,
          gender: form.basic.gender || null,
          occupation: form.basic.occupation || null,
          height: form.basic.height || null,
          weight: form.basic.weight || null,
          hearing_aid: form.basic.hearing_aid || null,
        },
        medical: {
          medical_conditions: form.medical.conditions.length > 0 ? form.medical.conditions.join(",") : null,
          medical_history: form.medicalHistory || null,
        },
        tinnitus: {
          affected_ear: form.tinnitus.ear || null,
          sound_type: form.tinnitus.type || null,
          tinnitus_duration: form.tinnitus.durationHours || form.tinnitus.durationMinutes ? `${form.tinnitus.durationHours.padStart(1, "0")}h ${form.tinnitus.durationMinutes.padStart(2, "0")}m` : null,
          tinnitus_onset: form.tinnitus.onset || null,
          severity_rating: form.tinnitus.rating || null,
        },
        lifestyle: {
          sleep_hours: form.lifestyle.sleep_hours || null,
          caffeine: form.lifestyle.caffeine || null,
          smoking: form.lifestyle.smoking || null,
          substance_consumption: form.lifestyle.substance_consumption || null,
          daily_stress: form.lifestyle.daily_stress || null,
          noise_exposure: form.lifestyle.noise_exposure || null,
          exercise: form.lifestyle.exercise || null,
        },
        mark_completed: true,
      });
      navigate("/");
    } catch (err: unknown) {
      let msg = "Failed to save profile";
      if (err instanceof Error && "response" in err) {
        const d = (err as { response: { data: unknown } }).response?.data;
        msg = typeof d === "string" ? d : (d as Record<string, unknown>)?.detail as string || msg;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-100 flex items-center justify-center p-4 py-8">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-8 md:p-10 animate-fadeIn">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-teal-200">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Your Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Help us personalize your care experience</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 mb-6 border border-red-100">{error}</div>
        )}

        <div className="flex items-center justify-between mb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${done ? "bg-teal-500 text-white shadow-md shadow-teal-200" : active ? "bg-teal-500 text-white shadow-md shadow-teal-200 ring-4 ring-teal-100" : "bg-gray-100 text-gray-400"}`}>
                    {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium ${active || done ? "text-teal-600" : "text-gray-400"}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 mt-[-1.25rem] transition-all duration-300 ${done ? "bg-teal-500" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {step === 0 && (
          <div className="space-y-5 animate-slideIn">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><User className="w-5 h-5 text-teal-500" /> Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Date of Birth</label>
                <input type="date" value={form.basic.date_of_birth} onChange={e => updateBasic("date_of_birth", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Age <span className="text-red-400">*</span></label>
                <input type="number" value={form.basic.age} onChange={e => updateBasic("age", e.target.value)} className={inputClass} placeholder="e.g. 32" min="1" max="150" />
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <select value={form.basic.gender} onChange={e => updateBasic("gender", e.target.value)} className={selectClass}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}><Briefcase className="w-3.5 h-3.5 inline mr-1 text-teal-500" /> Occupation</label>
                <input type="text" value={form.basic.occupation} onChange={e => updateBasic("occupation", e.target.value)} className={inputClass} placeholder="e.g. Engineer" />
              </div>
              <div>
                <label className={labelClass}><Ruler className="w-3.5 h-3.5 inline mr-1 text-teal-500" /> Height</label>
                <input type="text" value={form.basic.height} onChange={e => updateBasic("height", e.target.value)} className={inputClass} placeholder="e.g. 5'10 or 178cm" />
              </div>
              <div>
                <label className={labelClass}><Weight className="w-3.5 h-3.5 inline mr-1 text-teal-500" /> Weight</label>
                <input type="text" value={form.basic.weight} onChange={e => updateBasic("weight", e.target.value)} className={inputClass} placeholder="e.g. 70 kg" />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Hearing Aid?</label>
                <div className="flex gap-4">
                  {["yes", "no"].map(v => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="hearingAid" value={v} checked={form.basic.hearing_aid === v} onChange={e => updateBasic("hearing_aid", e.target.value)} className="accent-teal-500" />
                      <span className="text-gray-700 capitalize">{v === "yes" ? "Yes" : "No"}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5 animate-slideIn">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Heart className="w-5 h-5 text-teal-500" /> Medical History</h2>
            <p className="text-sm text-gray-500">Do you have any of the following conditions?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MEDICAL_OPTIONS.map(cond => (
                <label key={cond} onClick={() => toggleCondition(cond)} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.medical.conditions.includes(cond) ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${form.medical.conditions.includes(cond) ? "bg-teal-500" : "border-2 border-gray-300"}`}>
                    {form.medical.conditions.includes(cond) && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-gray-700 text-sm font-medium">{cond}</span>
                </label>
              ))}
            </div>
            <label onClick={() => toggleCondition("None")} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.medical.conditions.includes("None") ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-gray-300"}`}>
              <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${form.medical.conditions.includes("None") ? "bg-teal-500" : "border-2 border-gray-300"}`}>
                {form.medical.conditions.includes("None") && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className="text-gray-700 text-sm font-medium">None</span>
            </label>

            <div className="mt-4">
              <label className={labelClass}>Medical History (free text)</label>
              <textarea value={form.medicalHistory} onChange={e => updateMedicalHistory(e.target.value)} className="w-full min-h-[120px] p-3 rounded-lg border border-gray-300" placeholder="Past diagnoses, surgeries, hospitalizations, notes..." />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-slideIn">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Ear className="w-5 h-5 text-teal-500" /> Describe Your Tinnitus</h2>

            <div>
              <label className={labelClass}>Which ear?</label>
              <div className="flex gap-2">
                {EAR_OPTIONS.map(v => (
                  <button key={v} type="button" onClick={() => updateTinnitus("ear", v)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${form.tinnitus.ear === v ? "bg-teal-500 text-white shadow-md shadow-teal-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{v}</button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Type of sound</label>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map(v => (
                  <button key={v} type="button" onClick={() => updateTinnitus("type", v)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${form.tinnitus.type === v ? "bg-teal-500 text-white shadow-md shadow-teal-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{v}</button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>How long did you experience tinnitus today? <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.tinnitus.durationHours}
                    placeholder="0"
                    onChange={e => updateTinnitusDuration("durationHours", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.tinnitus.durationMinutes}
                    placeholder="00"
                    onChange={e => updateTinnitusDuration("durationMinutes", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              {tinnitusDurationError && (
                <p className="mt-3 text-sm text-red-600">{tinnitusDurationError}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>When did it start?</label>
              <div className="flex gap-2 flex-wrap">
                {ONSET_OPTIONS.map(v => (
                  <button key={v} type="button" onClick={() => updateTinnitus("onset", v)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${form.tinnitus.onset === v ? "bg-teal-500 text-white shadow-md shadow-teal-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{v}</button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Rate your sound (1–10)</label>
              <div className="flex gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} type="button" onClick={() => updateTinnitus("rating", String(n))}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${form.tinnitus.rating === String(n) ? "bg-teal-500 text-white shadow-md shadow-teal-200 scale-110" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{n}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-slideIn">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Battery className="w-5 h-5 text-teal-500" /> Lifestyle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Sleep Hours</label>
                <input type="number" value={form.lifestyle.sleep_hours} onChange={e => updateLifestyle("sleep_hours", e.target.value)} className={inputClass} placeholder="e.g. 7" min="0" max="24" step="0.5" />
              </div>
              <div>
                <label className={labelClass}>Caffeine Intake</label>
                <select value={form.lifestyle.caffeine} onChange={e => updateLifestyle("caffeine", e.target.value)} className={selectClass}>
                  <option value="">Select...</option>
                  <option value="none">None</option>
                  <option value="1 cup">1 cup</option>
                  <option value="2 cups">2 cups</option>
                  <option value="3+ cups">3+ cups</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Smoking</label>
                <select value={form.lifestyle.smoking} onChange={e => updateLifestyle("smoking", e.target.value)} className={selectClass}>
                  <option value="">Select...</option>
                  <option value="never">Never</option>
                  <option value="occasional">Occasional</option>
                  <option value="regular">Regular</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Substance Consumption</label>
                <select value={form.lifestyle.substance_consumption} onChange={e => updateLifestyle("substance_consumption", e.target.value)} className={selectClass}>
                  <option value="">Select...</option>
                  <option value="none">None</option>
                  <option value="occasional">Occasional</option>
                  <option value="regular">Regular</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Daily Stress</label>
                <select value={form.lifestyle.daily_stress} onChange={e => updateLifestyle("daily_stress", e.target.value)} className={selectClass}>
                  <option value="">Select...</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="very_high">Very High</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Noise Exposure</label>
                <select value={form.lifestyle.noise_exposure} onChange={e => updateLifestyle("noise_exposure", e.target.value)} className={selectClass}>
                  <option value="">Select...</option>
                  <option value="none">None</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Exercise</label>
                <select value={form.lifestyle.exercise} onChange={e => updateLifestyle("exercise", e.target.value)} className={selectClass}>
                  <option value="">Select...</option>
                  <option value="none">None</option>
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="regular">Regular</option>
                  <option value="intense">Intense</option>
                </select>
              </div>
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mt-4">
              <p className="text-sm text-teal-700">Almost done! Review your information and click Complete to finish setting up your profile.</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
          {step > 0 && (
            <button type="button" onClick={() => setStep(s => s - 1)} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 active:scale-[0.98]">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-medium hover:from-teal-600 hover:to-emerald-700 transition-all duration-200 shadow-md shadow-teal-200 hover:shadow-lg hover:shadow-teal-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={loading} className="px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-medium hover:from-teal-600 hover:to-emerald-700 transition-all duration-200 shadow-md shadow-teal-200 hover:shadow-lg hover:shadow-teal-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
              {loading ? "Saving..." : "Complete Profile"}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideIn { animation: slideIn 0.35s ease-out; }
      `}</style>
    </div>
  );
}
