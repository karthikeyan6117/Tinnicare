import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";
import { endpoints } from "../constants/api";
import { colors, spacing, typography } from "../constants/theme";

const SEVERITY_OPTIONS = ["mild", "moderate", "severe", "very_severe"];

export default function SymptomTrackingScreen() {
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    severity: "mild",
    loudness_level: "",
    duration_minutes: "",
    stress_level: "",
    sleep_quality: "",
    description: "",
  });

  const fetchSymptoms = useCallback(async () => {
    try {
      const res = await api.get(endpoints.symptoms.list, { params: { limit: 20 } });
      setSymptoms(res.data || []);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { fetchSymptoms(); }, [fetchSymptoms]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSymptoms();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!form.loudness_level || !form.duration_minutes) {
      Alert.alert("Error", "Please fill in loudness level and duration");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(endpoints.symptoms.create, {
        severity: form.severity,
        loudness_level: parseInt(form.loudness_level),
        duration_minutes: parseInt(form.duration_minutes),
        stress_level: form.stress_level ? parseInt(form.stress_level) : null,
        sleep_quality: form.sleep_quality ? parseInt(form.sleep_quality) : null,
        description: form.description || null,
      });
      setShowForm(false);
      setForm({ severity: "mild", loudness_level: "", duration_minutes: "", stress_level: "", sleep_quality: "", description: "" });
      fetchSymptoms();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.detail || "Failed to save symptom");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(!showForm)}>
        <Text style={styles.addButtonText}>{showForm ? "Cancel" : "Record Symptom"}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formLabel}>Severity</Text>
          <View style={styles.severityRow}>
            {SEVERITY_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.severityChip, form.severity === s && styles.severityChipActive]}
                onPress={() => setForm({ ...form, severity: s })}
              >
                <Text style={[styles.chipText, form.severity === s && styles.chipTextActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Loudness (1-10)"
            placeholderTextColor={colors.textLight}
            value={form.loudness_level}
            onChangeText={(t) => setForm({ ...form, loudness_level: t })}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Duration (minutes)"
            placeholderTextColor={colors.textLight}
            value={form.duration_minutes}
            onChangeText={(t) => setForm({ ...form, duration_minutes: t })}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Stress level (1-10)"
            placeholderTextColor={colors.textLight}
            value={form.stress_level}
            onChangeText={(t) => setForm({ ...form, stress_level: t })}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Sleep quality (1-10)"
            placeholderTextColor={colors.textLight}
            value={form.sleep_quality}
            onChangeText={(t) => setForm({ ...form, sleep_quality: t })}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notes (optional)"
            placeholderTextColor={colors.textLight}
            value={form.description}
            onChangeText={(t) => setForm({ ...form, description: t })}
            multiline
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Save Record</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Symptom History</Text>
      {symptoms.length === 0 ? (
        <Text style={styles.empty}>No records yet</Text>
      ) : (
        symptoms.map((s: any) => (
          <View key={s.id} style={styles.record}>
            <View style={styles.recordHeader}>
              <Text style={[styles.severity, { textTransform: "capitalize" }]}>{s.severity}</Text>
              <Text style={styles.date}>{new Date(s.recorded_at).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.detail}>Loudness: {s.loudness_level}/10 | Duration: {s.duration_minutes}m</Text>
            {s.stress_level && <Text style={styles.detail}>Stress: {s.stress_level}/10 | Sleep: {s.sleep_quality}/10</Text>}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  addButton: {
    backgroundColor: colors.primary,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  form: { backgroundColor: colors.surface, margin: spacing.md, padding: spacing.md, borderRadius: 16, elevation: 2 },
  formLabel: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs },
  severityRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  severityChip: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: 8,
    backgroundColor: colors.background, alignItems: "center",
  },
  severityChipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.bodySmall, color: colors.textSecondary, textTransform: "capitalize" },
  chipTextActive: { color: "#fff" },
  input: {
    backgroundColor: colors.background, borderRadius: 8, padding: spacing.sm,
    marginBottom: spacing.sm, fontSize: 16, color: colors.text,
  },
  textArea: { height: 80, textAlignVertical: "top" },
  submitBtn: { backgroundColor: colors.success, borderRadius: 8, padding: spacing.md, alignItems: "center", marginTop: spacing.sm },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  sectionTitle: { ...typography.h3, color: colors.text, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  empty: { ...typography.body, color: colors.textLight, textAlign: "center", marginTop: spacing.xl },
  record: { backgroundColor: colors.surface, margin: spacing.md, marginTop: 0, marginBottom: spacing.sm, padding: spacing.md, borderRadius: 12, elevation: 1 },
  recordHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs },
  severity: { ...typography.body, fontWeight: "600", color: colors.text },
  date: { ...typography.bodySmall, color: colors.textSecondary },
  detail: { ...typography.bodySmall, color: colors.textSecondary },
});
