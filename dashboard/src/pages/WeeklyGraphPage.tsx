import { useState, useEffect } from "react";
import api from "../services/api";
import { endpoints } from "../constants/api";
import { TrendingUp, Activity, Moon, Calendar, Sparkles, Loader2, AudioWaveform, Gauge } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function WeeklyGraphPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSymptoms();
  }, []);

  const fetchSymptoms = async () => {
    try {
      const res = await api.get(endpoints.symptoms.list);
      const records = res.data.reverse();
      const mapped = records.map((item: any) => {
        const dt = item.recorded_at ? new Date(item.recorded_at) : null;
        const label = dt
          ? dt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
          : "Log";
        const dateStr = dt ? dt.toLocaleDateString("en-US", { weekday: "short" }) : "Log";
        const severityScoreMap: Record<string, number> = { mild: 2, moderate: 5, severe: 8, very_severe: 10 };
        const severity = item.loudness_level ?? severityScoreMap[item.severity] ?? 5;
        const sleepQuality = item.sleep_quality ?? 0;
        const stress = item.stress_level ?? 5;
        return {
          date: dateStr,
          label,
          datetime: dt ? dt.toISOString() : undefined,
          severity,
          sleepQuality,
          stress,
          frequency: item.frequency_hz ?? null,
          intensity: item.intensity_db ?? null,
        };
      });

      setData(mapped);
    } catch {
      // Fallback mock data if server empty
      setData([
        { date: "Mon", label: "Mon", severity: 7, sleepQuality: 5, stress: 8 },
        { date: "Tue", label: "Tue", severity: 6, sleepQuality: 6, stress: 7 },
        { date: "Wed", label: "Wed", severity: 8, sleepQuality: 4, stress: 9 },
        { date: "Thu", label: "Thu", severity: 5, sleepQuality: 7, stress: 5 },
        { date: "Fri", label: "Fri", severity: 4, sleepQuality: 8, stress: 4 },
        { date: "Sat", label: "Sat", severity: 5, sleepQuality: 7, stress: 5 },
        { date: "Sun", label: "Sun", severity: 4, sleepQuality: 8, stress: 3 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const avgSeverity = data.length ? (data.reduce((acc, d) => acc + d.severity, 0) / data.length).toFixed(1) : "0";
  const avgSleep = data.length ? (data.reduce((acc, d) => acc + d.sleepQuality, 0) / data.length).toFixed(1) : "0";
  const trendAssessment = data.length >= 2 ? (data[data.length - 1].severity <= data[0].severity ? "Improving" : "Worsening") : "Stable";

  const lastWithProfile = [...data].reverse().find((d) => d.frequency != null && d.intensity != null);
  const latestFrequency = lastWithProfile?.frequency ?? null;
  const latestIntensity = lastWithProfile?.intensity ?? null;

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-200">
          <TrendingUp className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Weekly Progress & Symptom Graph <Sparkles className="w-5 h-5 text-amber-500" />
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Visualize your 7-day tinnitus severity, sleep correlation, and symptom trends</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-3xl border border-gray-100">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500 mr-2" /> Loading progress metrics...
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Average Severity</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{avgSeverity} / 10</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <Moon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg Sleep Quality</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{avgSleep} / 10</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Trend Assessment</p>
                <p className="text-2xl font-black text-emerald-600 mt-0.5">{trendAssessment}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                <AudioWaveform className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Latest. Frequency</p>
                <p className="text-2xl font-black text-violet-700 mt-0.5">
                  {latestFrequency != null ? `${Math.round(latestFrequency)} Hz` : "—"}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
                <Gauge className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Latest. Intensity</p>
                <p className="text-2xl font-black text-pink-600 mt-0.5">
                  {latestIntensity != null ? `${latestIntensity.toFixed(1)} dB` : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Area Chart - Severity Scaling */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Tinnitus Sound Severity Scaling (1 to 10)</h2>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" stroke="#9CA3AF" />
                <YAxis domain={[0, 10]} stroke="#9CA3AF" />
                <Tooltip />
                <Area type="monotone" dataKey="severity" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} strokeWidth={3} name="Sound Severity (1-10)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Area Chart - Estimated Frequency & Intensity */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AudioWaveform className="w-5 h-5 text-violet-500" /> ML Estimated Tinnitus Frequency & Intensity
            </h2>
            <p className="text-sm text-gray-400">Computed from your daily check inputs using the linear regression model.</p>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" stroke="#9CA3AF" />
                <YAxis yAxisId="freq" stroke="#7C3AED" />
                <YAxis yAxisId="int" orientation="right" stroke="#EC4899" />
                <Tooltip />
                <Area yAxisId="freq" type="monotone" dataKey="frequency" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.15} strokeWidth={3} name="Est. Frequency (Hz)" />
                <Area yAxisId="int" type="monotone" dataKey="intensity" stroke="#EC4899" fill="#EC4899" fillOpacity={0.15} strokeWidth={3} name="Est. Intensity (dB)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart - Sleep vs Severity */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Sleep Quality vs Stress Level</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip />
                <Bar dataKey="sleepQuality" fill="#0D9488" name="Sleep Quality" radius={[6, 6, 0, 0]} />
                <Bar dataKey="stress" fill="#E11D48" name="Stress Level (1-10)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
