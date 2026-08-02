import React, { useEffect, useRef, useState } from "react";
import api from "../services/api";
import { endpoints } from "../constants/api";

const PitchMatching: React.FC = () => {
  const [frequency, setFrequency] = useState<number>(6200);
  const [intensity, setIntensity] = useState<number>(14);
  const [waveform, setWaveform] = useState<OscillatorType>("sine");
  const [playing, setPlaying] = useState<boolean>(false);
  const [matchFound, setMatchFound] = useState<boolean | null>(null);
  const [confidence, setConfidence] = useState<number>(95);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopTone();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureAudioContext = async () => {
    if (!audioContextRef.current) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
    }
    if (audioContextRef.current?.state === "suspended") {
      try {
        await audioContextRef.current.resume();
      } catch (e) {
        // ignore
      }
    }
  };

  const playTone = async () => {
    if (playing) return;
    await ensureAudioContext();
    const audioContext = audioContextRef.current!;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = waveform;
    oscillator.frequency.value = frequency;

    // Simple linear mapping: 0-30 dB -> 0.0 - 1.0 gain
    gainNode.gain.value = Math.max(0, Math.min(1, intensity / 30));

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();

    oscillatorRef.current = oscillator;
    gainRef.current = gainNode;
    setPlaying(true);
  };

  const stopTone = () => {
    try {
      oscillatorRef.current?.stop();
    } catch (e) {
      // ignore
    }
    oscillatorRef.current = null;
    gainRef.current = null;

    try {
      audioContextRef.current?.close();
    } catch (e) {
      // ignore
    }
    audioContextRef.current = null;
    setPlaying(false);
  };

  const changeFrequency = (value: number) => {
    setFrequency(value);
    if (oscillatorRef.current) {
      oscillatorRef.current.frequency.value = value;
    }
  };

  const changeIntensity = (value: number) => {
    setIntensity(value);
    if (gainRef.current) {
      gainRef.current.gain.value = Math.max(0, Math.min(1, value / 30));
    }
  };

  const saveResult = async () => {
    const payload = {
      severity: "moderate",
      frequency_hz: frequency,
      duration_minutes: 0,
      description: `Pitch match: ${frequency} Hz; Loudness match: ${intensity} dB; confidence: ${confidence}%`,
    } as any;

    try {
      await api.post(endpoints.symptoms.create, payload);
      alert("Matching saved to your record.");
      setMatchFound(true);
    } catch (err) {
      console.error(err);
      alert("Failed to save — please try again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white p-8 rounded-3xl shadow-xl">
      <h2 className="text-3xl font-bold text-violet-700 mb-6">🎧 Tinnitus Matching Test</h2>

      <section className="mb-8">
        <h3 className="font-semibold text-lg">🎵 Pitch Matching</h3>
        <p className="mt-2 text-sm text-slate-600">Move the slider until the tone matches your tinnitus.</p>

        <div className="mt-4">
          <div className="text-2xl font-extrabold text-slate-900">{Math.round(frequency)} Hz</div>
          <input
            type="range"
            min={125}
            max={12000}
            step={1}
            value={frequency}
            onChange={(e) => changeFrequency(Number(e.target.value))}
            className="w-full mt-3"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>125 Hz</span>
            <span>12000 Hz</span>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="font-semibold text-lg">🔊 Loudness Matching</h3>
        <p className="mt-2 text-sm text-slate-600">Adjust volume until it matches perceived loudness (dB).</p>

        <div className="mt-4">
          <div className="text-2xl font-extrabold text-slate-900">{intensity.toFixed(1)} dB</div>
          <input
            type="range"
            min={0}
            max={30}
            step={0.1}
            value={intensity}
            onChange={(e) => changeIntensity(Number(e.target.value))}
            className="w-full mt-3"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>0 dB</span>
            <span>30 dB</span>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <label className="block font-semibold mb-2">Waveform</label>
        <select
          value={waveform}
          onChange={(e) => setWaveform(e.target.value as OscillatorType)}
          className="rounded-lg border p-2"
        >
          <option value="sine">Sine</option>
          <option value="square">Square</option>
          <option value="sawtooth">Sawtooth</option>
          <option value="triangle">Triangle</option>
        </select>
      </section>

      <div className="flex items-center gap-4 mt-6">
        <button
          onClick={playing ? stopTone : playTone}
          className="bg-violet-600 text-white px-5 py-3 rounded-xl"
        >
          {playing ? "■ Stop" : "▶ Play"}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Match found?</span>
          <button
            onClick={() => setMatchFound(true)}
            className={`px-3 py-1 rounded-xl ${matchFound === true ? "bg-emerald-100 text-emerald-700" : "bg-white border"}`}
          >
            Yes
          </button>
          <button
            onClick={() => setMatchFound(false)}
            className={`px-3 py-1 rounded-xl ${matchFound === false ? "bg-amber-100 text-amber-700" : "bg-white border"}`}
          >
            No
          </button>
        </div>
      </div>

      <div className="mt-6">
        <label className="block font-semibold mb-2">Confidence: {confidence}%</label>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={confidence}
          onChange={(e) => setConfidence(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={saveResult}
          className="bg-green-600 text-white px-5 py-3 rounded-xl"
        >
          ✔ Save Result
        </button>
      </div>
    </div>
  );
};

export default PitchMatching;