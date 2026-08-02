import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { type LucideIcon } from "lucide-react";
import {
  FileHeart,
  FileDown,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  Calendar,
  Search,
  Filter,
  Clock,
  Moon,
  Volume2,
  Activity,
  XCircle,
  Stethoscope,
  Sparkles,
  Gauge,
  Scale,
  ClipboardList,
  History,
  RotateCcw,
  Plus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { endpoints } from "../constants/api";

type RiskLevel = "low" | "medium" | "high";

interface HistoryPatient {
  id: string;
  full_name: string;
  email: string;
  age?: number | null;
  gender?: string | null;
  affected_ear?: string | null;
  sound_type?: string | null;
  tinnitus_duration?: string | null;
  medical_conditions?: string | null;
}

interface HistoryRecord {
  id: string;
  assessment_date: string;
  risk_level: RiskLevel;
  risk_score: number;
  thi_score: number;
  predicted_severity?: string | null;
  flare_up_probability?: number | null;
  recommendation?: string | null;
  doctor_notes?: string | null;
  model_version?: string | null;
  loudness?: number | null;
  stress_level?: number | null;
  stress_label?: string | null;
  sleep_quality?: number | null;
  sleep_hours?: string | null;
  duration_minutes?: number | null;
  duration_label?: string | null;
  sound_type?: string | null;
  tinnitus_duration?: string | null;
}

interface HistoryResponse {
  patient: HistoryPatient;
  total: number;
  low: number;
  medium: number;
  high: number;
  records: HistoryRecord[];
}

const RISK_META: Record<
  RiskLevel,
  {
    label: string;
    emoji: string;
    badge: string;
    dot: string;
    sectionBorder: string;
    iconBg: string;
    text: string;
    cardBorder: string;
    icon: LucideIcon;
    pdfColor: [number, number, number];
  }
> = {
  low: {
    label: "Low",
    emoji: "🟢",
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
    sectionBorder: "border-emerald-200/70",
    iconBg: "bg-emerald-50",
    text: "text-emerald-700",
    cardBorder: "border-emerald-100",
    icon: ShieldCheck,
    pdfColor: [16, 150, 105],
  },
  medium: {
    label: "Medium",
    emoji: "🟡",
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
    sectionBorder: "border-amber-200/70",
    iconBg: "bg-amber-50",
    text: "text-amber-700",
    cardBorder: "border-amber-100",
    icon: AlertTriangle,
    pdfColor: [217, 119, 6],
  },
  high: {
    label: "High",
    emoji: "🔴",
    badge: "bg-red-100 text-red-700 border border-red-200",
    dot: "bg-red-500",
    sectionBorder: "border-red-200/70",
    iconBg: "bg-red-50",
    text: "text-red-700",
    cardBorder: "border-red-100",
    icon: ShieldAlert,
    pdfColor: [220, 38, 38],
  },
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const RiskBadge = ({ level, showEmoji = false }: { level: RiskLevel; showEmoji?: boolean }) => {
  const meta = RISK_META[level];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${meta.badge}`}>
      {showEmoji && <span>{meta.emoji}</span>}
      {meta.label}
    </span>
  );
};

const Field = ({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: LucideIcon }) => (
  <div className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100 min-w-0">
    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
      {Icon && <Icon className="w-3 h-3" />} {label}
    </p>
    <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{value}</p>
  </div>
);

const SummaryCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: "teal" | "emerald" | "amber" | "red";
}) => {
  const styles = {
    teal: "bg-teal-50 text-teal-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  } as const;
  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${styles[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-2xl font-black text-gray-900 leading-tight">{value}</p>
      </div>
    </div>
  );
};

const FilterPill = ({
  active,
  onClick,
  dot,
  children,
}: {
  active: boolean;
  onClick: () => void;
  dot?: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
      active ? "bg-teal-600 text-white shadow-md shadow-teal-200" : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
    }`}
  >
    <span className="inline-flex items-center gap-1.5">
      {dot && <span className={`w-2 h-2 rounded-full ${dot} ${active ? "bg-white" : ""}`} />}
      {children}
    </span>
  </button>
);

function HistoryCard({
  record,
  canEditNotes,
  onSaveNotes,
}: {
  record: HistoryRecord;
  canEditNotes: boolean;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(record.doctor_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const meta = RISK_META[record.risk_level];

  return (
    <div className={`rounded-2xl border bg-white overflow-hidden ${meta.cardBorder}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-50/70 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.iconBg}`}>
            <Calendar className={`w-5 h-5 ${meta.text}`} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900">{formatDate(record.assessment_date)}</p>
            <p className="text-xs text-gray-500">{formatDateTime(record.assessment_date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">ML Score</p>
            <p className="text-base font-black text-gray-900 leading-tight">{record.risk_score.toFixed(1)}</p>
          </div>
          <RiskBadge level={record.risk_level} showEmoji />
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <Field label="THI Score" value={record.thi_score != null ? `${record.thi_score} / 100` : "—"} icon={Gauge} />
        <Field label="Loudness" value={record.loudness != null ? `${record.loudness} / 10` : "—"} icon={Volume2} />
        <Field label="Stress" value={record.stress_label ?? "—"} icon={Activity} />
        <Field label="Sleep" value={record.sleep_hours ?? "—"} icon={Moon} />
        <Field label="Duration" value={record.duration_label ?? "—"} icon={Clock} />
        <Field label="Sound Type" value={record.sound_type ?? "—"} icon={Volume2} />
      </div>

      <div className={`transition-all duration-300 ease-in-out ${open ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
        <div className="px-4 pb-4 space-y-3">
          {record.recommendation && (
            <div className="rounded-xl bg-teal-50/80 border border-teal-100 p-3.5">
              <p className="text-xs font-bold text-teal-700 flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5" /> AI Recommendation
              </p>
              <p className="text-sm text-teal-950 mt-1 leading-relaxed">{record.recommendation}</p>
            </div>
          )}

          {canEditNotes ? (
            <div className="rounded-xl bg-blue-50/80 border border-blue-100 p-3.5 space-y-2">
              <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5 uppercase tracking-wide">
                <Stethoscope className="w-3.5 h-3.5" /> Doctor Notes
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add clinical notes for this assessment..."
                rows={3}
                className="w-full p-2.5 rounded-lg border border-blue-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await onSaveNotes(record.id, notes);
                      setSavedFlash(true);
                      setTimeout(() => setSavedFlash(false), 2000);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Notes"}
                </button>
                {savedFlash && <span className="text-xs font-semibold text-emerald-600">Saved ✓</span>}
              </div>
            </div>
          ) : (
            record.doctor_notes && (
              <div className="rounded-xl bg-blue-50/80 border border-blue-100 p-3.5">
                <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5 uppercase tracking-wide">
                  <Stethoscope className="w-3.5 h-3.5" /> Doctor Notes
                </p>
                <p className="text-sm text-blue-950 mt-1 leading-relaxed whitespace-pre-wrap">{record.doctor_notes}</p>
              </div>
            )
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Field label="Predicted Severity" value={record.predicted_severity ?? "—"} icon={Scale} />
            <Field
              label="Flare-up Prob."
              value={record.flare_up_probability != null ? `${Math.round(record.flare_up_probability * 100)}%` : "—"}
              icon={Activity}
            />
            <Field label="Sleep Quality" value={record.sleep_quality != null ? `${record.sleep_quality} / 10` : "—"} icon={Moon} />
            <Field label="Model Version" value={record.model_version ?? "—"} icon={Sparkles} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  level,
  records,
  open,
  onToggle,
  canEditNotes,
  onSaveNotes,
}: {
  level: RiskLevel;
  records: HistoryRecord[];
  open: boolean;
  onToggle: () => void;
  canEditNotes: boolean;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
}) {
  const meta = RISK_META[level];
  const Icon = meta.icon;
  return (
    <div className={`bg-white rounded-3xl border ${meta.sectionBorder} shadow-sm overflow-hidden`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between gap-3 p-5 text-left transition-colors ${meta.iconBg} hover:brightness-95`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm ${meta.dot}`}>
            <Icon className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900">
              {meta.emoji} {meta.label} Risk History
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              {records.length} assessment{records.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${meta.badge}`}>{records.length}</span>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      <div className={`transition-all duration-300 ease-in-out ${open ? "max-h-[100000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
        <div className="p-5 space-y-3">
          {records.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No assessments in this category.</p>
          ) : (
            records.map((r) => (
              <HistoryCard key={r.id} record={r} canEditNotes={canEditNotes} onSaveNotes={onSaveNotes} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function MedicalHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  const [openSections, setOpenSections] = useState<Record<RiskLevel, boolean>>({ low: true, medium: true, high: true });
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(endpoints.assessments.history);
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load medical history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (riskFilter === "all") {
      setOpenSections({ low: true, medium: true, high: true });
    } else {
      setOpenSections((prev) => ({ ...prev, [riskFilter]: true }));
    }
  }, [riskFilter]);

  const records = useMemo(() => data?.records ?? [], [data]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (riskFilter !== "all" && r.risk_level !== riskFilter) return false;
      const d = new Date(r.assessment_date);
      if (dateFrom && d < new Date(`${dateFrom}T00:00:00`)) return false;
      if (dateTo && d > new Date(`${dateTo}T23:59:59`)) return false;
      if (search.trim() && !formatDate(r.assessment_date).toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [records, riskFilter, dateFrom, dateTo, search]);

  const timeline = useMemo(() => {
    return [...records]
      .filter((r) => {
        const d = new Date(r.assessment_date);
        if (dateFrom && d < new Date(`${dateFrom}T00:00:00`)) return false;
        if (dateTo && d > new Date(`${dateTo}T23:59:59`)) return false;
        if (search.trim() && !formatDate(r.assessment_date).toLowerCase().includes(search.trim().toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(a.assessment_date).getTime() - new Date(b.assessment_date).getTime());
  }, [records, dateFrom, dateTo, search]);

  const byLevel = (level: RiskLevel) => filtered.filter((r) => r.risk_level === level);

  const canEditNotes = user?.role === "doctor";

  const saveNotes = async (id: string, notes: string) => {
    await api.patch(`/assessments/${id}/notes`, { doctor_notes: notes });
    setData((prev) =>
      prev
        ? { ...prev, records: prev.records.map((r) => (r.id === id ? { ...r, doctor_notes: notes } : r)) }
        : prev,
    );
  };

  const hasFilters = riskFilter !== "all" || !!dateFrom || !!dateTo || !!search.trim();
  const clearFilters = () => {
    setRiskFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  };

  const downloadPdf = async () => {
    if (!records.length) return;
    setPdfLoading(true);
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;

      doc.setFillColor(13, 148, 136);
      doc.rect(0, 0, pageWidth, 26, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("TinniCare", margin, 12);
      doc.setFontSize(11);
      doc.text("Patient Medical History Report", margin, 19);

      const p = data?.patient ?? null;
      let y = 34;

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Patient Information", margin, y);
      y += 3;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      const infoLines = [
        `Name: ${p?.full_name ?? "—"}     Email: ${p?.email ?? "—"}`,
        `Age: ${p?.age ?? "—"}     Gender: ${p?.gender ?? "—"}     Affected Ear: ${p?.affected_ear ?? "—"}`,
        `Sound Type: ${p?.sound_type ?? "—"}     Tinnitus Duration: ${p?.tinnitus_duration ?? "—"}`,
        `Medical Conditions: ${p?.medical_conditions ?? "—"}`,
      ];
      infoLines.forEach((line) => {
        doc.text(line, margin + 2, y);
        y += 5;
      });
      y += 4;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Risk Summary", margin, y);
      y += 3;
      autoTable(doc, {
        startY: y,
        head: [["Total Assessments", "Low Risk", "Medium Risk", "High Risk"]],
        body: [[data?.total ?? 0, data?.low ?? 0, data?.medium ?? 0, data?.high ?? 0]],
        theme: "grid",
        headStyles: { fillColor: [13, 148, 136], fontSize: 10 },
        styles: { fontSize: 10, halign: "center", cellPadding: 5 },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 10;

      doc.text("Assessment Timeline", margin, y);
      y += 3;
      autoTable(doc, {
        startY: y,
        head: [["Assessment Date", "Risk Level", "ML Score", "THI Score"]],
        body: records.map((r) => [formatDate(r.assessment_date), r.risk_level.toUpperCase(), r.risk_score.toFixed(1), String(r.thi_score)]),
        theme: "striped",
        headStyles: { fillColor: [13, 148, 136], fontSize: 9.5 },
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 10;

      const levels: RiskLevel[] = ["high", "medium", "low"];
      for (const level of levels) {
        const items = records.filter((r) => r.risk_level === level);
        if (!items.length) continue;
        const meta = RISK_META[level];
        doc.setTextColor(meta.pdfColor[0], meta.pdfColor[1], meta.pdfColor[2]);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${meta.label.toUpperCase()} RISK HISTORY (${items.length})`, margin, y);
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "normal");
        y += 3;
        autoTable(doc, {
          startY: y,
          head: [["Date", "ML", "THI", "Loudness", "Stress", "Sleep", "Duration", "Sound Type", "AI Recommendation", "Doctor Notes"]],
          body: items.map((r) => [
            formatDate(r.assessment_date),
            r.risk_score.toFixed(1),
            String(r.thi_score),
            r.loudness != null ? `${r.loudness}/10` : "—",
            r.stress_label ?? "—",
            r.sleep_hours ?? "—",
            r.duration_label ?? "—",
            r.sound_type ?? "—",
            r.recommendation ?? "—",
            r.doctor_notes ?? "—",
          ]),
          theme: "striped",
          headStyles: { fillColor: meta.pdfColor, fontSize: 8.5 },
          styles: { fontSize: 8, overflow: "linebreak" },
          columnStyles: {
            0: { cellWidth: 24 },
            1: { cellWidth: 13 },
            2: { cellWidth: 13 },
            3: { cellWidth: 18 },
            4: { cellWidth: 15 },
            5: { cellWidth: 15 },
            6: { cellWidth: 18 },
            7: { cellWidth: 22 },
          },
          margin: { left: margin, right: margin },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }

      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8.5);
      doc.setTextColor(140, 140, 140);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `Generated: ${new Date().toLocaleString()}   •   TinniCare Medical History   •   Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: "center" },
        );
      }

      const fileName = `TinniCare-Medical-History-${(p?.full_name || "Patient").replace(/\s+/g, "-")}.pdf`;
      doc.save(fileName);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-200">
            <FileHeart className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient Medical History</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Complete assessment history categorized by risk level for quick clinical review
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate("/daily-check")}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-50 text-teal-700 font-bold hover:bg-teal-100 transition-colors text-sm border border-teal-200"
          >
            <Plus className="w-4 h-4" /> New Assessment
          </button>
          <button
            onClick={downloadPdf}
            disabled={!records.length || pdfLoading}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors text-sm shadow-md shadow-teal-200 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" /> {pdfLoading ? "Generating..." : "Download Medical History PDF"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
          <p className="font-semibold text-gray-800">Loading medical history...</p>
          <p className="text-xs text-gray-400">Retrieving assessment records & grouping by risk level.</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-3xl border border-red-100 flex items-center gap-3">
          <XCircle className="w-6 h-6 flex-shrink-0" /> {error}
        </div>
      ) : !records.length ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <FileHeart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No medical history yet</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Complete a Daily Tinnitus Check to generate your first ML risk assessment and build the patient's medical history.
          </p>
          <button
            onClick={() => navigate("/daily-check")}
            className="px-6 py-3 rounded-2xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors text-sm shadow-md shadow-teal-200"
          >
            Go to Daily Check
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <SummaryCard icon={ClipboardList} label="Total Assessments" value={data?.total ?? 0} color="teal" />
            <SummaryCard icon={ShieldCheck} label="Low Risk" value={data?.low ?? 0} color="emerald" />
            <SummaryCard icon={AlertTriangle} label="Medium Risk" value={data?.medium ?? 0} color="amber" />
            <SummaryCard icon={ShieldAlert} label="High Risk" value={data?.high ?? 0} color="red" />
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-teal-600" /> Filters
              </h2>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <FilterPill active={riskFilter === "all"} onClick={() => setRiskFilter("all")}>
                View All
              </FilterPill>
              <FilterPill active={riskFilter === "low"} onClick={() => setRiskFilter("low")} dot="bg-emerald-500">
                Low Risk
              </FilterPill>
              <FilterPill active={riskFilter === "medium"} onClick={() => setRiskFilter("medium")} dot="bg-amber-500">
                Medium Risk
              </FilterPill>
              <FilterPill active={riskFilter === "high"} onClick={() => setRiskFilter("high")} dot="bg-red-500">
                High Risk
              </FilterPill>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Search by Assessment Date</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. 10 Jul 2026"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-5">
              <History className="w-4 h-4 text-teal-600" /> Risk Timeline
              <span className="text-xs font-semibold text-gray-400 normal-case">(chronological progression)</span>
            </h2>
            <div className="relative border-l-2 border-gray-100 pl-6 ml-2 space-y-4">
              {timeline.map((r) => (
                <div key={r.id} className="relative">
                  <span className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full ${RISK_META[r.risk_level].dot} ring-4 ring-white shadow`} />
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-bold text-gray-900">{formatDate(r.assessment_date)}</span>
                    <span className="text-gray-300">•</span>
                    <RiskBadge level={r.risk_level} showEmoji />
                    <span className="text-xs text-gray-400 font-medium">ML {r.risk_score.toFixed(1)}</span>
                  </div>
                </div>
              ))}
              {timeline.length === 0 && (
                <p className="text-sm text-gray-400 py-4">No assessments match the current filters.</p>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <Section
              level="low"
              records={byLevel("low")}
              open={openSections.low}
              onToggle={() => setOpenSections((prev) => ({ ...prev, low: !prev.low }))}
              canEditNotes={canEditNotes}
              onSaveNotes={saveNotes}
            />
            <Section
              level="medium"
              records={byLevel("medium")}
              open={openSections.medium}
              onToggle={() => setOpenSections((prev) => ({ ...prev, medium: !prev.medium }))}
              canEditNotes={canEditNotes}
              onSaveNotes={saveNotes}
            />
            <Section
              level="high"
              records={byLevel("high")}
              open={openSections.high}
              onToggle={() => setOpenSections((prev) => ({ ...prev, high: !prev.high }))}
              canEditNotes={canEditNotes}
              onSaveNotes={saveNotes}
            />
          </div>
        </>
      )}
    </div>
  );
}
