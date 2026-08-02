import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";

const patientData = {
  id: "1",
  name: "Sarah Johnson",
  email: "sarah.j@email.com",
  age: 45,
  risk: "high",
  severity: 8,
  type: "Subjective",
  since: "2024-03",
  status: "active",
  phone: "(555) 123-4567",
  notes: "Patient reports high-pitched ringing in both ears. Triggers include stress and lack of sleep.",
};

const symptomHistory = [
  { date: "Jul 22", severity: 7, sleep: 4, stress: 8 },
  { date: "Jul 23", severity: 8, sleep: 3, stress: 9 },
  { date: "Jul 24", severity: 6, sleep: 5, stress: 7 },
  { date: "Jul 25", severity: 8, sleep: 3, stress: 9 },
  { date: "Jul 26", severity: 7, sleep: 4, stress: 8 },
  { date: "Jul 27", severity: 9, sleep: 2, stress: 9 },
  { date: "Jul 28", severity: 8, sleep: 3, stress: 8 },
];

const recentAssessments = [
  {
    date: "10 Jul 2026",
    loudness: 3,
    stress: "Low",
    sleep: "8 hrs",
    duration: "15 min",
    thi_score: 18,
    ml_score: 2.1,
    risk_level: "low",
    recommendation: "Continue healthy lifestyle",
  },
  {
    date: "15 Jul 2026",
    loudness: 4,
    stress: "Medium",
    sleep: "7 hrs",
    duration: "30 min",
    thi_score: 28,
    ml_score: 3.8,
    risk_level: "low",
    recommendation: "Monitor symptoms weekly",
  },
  {
    date: "20 Jul 2026",
    loudness: 5,
    stress: "Medium",
    sleep: "6 hrs",
    duration: "1 hr",
    thi_score: 42,
    ml_score: 5.2,
    risk_level: "medium",
    recommendation: "Start daily sound therapy",
  },
  {
    date: "24 Jul 2026",
    loudness: 6,
    stress: "High",
    sleep: "5 hrs",
    duration: "2 hrs",
    thi_score: 55,
    ml_score: 6.4,
    risk_level: "medium",
    recommendation: "Practice relaxation exercises",
  },
  {
    date: "28 Jul 2026",
    loudness: 8,
    stress: "High",
    sleep: "4 hrs",
    duration: "4 hrs",
    thi_score: 76,
    ml_score: 8.5,
    risk_level: "high",
    recommendation: "Consult ENT specialist",
  },
  {
    date: "31 Jul 2026",
    loudness: 7,
    stress: "Medium",
    sleep: "6 hrs",
    duration: "2 hrs",
    thi_score: 65,
    ml_score: 7.0,
    risk_level: "medium",
    recommendation: "Continue therapy and follow-up",
  },
];

const carePlanActivities = [
  { activity: "Sound Therapy", frequency: "Daily", duration: "30 min", status: "on-track" },
  { activity: "Stress Meditation", frequency: "Daily", duration: "15 min", status: "on-track" },
  { activity: "Sleep Hygiene", frequency: "Daily", duration: "—", status: "needs-attention" },
  { activity: "Physical Exercise", frequency: "3x/week", duration: "45 min", status: "on-track" },
];

export default function PatientDetailPage() {
  useParams();
  const navigate = useNavigate();

  const getRiskBadge = (risk: string) => {
    const styles: Record<string, string> = {
      high: "bg-red-100 text-red-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-green-100 text-green-700",
    };
    return styles[risk] || styles.low;
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/patients")}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Patients
      </button>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
              SJ
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patientData.name}</h1>
              <p className="text-gray-500">{patientData.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-gray-500">{patientData.age} yrs</span>
                <span className="text-gray-300">|</span>
                <span className="text-sm text-gray-500">{patientData.type}</span>
                <span className="text-gray-300">|</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getRiskBadge(patientData.risk)}`}>
                  {patientData.risk} risk
                </span>
              </div>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            patientData.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            {patientData.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Symptom & Sleep Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={symptomHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis domain={[0, 10]} stroke="#9CA3AF" />
              <Tooltip />
              <Area type="monotone" dataKey="severity" stroke="#F44336" fill="#F44336" fillOpacity={0.1} name="Severity" />
              <Area type="monotone" dataKey="sleep" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.1} name="Sleep Quality" />
              <Area type="monotone" dataKey="stress" stroke="#FFC107" fill="#FFC107" fillOpacity={0.1} name="Stress Level" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Care Plan Progress</h2>
          <div className="space-y-4">
            {carePlanActivities.map((act, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{act.activity}</p>
                  <p className="text-sm text-gray-500">{act.frequency} &middot; {act.duration}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  act.status === "on-track" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}>
                  {act.status === "on-track" ? "On Track" : "Needs Attention"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Risk Assessment History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-4 font-medium">Assessment Date</th>
                <th className="px-6 py-4 font-medium">Loudness</th>
                <th className="px-6 py-4 font-medium">Stress</th>
                <th className="px-6 py-4 font-medium">Sleep</th>
                <th className="px-6 py-4 font-medium">Duration</th>
                <th className="px-6 py-4 font-medium">THI Score</th>
                <th className="px-6 py-4 font-medium">ML Score</th>
                <th className="px-6 py-4 font-medium">Risk Level</th>
                <th className="px-6 py-4 font-medium">AI Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {recentAssessments.map((a, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{a.date}</td>
                  <td className="px-6 py-4">{a.loudness}</td>
                  <td className="px-6 py-4">{a.stress}</td>
                  <td className="px-6 py-4">{a.sleep}</td>
                  <td className="px-6 py-4">{a.duration}</td>
                  <td className="px-6 py-4">{a.thi_score}</td>
                  <td className="px-6 py-4">{a.ml_score}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getRiskBadge(a.risk_level)}`}>
                      {a.risk_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{a.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
