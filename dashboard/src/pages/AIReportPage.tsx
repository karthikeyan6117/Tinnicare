import { useState, useEffect } from "react";
import api from "../services/api";
import { endpoints } from "../constants/api";
import { FileText, Sparkles, AlertCircle, Loader2, CheckCircle2, RefreshCw } from "lucide-react";

export default function AIReportPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/reports/generate");
      setReport(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to generate AI health report");
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    const r = (risk || "medium").toLowerCase();
    if (r === "high") return "bg-red-100 text-red-700 border-red-200";
    if (r === "medium") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              LangChain Clinical AI Report <Sparkles className="w-5 h-5 text-amber-400" />
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Synthesized patient history, ML Linear Regression risk scoring & clinical narrative</p>
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors text-sm border border-blue-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Regenerate Report
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="font-semibold text-gray-800">Generating Comprehensive AI Report...</p>
          <p className="text-xs text-gray-400">Retrieving patient symptom history, trigger logs & running LangChain LCEL pipeline.</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-3xl border border-red-100 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 flex-shrink-0" /> {error}
        </div>
      ) : report ? (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-8 animate-slideIn">
          {/* Top Score Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Patient Summary</span>
              <p className="font-bold text-gray-900 mt-1">{report.patient_summary || "Patient Medical Overview"}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ML Predicted Severity</span>
              <p className="text-3xl font-black text-blue-600 mt-0.5">{report.severity_score || "5.0"} / 10</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Risk Level</span>
              <div className="mt-1">
                <span className={`px-4 py-1 rounded-full text-xs font-extrabold uppercase border ${getRiskBadge(report.risk_level)}`}>
                  {report.risk_level || "Medium"} Risk
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Insights */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" /> Clinical Assessment Narrative
            </h3>
            <div className="p-5 rounded-2xl bg-gray-50/80 border border-gray-100 text-sm text-gray-700 leading-relaxed">
              {report.clinical_insights}
            </div>
          </div>

          {/* Key Triggers */}
          {report.key_triggers && report.key_triggers.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 text-lg">Identified Tinnitus Triggers</h3>
              <div className="flex flex-wrap gap-2">
                {report.key_triggers.map((trig: string, idx: number) => (
                  <span key={idx} className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
                    ⚠️ {trig}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Care Plan */}
          {report.actionable_care_plan && (
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 text-lg">Actionable Care Plan</h3>
              <div className="space-y-2">
                {report.actionable_care_plan.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-sm text-emerald-950 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
