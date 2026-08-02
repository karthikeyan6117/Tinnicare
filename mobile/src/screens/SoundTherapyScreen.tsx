import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert,
} from "react-native";
import { colors, spacing, typography } from "../constants/theme";

const THERAPIES = [
  {
    id: "white_noise",
    title: "White Noise",
    description: "Soothing static-like sound that masks tinnitus",
    icon: "🌊",
    color: "#4A90D9",
    presets: ["Gentle Static", "Ocean Waves", "Rainfall"],
  },
  {
    id: "nature",
    title: "Nature Sounds",
    description: "Calming sounds from the natural world",
    icon: "🌿",
    color: "#4CAF50",
    presets: ["Forest Birds", "Mountain Stream", "Wind Chimes"],
  },
  {
    id: "ambient",
    title: "Ambient Music",
    description: "Soft instrumental tones for relaxation",
    icon: "🎵",
    color: "#6C63FF",
    presets: ["Piano Dreams", "Zen Garden", "Starlight"],
  },
  {
    id: "binaural",
    title: "Binaural Beats",
    description: "Frequency-based therapy for neural entrainment",
    icon: "🧠",
    color: "#FF6B6B",
    presets: ["Delta Waves", "Theta Waves", "Alpha Waves"],
  },
];

export default function SoundTherapyScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const therapy = THERAPIES.find((t) => t.id === selected);

  const handlePlay = (preset: string) => {
    setActivePreset(preset);
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setActivePreset(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🎧</Text>
        <Text style={styles.headerTitle}>Sound Therapy</Text>
        <Text style={styles.headerSubtext}>Find relief through therapeutic sounds</Text>
      </View>

      {!selected ? (
        <View style={styles.grid}>
          {THERAPIES.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.therapyCard, { borderTopColor: t.color }]}
              onPress={() => setSelected(t.id)}
            >
              <Text style={styles.therapyIcon}>{t.icon}</Text>
              <Text style={styles.therapyTitle}>{t.title}</Text>
              <Text style={styles.therapyDesc}>{t.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View>
          <TouchableOpacity style={styles.backBtn} onPress={() => { setSelected(null); setIsPlaying(false); setActivePreset(null); }}>
            <Text style={styles.backBtnText}>← All Therapies</Text>
          </TouchableOpacity>

          <View style={[styles.playerCard, { borderTopColor: therapy?.color }]}>
            <Text style={styles.playerIcon}>{therapy?.icon}</Text>
            <Text style={styles.playerTitle}>{therapy?.title}</Text>
            <Text style={styles.playerDesc}>{therapy?.description}</Text>

            <View style={styles.presetsContainer}>
              {therapy?.presets.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetBtn,
                    activePreset === preset && { backgroundColor: therapy.color, borderColor: therapy.color },
                  ]}
                  onPress={() => activePreset === preset ? handleStop() : handlePlay(preset)}
                >
                  <Text style={[styles.presetText, activePreset === preset && { color: "#fff" }]}>
                    {activePreset === preset ? "🔊 " : "🔈 "}{preset}
                  </Text>
                  <Text style={[styles.playLabel, activePreset === preset && { color: "rgba(255,255,255,0.8)" }]}>
                    {activePreset === preset ? "Stop" : "Play"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {isPlaying && (
            <View style={[styles.nowPlaying, { backgroundColor: therapy?.color }]}>
              <View style={styles.waveform}>
                {[8, 12, 6, 14, 10, 16, 8, 12].map((h, i) => (
                  <View key={i} style={[styles.waveBar, { height: h }]} />
                ))}
              </View>
              <Text style={styles.nowPlayingText}>Playing: {activePreset}</Text>
              <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
                <Text style={styles.stopBtnText}>■ Stop</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxl },
  header: { alignItems: "center", paddingTop: spacing.xxl + 10, paddingBottom: spacing.lg, backgroundColor: colors.secondary },
  headerIcon: { fontSize: 40, marginBottom: spacing.sm },
  headerTitle: { ...typography.h2, color: "#fff" },
  headerSubtext: { ...typography.body, color: "rgba(255,255,255,0.8)", marginTop: spacing.xs },
  grid: { padding: spacing.md, gap: spacing.md },
  therapyCard: {
    backgroundColor: colors.surface, padding: spacing.lg, borderRadius: 16,
    borderTopWidth: 4, elevation: 2, marginBottom: spacing.sm,
  },
  therapyIcon: { fontSize: 36, marginBottom: spacing.sm },
  therapyTitle: { ...typography.h3, color: colors.text },
  therapyDesc: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  backBtn: { padding: spacing.md, paddingBottom: 0 },
  backBtnText: { ...typography.body, color: colors.primary, fontWeight: "600" },
  playerCard: {
    backgroundColor: colors.surface, margin: spacing.md, padding: spacing.lg,
    borderRadius: 16, borderTopWidth: 4, elevation: 2,
  },
  playerIcon: { fontSize: 48, textAlign: "center", marginBottom: spacing.sm },
  playerTitle: { ...typography.h2, color: colors.text, textAlign: "center" },
  playerDesc: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xs },
  presetsContainer: { marginTop: spacing.lg, gap: spacing.sm },
  presetBtn: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: spacing.md, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.background,
  },
  presetText: { ...typography.body, color: colors.text, fontWeight: "500" },
  playLabel: { ...typography.bodySmall, color: colors.primary, fontWeight: "600" },
  nowPlaying: {
    margin: spacing.md, padding: spacing.lg, borderRadius: 16,
    alignItems: "center", elevation: 4,
  },
  waveform: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.md, height: 20 },
  waveBar: { width: 4, backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 2 },
  nowPlayingText: { ...typography.body, color: "#fff", fontWeight: "600", marginBottom: spacing.sm },
  stopBtn: {
    paddingHorizontal: spacing.xl, paddingVertical: spacing.sm,
    borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)",
  },
  stopBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
