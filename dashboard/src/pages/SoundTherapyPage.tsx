import { useState, useEffect, useRef } from "react";
import PitchMatching from "./pitch";
import { Volume2, Play, Square, CloudRain, Waves, Wind, Radio, Timer, Sparkles } from "lucide-react";

interface SoundTrack {
  id: string;
  title: string;
  category: "calming" | "broadband";
  description: string;
  icon: any;
  color: string;
}

const SOUND_TRACKS: SoundTrack[] = [
  {
    id: "rain",
    title: "Gentle Rain",
    category: "calming",
    description: "Soothing rainfall sound pattern to mask high-frequency ringing.",
    icon: CloudRain,
    color: "from-blue-500 to-cyan-600",
  },
  {
    id: "ocean",
    title: "Ocean Waves",
    category: "calming",
    description: "Rhythmic oceanic wave swell to reduce contrast and induce deep sleep.",
    icon: Waves,
    color: "from-teal-500 to-emerald-600",
  },
  {
    id: "wind",
    title: "Mountain Wind",
    category: "calming",
    description: "Soft breeze noise tailored for subjective tinnitus masking.",
    icon: Wind,
    color: "from-indigo-500 to-blue-600",
  },
  {
    id: "white",
    title: "White Noise",
    category: "broadband",
    description: "Equal energy across all audible frequencies for full-spectrum masking.",
    icon: Radio,
    color: "from-gray-600 to-slate-800",
  },
  {
    id: "pink",
    title: "Pink Noise",
    category: "broadband",
    description: "Deeper, balanced 1/f noise for optimal brainwave relaxation.",
    icon: Radio,
    color: "from-pink-500 to-rose-600",
  },
  {
    id: "brown",
    title: "Brown Noise",
    category: "broadband",
    description: "Deep bass rumble noise, ideal for severe loudness spikes.",
    icon: Radio,
    color: "from-amber-600 to-orange-700",
  },
];

export default function SoundTherapyPage() {
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(15);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const activeNodesRef = useRef<AudioNode[]>([]);
  const timerTimeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (timerTimeoutRef.current) {
      clearTimeout(timerTimeoutRef.current);
    }
    activeNodesRef.current.forEach((node) => {
      try {
        if ("stop" in node && typeof (node as any).stop === "function") {
          (node as any).stop();
        }
        node.disconnect();
      } catch {}
    });
    activeNodesRef.current = [];

    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    gainNodeRef.current = null;
    setActiveSound(null);
  };

  const setVolumeLevel = (val: number) => {
    setVolume(val);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(val, audioCtxRef.current?.currentTime || 0);
    }
  };

  const playSound = (id: string) => {
    stopAudio();

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, ctx.currentTime);
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (id === "white") {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else if (id === "pink") {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }
    } else if (id === "brown" || id === "rain" || id === "wind" || id === "ocean") {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;

    if (id === "rain") {
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 1000;
      whiteNoise.connect(filter);
      filter.connect(masterGain);
    } else if (id === "ocean") {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 400;

      // LFO for wave modulation
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.12; // 12-second wave cycle
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 250;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      activeNodesRef.current.push(lfo);

      whiteNoise.connect(filter);
      filter.connect(masterGain);
    } else if (id === "wind") {
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 600;
      filter.Q.value = 3.0;

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.2;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 300;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      activeNodesRef.current.push(lfo);

      whiteNoise.connect(filter);
      filter.connect(masterGain);
    } else {
      whiteNoise.connect(masterGain);
    }

    whiteNoise.start();
    activeNodesRef.current.push(whiteNoise);
    setActiveSound(id);

    if (timerMinutes) {
      timerTimeoutRef.current = setTimeout(() => {
        stopAudio();
      }, timerMinutes * 60 * 1000);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-200">
            <Volume2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Sound Therapy Studio <Sparkles className="w-5 h-5 text-purple-500" />
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Calming nature sounds & custom broadband noise generators synthesized live</p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-6 bg-gray-50 p-4 rounded-2xl border border-gray-200">
          <div className="flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-gray-500" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
              className="w-28 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <span className="text-xs font-bold text-gray-700 min-w-[32px]">{Math.round(volume * 100)}%</span>
          </div>

          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            <Timer className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-semibold text-gray-700">Timer:</span>
            {[5, 15, 30, null].map((m) => (
              <button
                key={m === null ? "cont" : m}
                onClick={() => setTimerMinutes(m)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  timerMinutes === m ? "bg-purple-600 text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {m === null ? "Continuous" : `${m}m`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pitch Matching Tool */}
      <div className="mt-6">
        <PitchMatching />
      </div>

      {/* Calming Nature Sounds */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <CloudRain className="w-5 h-5 text-teal-600" /> Calming Nature Sounds
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SOUND_TRACKS.filter((t) => t.category === "calming").map((track) => {
            const Icon = track.icon;
            const isPlaying = activeSound === track.id;
            return (
              <div
                key={track.id}
                className={`bg-white rounded-3xl p-6 border transition-all duration-300 shadow-sm hover:shadow-md ${
                  isPlaying ? "border-purple-500 ring-2 ring-purple-100" : "border-gray-100"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${track.color} text-white flex items-center justify-center shadow-md`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <button
                    onClick={() => (isPlaying ? stopAudio() : playSound(track.id))}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all shadow-md ${
                      isPlaying
                        ? "bg-purple-600 text-white animate-pulse"
                        : "bg-gray-100 text-gray-700 hover:bg-purple-500 hover:text-white"
                    }`}
                  >
                    {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>
                </div>
                <h3 className="font-bold text-gray-900 text-base">{track.title}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{track.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Broadband Noise Masking */}
      <div className="space-y-4 pt-2">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Radio className="w-5 h-5 text-indigo-600" /> Broadband Noise Maskers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SOUND_TRACKS.filter((t) => t.category === "broadband").map((track) => {
            const isPlaying = activeSound === track.id;
            return (
              <div
                key={track.id}
                className={`bg-white rounded-3xl p-6 border transition-all duration-300 shadow-sm hover:shadow-md ${
                  isPlaying ? "border-indigo-500 ring-2 ring-indigo-100" : "border-gray-100"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${track.color} text-white flex items-center justify-center shadow-md`}>
                    <Radio className="w-6 h-6" />
                  </div>
                  <button
                    onClick={() => (isPlaying ? stopAudio() : playSound(track.id))}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all shadow-md ${
                      isPlaying
                        ? "bg-indigo-600 text-white animate-pulse"
                        : "bg-gray-100 text-gray-700 hover:bg-indigo-600 hover:text-white"
                    }`}
                  >
                    {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>
                </div>
                <h3 className="font-bold text-gray-900 text-base">{track.title}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{track.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
