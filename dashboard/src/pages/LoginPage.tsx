import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Activity, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const location = useLocation();
  const registered = location.state?.registered;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      let message = "Login failed";
      if (err instanceof Error) {
        if ("response" in err) {
          const resp = (err as { response: { data: unknown } }).response;
          if (resp?.data) {
            const data = resp.data;
            message = typeof data === "string" ? data : (data as Record<string, unknown>)?.detail as string || message;
          } else {
            message = "Cannot reach server. Check your connection.";
          }
        } else {
          message = err.message || message;
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <Activity className="w-12 h-12 text-blue-500 mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">TinniCare</h1>
          <p className="text-gray-500 text-sm mt-1">Smart Tinnitus Management & Care Portal</p>
        </div>

        {registered && (
          <div className="bg-green-50 text-green-700 text-sm rounded-lg p-3 mb-4 flex items-center gap-2 border border-green-200">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Account created successfully! Please sign in.
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-500 font-medium hover:text-blue-600 hover:underline transition-colors">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
