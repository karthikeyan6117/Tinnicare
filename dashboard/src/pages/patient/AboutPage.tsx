import { Info, Shield, Cpu, Activity, Heart, Sparkles } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-200">
          <Info className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">About TinniCare</h1>
        <p className="text-gray-600 text-base leading-relaxed">
          TinniCare is a digital health platform designed to transform tinnitus therapy and daily symptom management through machine learning risk predictions and personalized AI assistance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">LangChain & ML AI Engine</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Combines linear regression predictive modeling for symptom severity flare-ups with LangChain LCEL pipelines powered by Groq LLaMA 3.3 70B for clinical narrative generation.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Sound Therapy Studio</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Live Web Audio API sound generator delivering broadband white, pink, and brown noise alongside modulated ocean waves, rain, and mountain wind soundscapes.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Clinical Privacy & Safety</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            All medical records, daily checks, and AI interactions are encrypted and backed up securely via Supabase PostgreSQL infrastructure.
          </p>
        </div>
      </div>
    </div>
  );
}
