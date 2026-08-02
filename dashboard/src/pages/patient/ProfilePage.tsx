import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { endpoints } from "../../constants/api";
import { User, Ear, Heart, Battery, Edit3, Loader2, FileHeart, ChevronRight } from "lucide-react";

const calculateAge = (dateString?: string | null) => {
  if (!dateString) return "Not specified";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Not specified";
  const diffMs = Date.now() - date.getTime();
  const age = Math.floor(diffMs / 31557600000);
  return age > 0 ? String(age) : "Not specified";
};

const formatDateOfBirth = (dateString?: string | null) => {
  if (!dateString) return "Not specified";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Not specified";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(endpoints.auth.profileDetails)
      .then((r) => setProfile(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-teal-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-teal-200">
            {user?.full_name?.charAt(0) || "P"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.full_name}</h1>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              Patient Account
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate("/create-profile")}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-50 text-teal-700 font-bold hover:bg-teal-100 transition-colors text-sm border border-teal-200"
        >
          <Edit3 className="w-4 h-4" /> Edit Profile Details
        </button>
      </div>

      <button
        onClick={() => navigate("/medical-history")}
        className="w-full flex items-center justify-between gap-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-3xl p-6 border border-teal-700 shadow-lg shadow-teal-200 hover:shadow-teal-300 transition-shadow text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
            <FileHeart className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold">Patient Medical History</p>
            <p className="text-sm text-teal-50/90">Review all assessments grouped by Low, Medium & High risk with risk timeline</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 flex-shrink-0" />
      </button>

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-3xl border border-gray-100">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600 mr-2" /> Loading profile details...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
              <User className="w-5 h-5 text-teal-600" /> Basic Information
            </h3>
            <div className="divide-y divide-gray-100 text-sm">
              <div className="py-2.5 flex justify-between"><span className="text-gray-500">Age:</span><span className="font-medium">{calculateAge(profile?.date_of_birth)}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-gray-500">Date of Birth:</span><span className="font-medium">{formatDateOfBirth(profile?.date_of_birth)}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-gray-500">Gender:</span><span className="font-medium capitalize">{profile?.gender || "Not specified"}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-gray-500">Occupation:</span><span className="font-medium">{profile?.occupation || "Not specified"}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-gray-500">Height / Weight:</span><span className="font-medium">{profile?.height || "5'10"} / {profile?.weight || "70 kg"}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-gray-500">Hearing Aid:</span><span className="font-medium capitalize">{profile?.hearing_aid || "No"}</span></div>
            </div>
          </div>

          {/* Medical History */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
              <Heart className="w-5 h-5 text-rose-500" /> Medical History
            </h3>
            <div className="divide-y divide-gray-100 text-sm">
              <div className="py-2.5 flex justify-between"><span className="text-gray-500">Conditions:</span><span className="font-medium">{profile?.medical_conditions || "Stress, Anxiety"}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-gray-500">Medications:</span><span className="font-medium">{profile?.medications || "None"}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-gray-500">Family History:</span><span className="font-medium">{profile?.family_history || "None"}</span></div>
              <div className="py-2.5"><span className="text-gray-500">Medical History Notes:</span><div className="mt-2 text-sm text-gray-700">{profile?.medical_history || "No medical history recorded."}</div></div>
            </div>
          </div>

          {/* Tinnitus Description */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
              <Ear className="w-5 h-5 text-amber-500" /> Tinnitus Details
            </h3>
            <div className="divide-y divide-gray-100 text-sm">
              <div className="py-2.5 flex justify-between"><span className="text-gray-500">Affected Ear:</span><span className="font-medium">{profile?.affected_ear || "Both"}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-gray-500">Sound Type:</span><span className="font-medium">{profile?.sound_type || "High-pitched Ringing"}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-gray-500">Duration:</span><span className="font-medium">{profile?.tinnitus_duration || "Hours"}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-gray-500">Onset:</span><span className="font-medium">{profile?.tinnitus_onset || "6 months"}</span></div>
            </div>
          </div>

          {/* Lifestyle Habits */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
              <Battery className="w-5 h-5 text-purple-500" /> Lifestyle Habits
            </h3>
            <div className="divide-y divide-gray-100 text-sm">
              <div className="py-2.5 flex justify-between"><span className="text-gray-500">Sleep Hours:</span><span className="font-medium">{profile?.sleep_hours || "7 hrs"}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-gray-500">Caffeine Intake:</span><span className="font-medium capitalize">{profile?.caffeine || profile?.coffee_intake || "1 cup"}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-gray-500">Substance Consumption:</span><span className="font-medium capitalize">{profile?.substance_consumption || profile?.alcohol || "None"}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-gray-500">Daily Stress:</span><span className="font-medium capitalize">{profile?.daily_stress || "Moderate"}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-gray-500">Noise Exposure:</span><span className="font-medium capitalize">{profile?.noise_exposure || "Low"}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
