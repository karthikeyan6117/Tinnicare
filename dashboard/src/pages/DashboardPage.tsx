import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { endpoints } from "../constants/api";
import {
  Activity, AlertTriangle, TrendingUp, Users, ClipboardList, MessageSquare, Volume2,
  Calendar, CheckCircle, ArrowRight, HeartHandshake, Sparkles, ShieldAlert,
} from "lucide-react";

const stats = [
  { label: "Total Patients", value: "128", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
  { label: "High Risk Today", value: "14", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
  { label: "Avg Severity", value: "4.8", icon: Activity, color: "text-purple-500", bg: "bg-purple-50" },
  { label: "Predictive Accuracy", value: "92%", icon: TrendingUp, color: "text-greent-500", bg: "bg-green-50" },
];

const severityData = [
  { name: "Mon", mild: 4, moderate: 3, severe: 1 },
  { name: "Tue", mild: 3, moderate: 4, severe: 2 },
  { name: "Wed", mild: 5, moderate: 2, severe: 1 },
  { name: "Thu", mild: 2, moderate: 5, severe: 3 },
  { name: "Fri", mild: 4, moderate: 3, severe: 2 },
  { name: "Sat", mild: 3, moderate: 4, severe: 1 },
  { name: "Sun", mild: 4, moderate: 3, severe: 2 },
];

const riskDistribution = [
  { name: "Low", value: 45, color: "#10B981" },
  { name: "Medium", value: 35, color: "#F59E0B" },
  { name: "High", value: 20, color: "#EF4444" },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const [latestAssessment, setLatestAssessment] = useState<any>(null);
  const [latestRiskError, setLatestRiskError] = useState<string | null>(null);
  const [symptomsCount, setSymptomsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(endpoints.assessments.latestRisk)
      .then((r) => setLatestAssessment(r.data))
      .catch((err) => {
        const message = err?.response?.data?.detail || "Unable to load ML risk assessment.";
        setLatestRiskError(message);
      })
      .finally(() => setLoading(false));

    api.get(endpoints.symptoms.list)
      .then((r) => setSymptomsCount(r.data.length))
      .catch(() => {});
  }, []);

  const getRiskBadge = (risk: string) => {
    const styles: Record<string, string> = {
      high: "bg-red-100 text-red-700 border border-red-200",
      medium: "bg-yellow-100 text-yellow-700 border border-yellow-200",
      low: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    };
    return styles[risk?.toLowerCase()] || styles.low;
  };

  const riskLevel = latestAssessment?.risk_level;
  const riskScore = latestAssessment?.risk_score;

  return (
      <div className="space-y-8 animate-fadeIn">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[#f3efff] p-8 shadow-[0_32px_70px_rgba(49,46,129,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.2),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.12),_transparent_28%)]" />
          <div className="pointer-events-none absolute right-0 top-12 h-72 w-72 rounded-full bg-cyan-200/20 blur-3xl" />
          <div className="pointer-events-none absolute left-0 top-20 h-72 w-72 -translate-x-1/3 rounded-full bg-violet-200/25 blur-3xl" />
          <div className="pointer-events-none absolute right-16 top-16 h-[280px] w-[280px] opacity-90">
            <svg viewBox="0 0 320 320" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="leafGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.12" />
                </linearGradient>
              </defs>
              <path d="M48 194C70 148 123 103 169 95C202 89 239 95 269 123C289 141 299 169 285 189C262 215 219 223 171 241C119 261 73 265 49 193Z" fill="url(#leafGradient)" />
              <path d="M78 214C100 166 154 128 199 118C228 112 263 118 284 142C301 160 307 187 294 206C271 234 235 240 192 257C138 279 88 281 78 214Z" fill="#E9D5FF" fillOpacity="0.85" />
            </svg>
          </div>
          <div className="relative z-10 grid gap-8 xl:grid-cols-[1.7fr_1.1fr] lg:items-center">
            <div className="space-y-5 max-w-2xl">
              <div className="inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm shadow-violet-100">
                <span className="text-xl">👋</span>
                Welcome back to your tinnitus wellness space
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-950">
                Hello, {user?.full_name || "Karthikeyan"}
              </h1>
              <p className="max-w-xl text-base leading-8 text-slate-600">
                Track your symptoms daily, explore relaxing sound therapy, and consult our LangChain AI assistant anytime.
              </p>
            </div>

            <div className="relative rounded-[2rem] bg-white p-6 shadow-[0_20px_45px_rgba(15,23,42,0.08)] border border-[#e5dbff]">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.32em] text-violet-700 font-semibold">CURRENT ML STATUS</p>
                  <p className="mt-2 text-sm text-slate-500">Based on your recent symptoms & initial assessment.</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{riskLevel ? riskLevel : "Low"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-3xl font-extrabold text-slate-950">{riskScore?.toFixed?.(1) ?? "3.2"}/10</p>
                </div>
                <div className="h-16 w-16 rounded-[1.4rem] bg-[#f3efff]" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Care Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Link
              to="/daily-check"
              className="group bg-white rounded-[1.75rem] p-6 border border-purple-100 shadow-[0_15px_40px_rgba(99,102,241,0.06)] transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900">Daily Check</h3>
              <p className="text-xs text-slate-500 mt-1">Log today's sound level, duration, and sleep quality.</p>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-4">
                Log Now <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              to="/chat"
              className="group bg-white rounded-[1.75rem] p-6 border border-purple-100 shadow-[0_15px_40px_rgba(99,102,241,0.06)] transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900">AI Assistant</h3>
              <p className="text-xs text-slate-500 mt-1">Ask questions, get instant coping tips & recommendations.</p>
              <div className="flex items-center gap-1 text-xs font-semibold text-violet-600 mt-4">
                Start Chat <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              to="/sound-therapy"
              className="group bg-white rounded-[1.75rem] p-6 border border-purple-100 shadow-[0_15px_40px_rgba(99,102,241,0.06)] transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center mb-4">
                <Volume2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900">Sound Therapy</h3>
              <p className="text-xs text-slate-500 mt-1">Listen to calming nature sounds, white, pink & brown noise.</p>
              <div className="flex items-center gap-1 text-xs font-semibold text-cyan-600 mt-4">
                Play Sounds <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              to="/progress"
              className="group bg-white rounded-[1.75rem] p-6 border border-purple-100 shadow-[0_15px_40px_rgba(99,102,241,0.06)] transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900">Weekly Progress</h3>
              <p className="text-xs text-slate-500 mt-1">View your 7-day tinnitus severity trend & sleep graph.</p>
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 mt-4">
                View Charts <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>
        </div>

        {/* Highlights & Daily Tip Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-[1.8rem] p-6 border border-purple-100 shadow-[0_20px_40px_rgba(99,102,241,0.08)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-600" /> Your Logging Summary
              </h3>
              <span className="text-xs font-semibold text-violet-500">Total entries: {symptomsCount}</span>
            </div>
            {symptomsCount > 0 ? (
              <div className="rounded-[1.75rem] border border-violet-100 bg-violet-50/60 p-5 flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-violet-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-violet-900 text-sm">Great job! You're doing well.</h4>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    Keep logging daily for better insights and progress.
                  </p>
                  <Link to="/progress" className="inline-block mt-3 text-sm font-semibold text-violet-700 underline hover:text-violet-900">
                    Go to Progress Graph →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.75rem] border border-amber-100 bg-amber-50/70 p-5 flex items-start gap-4">
                <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900 text-sm">No Daily Logged Check Yet</h4>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    Logging your sound type, duration, scaling, and sleep hours daily improves AI insights and recommendations.
                  </p>
                  <Link to="/daily-check" className="inline-block mt-3 text-sm font-semibold text-amber-700 underline hover:text-amber-900">
                    Log First Check Now →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-[1.8rem] p-6 border border-[#f3e8ff] bg-gradient-to-br from-[#fff7db] to-[#fff9eb] shadow-[0_20px_40px_rgba(99,102,241,0.08)]">
            <div className="absolute -top-6 right-6 h-24 w-24 rounded-full bg-amber-200/70 blur-2xl" />
            <div className="absolute left-0 bottom-0 h-24 w-24 rounded-full bg-amber-100/70 blur-2xl" />
            <div className="relative z-10 flex items-center gap-2 text-violet-700 font-semibold text-xs uppercase tracking-[0.24em] mb-4">
              <HeartHandshake className="w-4 h-4 text-violet-600" /> DAILY WELLNESS TIP
            </div>
            <div className="relative z-10 rounded-[1.6rem] border border-amber-100 bg-white/90 p-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-violet-100 text-violet-700 shadow-sm">
                  <span className="text-2xl">🌙</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-base">Sound Masking During Sleep</h4>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Playing low-volume broadband pink or brown noise can help reduce the perception of tinnitus and improve sleep quality.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative z-10 rounded-[1.5rem] bg-[#fff4d7] p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-700 uppercase tracking-[0.16em]">
                <span>Relaxing waveform</span>
                <span className="text-slate-500">Tonight</span>
              </div>
              <div className="mt-4 relative h-24 overflow-hidden rounded-3xl bg-[#fff8e9]">
                <div className="absolute left-6 top-4 h-8 w-8 rounded-full bg-white/90 shadow-sm" />
                <div className="absolute right-8 top-8 h-6 w-6 rounded-full bg-white/80 shadow-sm" />
                <svg viewBox="0 0 360 80" className="absolute inset-0 h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="waveGradient2" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.7" />
                      <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.5" />
                    </linearGradient>
                  </defs>
                  <path d="M0 50C24 50 26 35 48 35C70 35 70 60 94 60C118 60 118 30 142 30C166 30 166 55 190 55C214 55 214 25 238 25C262 25 262 45 286 45C310 45 310 33 334 33C358 33 360 50 360 50" stroke="url(#waveGradient2)" strokeWidth="8" strokeLinecap="round" />
                </svg>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/80">✨</span>
                <span>Use sound masking through sleep to soothe tinnitus awareness</span>
              </div>
            </div>
            <Link
              to="/sound-therapy"
              className="mt-6 relative z-10 inline-flex items-center justify-center w-full rounded-2xl bg-amber-500 py-3 text-sm font-semibold text-white shadow-sm shadow-amber-200 hover:bg-amber-600 transition-colors"
            >
              Try Pink Noise Therapy
            </Link>
          </div>
        </div>
      </div>
    );
}
