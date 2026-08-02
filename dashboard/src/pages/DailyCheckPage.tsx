import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { endpoints } from "../constants/api";
import {
  ClipboardList,
  Sparkles,
  CheckCircle2,
  Moon,
  Volume2,
  Clock,
  AlertCircle,
  Calendar,
  TrendingUp,
  Loader2,
  Activity,
  AudioWaveform,
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const SOUND_TYPES = ["Ringing", "Buzzing", "Hissing", "Whistling", "Clicking", "Other"];
const HEARING_LOSS_OPTIONS = ["No", "Mild", "Yes"];
const DURATION_OPTIONS = [
  { label: "Few minutes", value: 15 },
  { label: "Hours", value: 180 },
  { label: "Always / All day", value: 720 },
];

export default function DailyCheckPage() {
  const navigate = useNavigate();

  const [soundType, setSoundType] = useState("Ringing");
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [scaling, setScaling] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(7);
  const [hearingLoss, setHearingLoss] = useState("No");

  const pad = (n: number) => n.toString().padStart(2, "0");
  const toLocalDatetimeInput = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const [recordedAt, setRecordedAt] = useState<string>(toLocalDatetimeInput(new Date()));
  const [currentNow, setCurrentNow] = useState<string>(new Date().toLocaleString());

  const [loading, setLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [lastEntry, setLastEntry] = useState<any>(null);

  const [chartData, setChartData] = useState<any[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  const getSeverityEnum = (scale: number) => {
    if (scale <= 3) return "mild";
    if (scale <= 6) return "moderate";
    if (scale <= 8) return "severe";
    return "very_severe";
  };

  const fetchCharts = async () => {
    try {
      const res = await api.get(endpoints.symptoms.list);
      const records = [...res.data].reverse();
      const mapped = records.map((item: any) => {
        const dt = item.recorded_at ? new Date(item.recorded_at) : null;
        const label = dt
          ? dt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
          : "Log";
        const severityScoreMap: Record<string, number> = { mild: 2, moderate: 5, severe: 8, very_severe: 10 };
        return {
          label,
          severity: item.loudness_level ?? severityScoreMap[item.severity] ?? 5,
          sleepQuality: item.sleep_quality ?? 0,
          stress: item.stress_level ?? 5,
          frequency: item.frequency_hz ?? null,
          intensity: item.intensity_db ?? null,
        };
      });
      setChartData(mapped);
    } catch {
      setChartData([]);
    } finally {
      setChartsLoading(false);
    }
  };

  useEffect(() => {
    fetchCharts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post(endpoints.symptoms.create, {
        severity: getSeverityEnum(scaling),
        loudness_level: scaling,
        duration_minutes: durationMinutes,
        description: `Sound type: ${soundType}`,
        sleep_quality: Math.min(10, Math.max(1, sleepQuality)),
        stress_level: scaling > 7 ? 8 : 4,
        hearing_loss: hearingLoss,
        recorded_at: new Date(recordedAt).toISOString(),
      });

      setLastEntry({
        recordedAt: new Date(recordedAt).toLocaleString(),
        soundType,
        durationMinutes,
        scaling,
        sleepQuality,
        hearingLoss,
        frequencyHz: res.data.frequency_hz ?? null,
        intensityDb: res.data.intensity_db ?? null,
      });

      try {
        const insightRes = await api.post(endpoints.predictions.aiInsights);
        setAiInsight(insightRes.data.analysis);
      } catch {
        setAiInsight({ recommendation: "Your daily check-in has been logged." });
      }

      setSubmitted(true);
      fetchCharts();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to submit daily check-in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-200">
          <ClipboardList className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Tinnitus Check</h1>
          <p className="text-gray-500 text-sm mt-0.5">Log today's symptoms to receive instant LangChain AI therapy recommendations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-3">
          {submitted ? (
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-6 animate-slideIn">
              <div className="flex items-center gap-3 text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Daily Entry Logged Successfully!</h2>
                  <p className="text-sm text-gray-500">Your entry has been saved to your health record.</p>
                </div>
              </div>

              {lastEntry && (
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Date & Time</p>
                    <p className="font-semibold text-gray-800 mt-0.5">{lastEntry.recordedAt}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sound Type</p>
                    <p className="font-semibold text-gray-800 mt-0.5">{lastEntry.soundType}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Severity</p>
                    <p className="font-semibold text-gray-800 mt-0.5">{lastEntry.scaling} / 10</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Duration</p>
                    <p className="font-semibold text-gray-800 mt-0.5">
                      {lastEntry.durationMinutes < 60
                        ? `${lastEntry.durationMinutes} min`
                        : `${(lastEntry.durationMinutes / 60).toFixed(1)} hrs`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sleep Quality</p>
                    <p className="font-semibold text-gray-800 mt-0.5">{lastEntry.sleepQuality} / 10</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hearing Loss</p>
                    <p className="font-semibold text-gray-800 mt-0.5">{lastEntry.hearingLoss}</p>
                  </div>
                </div>
              )}

              {lastEntry && lastEntry.frequencyHz != null && (
                <div className="bg-gradient-to-br from-violet-50 via-fuchsia-50 to-violet-100 rounded-2xl p-6 border border-violet-200/60 shadow-sm">
                  <div className="flex items-center gap-2 text-violet-800 font-bold text-sm mb-3">
                    <AudioWaveform className="w-5 h-5 text-violet-600" /> ML Estimated Tinnitus Profile
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/70 rounded-2xl p-4 text-center border border-violet-100">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Estimated Frequency</p>
                      <p className="text-2xl font-black text-violet-700 mt-1">{Math.round(lastEntry.frequencyHz)} <span className="text-sm font-bold">Hz</span></p>
                    </div>
                    <div className="bg-white/70 rounded-2xl p-4 text-center border border-pink-100">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Estimated Intensity</p>
                      <p className="text-2xl font-black text-pink-600 mt-1">{lastEntry.intensityDb != null ? lastEntry.intensityDb.toFixed(1) : "—"} <span className="text-sm font-bold">dB</span></p>
                    </div>
                  </div>
                  <p className="text-[11px] text-violet-700/80 mt-3 text-center">
                    Computed by the linear regression model from your stress, sleep, loudness & hearing loss inputs.
                  </p>
                </div>
              )}

              {aiInsight && (
                <div className="bg-gradient-to-br from-teal-50 via-emerald-50 to-teal-100 rounded-2xl p-6 border border-teal-200/60 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                    <Sparkles className="w-5 h-5 text-teal-600" /> LangChain AI Recommendation
                  </div>

                  {typeof aiInsight === "string" ? (
                    <p className="text-sm text-teal-900 leading-relaxed">{aiInsight}</p>
                  ) : (
                    <div className="space-y-3 text-sm text-teal-950">
                      {aiInsight.pattern_analysis && <p><strong>Analysis:</strong> {aiInsight.pattern_analysis}</p>}
                      {aiInsight.recommendations && Array.isArray(aiInsight.recommendations) && (
                        <div>
                          <strong className="block mb-1">Personalized Care Steps:</strong>
                          <ul className="list-disc list-inside space-y-1 pl-1 text-teal-900">
                            {aiInsight.recommendations.map((rec: string, idx: number) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setAiInsight(null);
                    setSleepQuality(7);
                    setScaling(5);
                    setRecordedAt(toLocalDatetimeInput(new Date()));
                    setCurrentNow(new Date().toLocaleString());
                  }}
                  className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
                >
                  Log Another Entry
                </button>
                <button
                  onClick={() => navigate("/progress")}
                  className="px-6 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors text-sm shadow-md shadow-teal-200"
                >
                  View Weekly Graph →
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-8">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2 border border-red-100">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
                </div>
              )}

              {/* Date & Time */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-600" /> Date & Time of Entry
                  </label>
                  <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-lg border border-teal-100">
                    Now: {currentNow}
                  </span>
                </div>
                <input
                  type="datetime-local"
                  value={recordedAt}
                  onChange={(e) => setRecordedAt(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50"
                />
                <p className="text-xs text-gray-400">The date and time of this entry is saved with your symptom data and shown in the charts below.</p>
              </div>

              {/* 1. Type of sound */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-teal-600" /> 1. Type of Sound
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {SOUND_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSoundType(type)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        soundType === type
                          ? "bg-teal-500 text-white shadow-md shadow-teal-200 scale-[1.02]"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Duration of sound */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" /> 2. Duration of Sound
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {DURATION_OPTIONS.map((dur) => (
                    <button
                      key={dur.label}
                      type="button"
                      onClick={() => setDurationMinutes(dur.value)}
                      className={`p-3.5 rounded-xl text-center text-sm font-medium transition-all ${
                        durationMinutes === dur.value
                          ? "bg-teal-500 text-white shadow-md shadow-teal-200 border-2 border-teal-500"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Scaling of sound (1 to 10) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600" /> 3. Sound Intensity Scaling (1 to 10)
                  </label>
                  <span className="text-lg font-black text-teal-600 bg-teal-50 px-3 py-0.5 rounded-lg border border-teal-100">
                    {scaling} / 10
                  </span>
                </div>
                <div className="grid grid-cols-10 gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setScaling(num)}
                      className={`py-3 rounded-xl text-sm font-bold transition-all ${
                        scaling === num
                          ? num <= 3
                            ? "bg-emerald-500 text-white scale-110 shadow-md shadow-emerald-200"
                            : num <= 6
                            ? "bg-amber-500 text-white scale-110 shadow-md shadow-amber-200"
                            : "bg-rose-500 text-white scale-110 shadow-md shadow-rose-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400 font-medium px-1">
                  <span>1 (Very Faint)</span>
                  <span>5 (Moderate)</span>
                  <span>10 (Extremely Loud)</span>
                </div>
              </div>

              {/* 4. Sleep quality */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Moon className="w-4 h-4 text-teal-600" /> 4. Sleep Quality (1-10)
                  </label>
                  <span className="text-base font-bold text-gray-900 bg-gray-100 px-3 py-0.5 rounded-lg">{sleepQuality}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={sleepQuality}
                  onChange={(e) => setSleepQuality(parseInt(e.target.value, 10))}
                  className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-xs text-gray-400 font-medium px-1">
                  <span>1</span>
                  <span>4</span>
                  <span>7</span>
                  <span>10</span>
                </div>
              </div>

              {/* 5. Hearing loss */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-600" /> 5. Hearing Loss (if any)
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {HEARING_LOSS_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setHearingLoss(opt)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        hearingLoss === opt
                          ? "bg-teal-500 text-white shadow-md shadow-teal-200 scale-[1.02]"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400">Used with your other inputs to estimate your tinnitus frequency (Hz) and intensity (dB).</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-2xl font-bold text-base hover:from-teal-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-teal-200 hover:shadow-teal-300 disabled:opacity-50"
              >
                {loading ? "Submitting & Generating AI Recommendations..." : "Submit Daily Check"}
              </button>
            </form>
          )}
        </div>

        {/* Charts Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 bg-white rounded-3xl p-6 border border-gray-100 shadow-xl">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-200">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Symptom Charts</h2>
              <p className="text-gray-500 text-xs">Your logged entries, visualized in real time</p>
            </div>
          </div>

          {chartsLoading ? (
            <div className="flex items-center justify-center p-10 bg-white rounded-3xl border border-gray-100 shadow-xl text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading charts...
            </div>
          ) : chartData.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-xl text-center text-gray-400">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 text-teal-300" />
              <p className="font-medium text-gray-600">No data yet</p>
              <p className="text-xs mt-1">Submit a daily check-in to see your symptom charts here.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-500" /> Sound Severity (1-10)
                </h3>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" stroke="#9CA3AF" fontSize={10} />
                    <YAxis domain={[0, 10]} stroke="#9CA3AF" fontSize={10} />
                    <Tooltip />
                    <Area type="monotone" dataKey="severity" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} strokeWidth={3} name="Sound Severity (1-10)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <AudioWaveform className="w-4 h-4 text-violet-500" /> Estimated Frequency & Intensity
                </h3>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" stroke="#9CA3AF" fontSize={10} />
                    <YAxis yAxisId="freq" stroke="#7C3AED" fontSize={10} />
                    <YAxis yAxisId="int" orientation="right" stroke="#EC4899" fontSize={10} />
                    <Tooltip />
                    <Area yAxisId="freq" type="monotone" dataKey="frequency" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.15} strokeWidth={3} name="Est. Frequency (Hz)" />
                    <Area yAxisId="int" type="monotone" dataKey="intensity" stroke="#EC4899" fill="#EC4899" fillOpacity={0.15} strokeWidth={3} name="Est. Intensity (dB)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Moon className="w-4 h-4 text-teal-500" /> Sleep Quality vs Stress
                </h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" stroke="#9CA3AF" fontSize={10} />
                    <YAxis stroke="#9CA3AF" fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="sleepQuality" fill="#0D9488" name="Sleep Quality" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="stress" fill="#E11D48" name="Stress Level (1-10)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xl grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Entries</p>
                  <p className="text-xl font-black text-gray-900">{chartData.length}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Latest Severity</p>
                  <p className="text-xl font-black text-amber-500">{chartData[chartData.length - 1]?.severity ?? "—"} / 10</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Avg Sleep</p>
                  <p className="text-xl font-black text-teal-600">
                    {(chartData.reduce((acc, d) => acc + (d.sleepQuality ?? 0), 0) / chartData.length).toFixed(1)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
