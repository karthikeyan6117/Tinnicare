import { PhoneCall, Mail, MessageSquare, AlertTriangle } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex items-center gap-4 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-200">
          <PhoneCall className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Us & Support</h1>
          <p className="text-gray-500 text-sm mt-0.5">We are here to support your tinnitus care journey</p>
        </div>
      </div>

      <div className="bg-amber-50 rounded-3xl p-6 border border-amber-200/60 flex items-start gap-4 text-amber-900">
        <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong>Medical Emergency Notice:</strong> If you are experiencing sudden severe hearing loss, dizziness, severe pain, or distressing crisis, please contact your local emergency services (e.g. 911 / 112) or go to the nearest emergency department immediately.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Email Support</h3>
          <p className="text-xs text-gray-500">Reach our care coordination team for technical or account support.</p>
          <p className="text-sm font-semibold text-teal-600">support@tinnicare.health</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Instant AI Assistant</h3>
          <p className="text-xs text-gray-500">Get 24/7 answers to general tinnitus coping and habit questions.</p>
          <a href="/chat" className="inline-block text-xs font-semibold text-blue-600 underline">Open AI Assistant →</a>
        </div>
      </div>
    </div>
  );
}
