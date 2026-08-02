import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, MoreVertical } from "lucide-react";

const mockPatients = [
  { id: "1", name: "Sarah Johnson", email: "sarah.j@email.com", risk: "high", severity: 8, lastVisit: "2026-07-28", status: "active", age: 45, tinnitusType: "Subjective" },
  { id: "2", name: "Michael Chen", email: "michael.c@email.com", risk: "medium", severity: 5, lastVisit: "2026-07-27", status: "active", age: 38, tinnitusType: "Subjective" },
  { id: "3", name: "Emily Davis", email: "emily.d@email.com", risk: "low", severity: 2, lastVisit: "2026-07-25", status: "active", age: 29, tinnitusType: "Objective" },
  { id: "4", name: "James Wilson", email: "james.w@email.com", risk: "medium", severity: 6, lastVisit: "2026-07-26", status: "active", age: 52, tinnitusType: "Subjective" },
  { id: "5", name: "Lisa Anderson", email: "lisa.a@email.com", risk: "low", severity: 3, lastVisit: "2026-07-24", status: "inactive", age: 34, tinnitusType: "Subjective" },
  { id: "6", name: "Robert Martinez", email: "robert.m@email.com", risk: "high", severity: 9, lastVisit: "2026-07-28", status: "active", age: 61, tinnitusType: "Subjective" },
  { id: "7", name: "Jennifer Taylor", email: "jennifer.t@email.com", risk: "low", severity: 1, lastVisit: "2026-07-22", status: "active", age: 27, tinnitusType: "Objective" },
  { id: "8", name: "David Brown", email: "david.b@email.com", risk: "medium", severity: 4, lastVisit: "2026-07-20", status: "inactive", age: 43, tinnitusType: "Subjective" },
];

const riskColors: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

const getSeverityBar = (severity: number) => {
  if (severity > 6) return "bg-red-500";
  if (severity > 3) return "bg-yellow-500";
  return "bg-green-500";
};

export default function PatientsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = mockPatients.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || p.risk === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-500 mt-1">Manage and monitor your tinnitus patients</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b border-gray-100 bg-gray-50">
              <th className="px-6 py-4 font-medium">Patient</th>
              <th className="px-6 py-4 font-medium">Age</th>
              <th className="px-6 py-4 font-medium">Tinnitus Type</th>
              <th className="px-6 py-4 font-medium">Risk Level</th>
              <th className="px-6 py-4 font-medium">Severity</th>
              <th className="px-6 py-4 font-medium">Last Visit</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((patient) => (
              <tr key={patient.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                      {patient.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <button onClick={() => navigate(`/patients/${patient.id}`)} className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-left">
                        {patient.name}
                      </button>
                      <p className="text-sm text-gray-500">{patient.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{patient.age}</td>
                <td className="px-6 py-4 text-gray-600">{patient.tinnitusType}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${riskColors[patient.risk]}`}>
                    {patient.risk}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getSeverityBar(patient.severity)}`}
                        style={{ width: `${(patient.severity / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{patient.severity}/10</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">{patient.lastVisit}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    patient.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {patient.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
