import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingDown, AlertCircle, CheckCircle } from "lucide-react";

const symptomTrend = [
  { month: "Jan", avgSeverity: 4.2, flareUps: 3 },
  { month: "Feb", avgSeverity: 4.5, flareUps: 5 },
  { month: "Mar", avgSeverity: 3.8, flareUps: 2 },
  { month: "Apr", avgSeverity: 4.1, flareUps: 4 },
  { month: "May", avgSeverity: 3.5, flareUps: 2 },
  { month: "Jun", avgSeverity: 3.2, flareUps: 1 },
  { month: "Jul", avgSeverity: 3.0, flareUps: 2 },
];

const triggerImpact = [
  { trigger: "Stress", impact: 85, weeks: 6 },
  { trigger: "Loud Noise", impact: 72, weeks: 5 },
  { trigger: "Lack of Sleep", impact: 68, weeks: 4 },
  { trigger: "Caffeine", impact: 55, weeks: 3 },
  { trigger: "Alcohol", impact: 45, weeks: 2 },
  { trigger: "Weather Change", impact: 35, weeks: 2 },
];

const recoveryRate = [
  { week: "W1", withPlan: 60, withoutPlan: 30 },
  { week: "W2", withPlan: 65, withoutPlan: 32 },
  { week: "W3", withPlan: 72, withoutPlan: 35 },
  { week: "W4", withPlan: 78, withoutPlan: 38 },
  { week: "W5", withPlan: 82, withoutPlan: 40 },
  { week: "W6", withPlan: 85, withoutPlan: 42 },
];

const stats = [
  {
    label: "Weekly Severity",
    value: "3.2",
    description: "Your average tinnitus intensity over the past 7 days.",
    icon: TrendingDown,
    badge: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Current Agree Plan",
    value: "78%",
    description: "How often you followed your care plan this month.",
    icon: CheckCircle,
    badge: "bg-sky-50 text-sky-700",
  },
  {
    label: "Recent Flare-ups",
    value: "2",
    description: "Number of moderate or severe flare-ups last week.",
    icon: AlertCircle,
    badge: "bg-amber-50 text-amber-700",
  },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 p-8 text-white shadow-xl overflow-hidden relative">
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.25em] text-teal-200">Your Progress</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Personal tinnitus analytics</h1>
          <p className="mt-3 max-w-2xl text-sm text-teal-100">
            See how your symptoms, triggers, and care plan consistency are changing over time. Use this view to stay on top of trends and adapt your routine.
          </p>
        </div>
        <div className="absolute -right-16 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{stat.label}</p>
                <p className="mt-4 text-3xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <div className={`rounded-2xl p-3 ${stat.badge}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">{stat.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Symptom Severity Trend</h2>
              <p className="text-sm text-gray-500 mt-1">Track average intensity and flare-up counts per month.</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Up-to-date
            </span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={symptomTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" domain={[0, 10]} />
              <Tooltip />
              <Area type="monotone" dataKey="avgSeverity" stroke="#14B8A6" fill="#14B8A6" fillOpacity={0.16} name="Avg Severity" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Trigger Patterns</h2>
              <p className="text-sm text-gray-500 mt-1">Most common triggers linked to your symptoms.</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              6 triggers
            </span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={triggerImpact} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#9CA3AF" domain={[0, 100]} />
              <YAxis dataKey="trigger" type="category" stroke="#9CA3AF" width={120} />
              <Tooltip />
              <Bar dataKey="impact" fill="#6366F1" name="Impact Score" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recovery Rate</h2>
          <p className="text-sm text-gray-500 mb-4">Compare your progress when following the care plan against baseline recovery trends.</p>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={recoveryRate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="withPlan" stroke="#16A34A" strokeWidth={2} name="With Care Plan" dot={{ fill: "#16A34A" }} />
              <Line type="monotone" dataKey="withoutPlan" stroke="#DC2626" strokeWidth={2} name="Without Care Plan" dot={{ fill: "#DC2626" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actionable Insight</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div className="rounded-3xl bg-slate-50 p-4 border border-slate-100">
              <p className="font-semibold text-slate-900">Sleep impact is strong</p>
              <p className="mt-2">Your trending data suggests stress and poor sleep are closely linked to symptom spikes. Prioritize a consistent bedtime routine and low-volume sound therapy.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4 border border-slate-100">
              <p className="font-semibold text-slate-900">Keep following your care plan</p>
              <p className="mt-2">Recovery scores are higher when care plan steps are followed. Continue daily check-ins to help the AI adjust your personalized recommendations.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4 border border-slate-100">
              <p className="font-semibold text-slate-900">Watch the next week</p>
              <p className="mt-2">Consistent logging makes it easier to spot triggers over time. Try to log each symptom entry for better accuracy in your progress metrics.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
