import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, Users, LogOut,
  ClipboardList, MessageSquare, Volume2, TrendingUp, User, Info, BookOpen, PhoneCall, FileHeart,
} from "lucide-react";
import logo from "../assets/tinni.jpeg";

const patientNavMain = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/daily-check", label: "Daily Check", icon: ClipboardList },
  { to: "/chat", label: "AI Assistant", icon: MessageSquare },
  { to: "/sound-therapy", label: "Sound Therapy", icon: Volume2 },
  { to: "/progress", label: "Progress Graph", icon: TrendingUp },
  { to: "/medical-history", label: "Medical History", icon: FileHeart },
];

const patientNavMenu = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/about", label: "About TinniCare", icon: Info },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/contact", label: "Contact Us", icon: PhoneCall },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-[#f5f3ff]">
      <aside className="w-72 bg-[#f7f5ff] border-r border-purple-100 flex flex-col shadow-sm">
        <div className="p-6 border-b border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-3xl overflow-hidden bg-white shadow-lg shadow-violet-200/50">
              <img src={logo} alt="TinniCare logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">TinniCare</h1>
              <p className="text-xs font-semibold text-slate-500">Patient Care Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Main Features</p>
            <div className="space-y-1">
              {patientNavMain.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-white text-violet-700 shadow-[0_10px_30px_rgba(139,92,246,0.08)]"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 text-violet-500" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Menu & Support</p>
            <div className="space-y-1">
              {patientNavMenu.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-white text-violet-700 shadow-[0_10px_30px_rgba(139,92,246,0.08)]"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 text-violet-400" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-purple-100 bg-[#f7f5ff]">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm bg-violet-600">
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 w-full rounded-2xl text-sm font-semibold text-violet-700 bg-white border border-purple-100 hover:bg-violet-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50/30">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
