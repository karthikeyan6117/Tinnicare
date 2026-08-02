import { BookOpen, HelpCircle, Moon, Volume2, ShieldAlert, Ear } from "lucide-react";

export default function LearnPage() {
  const articles = [
    {
      title: "Understanding Tinnitus: Causes & Mechanism",
      icon: HelpCircle,
      color: "text-blue-600 bg-blue-50",
      content: "Tinnitus is the perception of sound when no external acoustic signal is present. It often originates from micro-changes in inner ear hair cells, leading the auditory cortex to generate phantom auditory signals.",
    },
    {
      title: "How Sound Therapy & Masking Work",
      icon: Volume2,
      color: "text-purple-600 bg-purple-50",
      content: "Sound therapy introduces pleasant ambient sounds (such as pink noise or ocean waves) to reduce the contrast between the background environment and your tinnitus sound level.",
    },
    {
      title: "Optimizing Sleep Hygiene for Tinnitus Relief",
      icon: Moon,
      color: "text-teal-600 bg-teal-50",
      content: "Sleep disruption is one of the most common tinnitus triggers. Maintaining consistent sleep hours, avoiding high caffeine intake after 2 PM, and using low-volume sound therapy at bedtime can significantly lower severity scores.",
    },
    {
      title: "Recognizing & Avoiding Flare-Up Triggers",
      icon: ShieldAlert,
      color: "text-rose-600 bg-rose-50",
      content: "Stress, loud noise exposure, and fatigue are primary flare-up factors. Daily symptom tracking helps pinpoint correlated triggers early.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex items-center gap-4 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-200">
          <BookOpen className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tinnitus Education & Resource Hub</h1>
          <p className="text-gray-500 text-sm mt-0.5">Evidence-based guides, sound therapy tips, and habit optimization</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((art, i) => {
          const Icon = art.icon;
          return (
            <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${art.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">{art.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{art.content}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center gap-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Ear className="w-5 h-5 text-teal-500" /> Anatomy of the Ear
        </h2>
        <video
  src="/sound.mp4"
  controls
  className="w-full max-w-lg rounded-2xl border border-gray-200 shadow-sm"
/>
        <p className="text-xs text-gray-500 text-center max-w-md">
          The ear converts sound vibrations into neural signals. Damage to the inner ear hair cells is a leading cause
          of tinnitus.
        </p>
      </div>
    </div>
  );
}
