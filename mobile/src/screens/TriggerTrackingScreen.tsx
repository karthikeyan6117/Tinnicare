import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";
import { endpoints } from "../constants/api";
import { colors, spacing, typography } from "../constants/theme";

const TRIGGER_TYPES = [
  "stress", "loud_noise", "lack_of_sleep", "caffeine",
  "alcohol", "weather", "medication", "exercise", "other",
];

export default function TriggerTrackingScreen() {
  const [triggers, setTriggers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    trigger_type: "stress",
    trigger_value: "",
    severity_before: "moderate",
    severity_after: "",
    notes: "",
  });

  const fetchTriggers = useCallback(async () => {
    try {
      const res = await api.get(endpoints.triggers.list, { params: { limit: 20 } });
      setTriggers(res.data || []);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { fetchTriggers(); }, [fetchTriggers]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTriggers();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(endpoints.triggers.create, {
        trigger_type: form.trigger_type,
        trigger_value: form.trigger_value || null,
        severity_before: form.severity_before,
        severity_after: form.severity_after || null,
        notes: form.notes || null,
      });
      setShowForm(false);
      setForm({ trigger_type: "stress", trigger_value: "", severity_before: "moderate", severity_after: "", notes: "" });
      fetchTriggers();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.detail || "Failed to log trigger");
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
        <Text style={styles.addButtonText}>{showForm ? "Cancel" : "Log Trigger"}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formLabel}>Trigger Type</Text>
          <View style={styles.chipRow}>
            {TRIGGER_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, form.trigger_type === t && styles.chipActive]}
                onPress={() => setForm({ ...form, trigger_type: t })}
              >
                <Text style={[styles.chipText, form.trigger_type === t && styles.chipTextActive]}>
                  {t.replace("_", " ")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Trigger details (e.g., 'loud concert')"
            placeholderTextColor={colors.textLight}
            value={form.trigger_value}
            onChangeText={(t) => setForm({ ...form, trigger_value: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Severity after trigger (mild/moderate/severe)"
            placeholderTextColor={colors.textLight}
            value={form.severity_after}
            onChangeText={(t) => setForm({ ...form, severity_after: t })}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notes (optional)"
            placeholderTextColor={colors.textLight}
            value={form.notes}
            onChangeText={(t) => setForm({ ...form, notes: t })}
            multiline
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Log Trigger</Text>}
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Trigger Log</Text>
      {triggers.length === 0 ? (
        <Text style={styles.empty}>No triggers logged yet</Text>
      ) : (
        triggers.map((t: any) => (
          <View key={t.id} style={styles.record}>
            <View style={styles.recordHeader}>
              <Text style={styles.triggerTypeLabel}>{t.trigger_type.replace("_", " ")}</Text>
              <Text style={styles.date}>{new Date(t.created_at).toLocaleDateString()}</Text>
            </View>
            {t.trigger_value && <Text style={styles.detail}>Detail: {t.trigger_value}</Text>}
            {t.severity_after && <Text style={styles.detail}>After severity: {t.severity_after}</Text>}
            {t.notes && <Text style={styles.notes}>{t.notes}</Text>}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  addButton: {
    backgroundColor: colors.secondary, margin: spacing.md,
    padding: spacing.md, borderRadius: 12, alignItems: "center",
  },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  form: { backgroundColor: colors.surface, margin: spacing.md, padding: spacing.md, borderRadius: 16, elevation: 2 },
  formLabel: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: 16, backgroundColor: colors.background,
  },
  chipActive: { backgroundColor: colors.secondary },
  chipText: { ...typography.bodySmall, color: colors.textSecondary, textTransform: "capitalize" },
  chipTextActive: { color: "#fff" },
  input: {
    backgroundColor: colors.background, borderRadius: 8, padding: spacing.sm,
    marginBottom: spacing.sm, fontSize: 16, color: colors.text,
  },
  textArea: { height: 80, textAlignVertical: "top" },
  submitBtn: { backgroundColor: colors.secondary, borderRadius: 8, padding: spacing.md, alignItems: "center", marginTop: spacing.sm },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  sectionTitle: { ...typography.h3, color: colors.text, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  empty: { ...typography.body, color: colors.textLight, textAlign: "center", marginTop: spacing.xl },
  record: { backgroundColor: colors.surface, margin: spacing.md, marginTop: 0, marginBottom: spacing.sm, padding: spacing.md, borderRadius: 12, elevation: 1 },
  recordHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs },
  triggerTypeLabel: { ...typography.body, fontWeight: "600", color: colors.text, textTransform: "capitalize" },
  date: { ...typography.bodySmall, color: colors.textSecondary },
  detail: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  notes: { ...typography.bodySmall, color: colors.text, fontStyle: "italic", marginTop: spacing.xs },
});
