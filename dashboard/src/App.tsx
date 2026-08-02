import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import api from "./services/api";
import { endpoints } from "./constants/api";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CreateProfilePage from "./pages/CreateProfilePage";
import DashboardPage from "./pages/DashboardPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import DailyCheckPage from "./pages/DailyCheckPage";
import PatientChatPage from "./pages/PatientChatPage";
import SoundTherapyPage from "./pages/SoundTherapyPage";
import WeeklyGraphPage from "./pages/WeeklyGraphPage";
import MedicalHistoryPage from "./pages/MedicalHistoryPage";
import ProfilePage from "./pages/patient/ProfilePage";
import AboutPage from "./pages/patient/AboutPage";
import LearnPage from "./pages/patient/LearnPage";
import ContactPage from "./pages/patient/ContactPage";
import AIReportPage from "./pages/AIReportPage";
import Layout from "./components/Layout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [profileChecked, setProfileChecked] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get(endpoints.auth.profileStatus).then(r => {
      if (!r.data.completed) setNeedsProfile(true);
    }).catch(() => {}).finally(() => setProfileChecked(true));
  }, [user]);

  if (isLoading) return <div className="flex h-screen items-center justify-center text-gray-500 font-medium">Loading TinniCare...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!profileChecked) return <div className="flex h-screen items-center justify-center text-teal-600 font-medium">Checking profile...</div>;
  if (needsProfile) return <Navigate to="/create-profile" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-gray-500 font-medium">Loading TinniCare...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/create-profile" element={user ? <CreateProfilePage /> : <Navigate to="/login" replace />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        {/* Patient Feature Routes */}
        <Route path="daily-check" element={<DailyCheckPage />} />
        <Route path="chat" element={<PatientChatPage />} />
        <Route path="sound-therapy" element={<SoundTherapyPage />} />
        <Route path="progress" element={<WeeklyGraphPage />} />
        <Route path="medical-history" element={<MedicalHistoryPage />} />
        {/* Patient Menu Routes */}
        <Route path="profile" element={<ProfilePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="learn" element={<LearnPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="ai-report" element={<AIReportPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
