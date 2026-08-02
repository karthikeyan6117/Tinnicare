import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from "react-native";
import { colors, spacing, typography } from "../constants/theme";
import api from "../services/api";
import { endpoints } from "../constants/api";

const SEVERITY_LEVELS = [
  { label: "Mild", value: "mild", color: colors.lowRisk, icon: "◉" },
  { label: "Moderate", value: "moderate", color: colors.mediumRisk, icon: "◉" },
  { label: "Severe", value: "severe", color: colors.highRisk, icon: "◉" },
];

export default function DailyCheckScreen() {
  const [severity, setSeverity] = useState("");
  const [loudness, setLoudness] = useState("");
  const [sleep, setSleep] = useState("");
  const [stress, setStress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!severity || !loudness) {
      Alert.alert("Required", "Please select severity and enter loudness level");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(endpoints.symptoms.create, {
        severity,
        loudness_level: parseInt(loudness),
        sleep_quality: sleep ? parseInt(sleep) : null,
        stress_level: stress ? parseInt(stress) : null,
        description: notes || null,
        recorded_at: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.detail || "Failed to save check-in");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successTitle}>Check-In Complete!</Text>
        <Text style={styles.successText}>Your daily record has been saved. The AI will analyze your patterns.</Text>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => { setSubmitted(false); setSeverity(""); setLoudness(""); setSleep(""); setStress(""); setNotes(""); }}
        >
          <Text style={styles.resetBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📋</Text>
        <Text style={styles.headerTitle}>Daily Check-In</Text>
        <Text style={styles.headerSubtext}>How are you feeling today?</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Current Severity</Text>
        <View style={styles.severityRow}>
          {SEVERITY_LEVELS.map((s) => (
            <TouchableOpacity
              key={s.value}
              style={[styles.severityBtn, severity === s.value && { backgroundColor: s.color, borderColor: s.color }]}
              onPress={() => setSeverity(s.value)}
            >
              <Text style={[styles.severityIcon, { color: severity === s.value ? "#fff" : s.color }]}>{s.icon}</Text>
              <Text style={[styles.severityLabel, severity === s.value && { color: "#fff" }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Loudness Level (1-10)</Text>
        <TextInput
          style={styles.input}
          placeholder="How loud is your tinnitus right now?"
          placeholderTextColor={colors.textLight}
          value={loudness}
          onChangeText={setLoudness}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.label}>Sleep Quality (1-10)</Text>
          <TextInput
            style={styles.input}
            placeholder="1-10"
            placeholderTextColor={colors.textLight}
            value={sleep}
            onChangeText={setSleep}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.label}>Stress Level (1-10)</Text>
          <TextInput
            style={styles.input}
            placeholder="1-10"
            placeholderTextColor={colors.textLight}
            value={stress}
            onChangeText={setStress}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any additional details about today..."
          placeholderTextColor={colors.textLight}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Save Today's Check-In</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxl },
  header: { alignItems: "center", paddingTop: spacing.xxl + 10, paddingBottom: spacing.lg, backgroundColor: colors.primary },
  headerIcon: { fontSize: 40, marginBottom: spacing.sm },
  headerTitle: { ...typography.h2, color: "#fff" },
  headerSubtext: { ...typography.body, color: "rgba(255,255,255,0.8)", marginTop: spacing.xs },
  card: { backgroundColor: colors.surface, margin: spacing.md, marginBottom: 0, padding: spacing.lg, borderRadius: 16, elevation: 2 },
  halfCard: { flex: 1 },
  row: { flexDirection: "row", marginRight: spacing.md },
  label: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
  severityRow: { flexDirection: "row", gap: spacing.sm },
  severityBtn: {
    flex: 1, paddingVertical: spacing.md, borderRadius: 12,
    borderWidth: 2, borderColor: colors.border, alignItems: "center",
    backgroundColor: colors.background,
  },
  severityIcon: { fontSize: 24, marginBottom: spacing.xs },
  severityLabel: { ...typography.bodySmall, fontWeight: "600", color: colors.text },
  input: {
    backgroundColor: colors.background, borderRadius: 10, padding: spacing.md,
    fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.border,
  },
  textArea: { height: 90, textAlignVertical: "top" },
  submitBtn: {
    backgroundColor: colors.primary, margin: spacing.md, padding: spacing.md,
    borderRadius: 14, alignItems: "center", marginTop: spacing.lg,
  },
  submitBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  successContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background, padding: spacing.xl },
  successIcon: { fontSize: 64, color: colors.success, marginBottom: spacing.md, fontWeight: "700" },
  successTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.sm },
  successText: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.xl },
  resetBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 14 },
  resetBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
