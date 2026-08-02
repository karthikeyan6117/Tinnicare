import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Activity, User, Mail, Phone, Calendar, Users, Lock, Eye, EyeOff, Weight, Ruler, Briefcase, Ear } from "lucide-react";

interface FormData {
  fullName: string;
  email: string;
  mobile: string;
  dob: string;
  gender: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const [form, setForm] = useState<FormData>({
    fullName: "", email: "", mobile: "", dob: "",
    gender: "", password: "", confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.fullName || !form.email || !form.password || !form.confirmPassword) {
      setError("Please fill in all required fields");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await register(form.email, form.password, form.fullName, {
        gender: form.gender || undefined,
      });
      navigate("/login", { state: { registered: true } });
    } catch (err: unknown) {
      let message = "Registration failed";
      if (err instanceof Error && "response" in err) {
        const data = (err as { response: { data: unknown } }).response?.data;
        message = typeof data === "string" ? data : (data as Record<string, unknown>)?.detail as string || message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const selectClass = "w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white appearance-none cursor-pointer";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center p-4 py-8">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-8 md:p-10 animate-fadeIn">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join TinniCare</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 mb-6 border border-red-100 animate-shake">
            {error}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step === 1 ? "bg-blue-500 text-white shadow-md shadow-blue-200" : "bg-gray-100 text-gray-400"}`}>1</div>
          <div className={`h-0.5 w-12 transition-all duration-300 ${step === 2 ? "bg-blue-500" : "bg-gray-200"}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step === 2 ? "bg-blue-500 text-white shadow-md shadow-blue-200" : "bg-gray-100 text-gray-400"}`}>2</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {step === 1 && (
            <div className="space-y-5 animate-slideIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    <User className="w-3.5 h-3.5 inline mr-1 text-blue-500" />
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className={inputClass} placeholder="Jane Doe" />
                </div>
                <div>
                  <label className={labelClass}>
                    <Mail className="w-3.5 h-3.5 inline mr-1 text-blue-500" />
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} placeholder="jane@example.com" />
                </div>
                <div>
                  <label className={labelClass}>
                    <Phone className="w-3.5 h-3.5 inline mr-1 text-blue-500" />
                    Mobile Number
                  </label>
                  <input type="tel" value={form.mobile} onChange={(e) => update("mobile", e.target.value)} className={inputClass} placeholder="+1 (555) 123-4567" />
                </div>
                <div>
                  <label className={labelClass}>
                    <Calendar className="w-3.5 h-3.5 inline mr-1 text-blue-500" />
                    Date of Birth
                  </label>
                  <input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>
                    <Users className="w-3.5 h-3.5 inline mr-1 text-blue-500" />
                    Gender
                  </label>
                  <select value={form.gender} onChange={(e) => update("gender", e.target.value)} className={selectClass}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <button type="button" onClick={() => setStep(2)} className="w-full bg-blue-500 text-white py-3.5 rounded-xl font-medium hover:bg-blue-600 transition-all duration-200 shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 active:scale-[0.98]">
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-slideIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>
                    <Lock className="w-3.5 h-3.5 inline mr-1 text-blue-500" />
                    Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} className={`${inputClass} pr-11`} placeholder="Min. 8 characters" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>
                    <Lock className="w-3.5 h-3.5 inline mr-1 text-blue-500" />
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} className={`${inputClass} pr-11`} placeholder="Repeat password" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-xl font-medium border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 active:scale-[0.98]">
                  ← Back
                </button>
                <button type="submit" disabled={loading} className="flex-[2] bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3.5 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          <span className="text-sm text-gray-400 font-medium">OR</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        </div>

        <button
          type="button"
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 active:scale-[0.98] group"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="group-hover:text-gray-900 transition-colors">Sign up with Google</span>
        </button>

        <p className="text-center text-sm text-gray-500 mt-8">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 font-medium hover:text-blue-600 hover:underline transition-colors">
            Sign In
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideIn { animation: slideIn 0.35s ease-out; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}
