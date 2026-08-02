import { useState } from "react";
import { Bell, Palette, Database, Save } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: true,
    emailReports: true,
    criticalAlerts: true,
    weeklyDigest: false,
    darkMode: false,
    compactView: false,
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sections = [
    {
      title: "Notifications",
      icon: Bell,
      items: [
        { key: "notifications", label: "Push Notifications", desc: "Receive alerts for high-risk patients" },
        { key: "emailReports", label: "Email Reports", desc: "Daily summary of patient activity" },
        { key: "criticalAlerts", label: "Critical Alerts", desc: "Immediate notification for critical risk levels" },
        { key: "weeklyDigest", label: "Weekly Digest", desc: "Weekly patient progress report" },
      ],
    },
    {
      title: "Display",
      icon: Palette,
      items: [
        { key: "darkMode", label: "Dark Mode", desc: "Switch between light and dark themes" },
        { key: "compactView", label: "Compact View", desc: "Show more data in less space" },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Configure your dashboard preferences</p>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <section.icon className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {section.items.map((item) => (
              <div key={item.key} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggle(item.key as keyof typeof settings)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings[item.key as keyof typeof settings] ? "bg-blue-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      settings[item.key as keyof typeof settings] ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Export Patient Data</p>
              <p className="text-sm text-gray-500">Download all patient records as CSV</p>
            </div>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">
              Export
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Model Retraining</p>
              <p className="text-sm text-gray-500">Last trained: 2 days ago</p>
            </div>
            <button className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600">
              Retrain
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
          <Save className="w-5 h-5" />
          Save Changes
        </button>
      </div>
    </div>
  );
}
