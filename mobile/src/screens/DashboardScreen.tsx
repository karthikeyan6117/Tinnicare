import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { endpoints } from "../constants/api";
import { colors, spacing, typography } from "../constants/theme";

type MainStackParamList = {
  MainTabs: undefined;
  DailyCheck: undefined;
  SoundTherapy: undefined;
  Chatbot: undefined;
};

const FEATURES = [
  { key: "daily_check", title: "Daily Check-In", desc: "Quick symptom log", icon: "📋", color: colors.primary, screen: "DailyCheck" as const },
  { key: "sound_therapy", title: "Sound Therapy", desc: "Therapeutic sounds", icon: "🎧", color: colors.secondary, screen: "SoundTherapy" as const },
  { key: "chatbot", title: "AI Assistant", desc: "Ask anything", icon: "🤖", color: colors.accent, screen: "Chatbot" as const },
];

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [riskData, setRiskData] = useState<any>(null);
  const [recentSymptoms, setRecentSymptoms] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [riskRes, symptomsRes] = await Promise.all([
        api.get(endpoints.assessments.latestRisk).catch(() => null),
        api.get(endpoints.symptoms.list, { params: { limit: 5 } }).catch(() => ({ data: [] })),
      ]);
      if (riskRes) setRiskData(riskRes.data);
      setRecentSymptoms(symptomsRes?.data || []);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return colors.lowRisk;
      case "medium": return colors.mediumRisk;
      case "high": return colors.highRisk;
      default: return colors.textSecondary;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.welcomeCard}>
        <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"},</Text>
        <Text style={styles.welcomeText}>{user?.full_name?.split(" ")[0]}</Text>
        <Text style={styles.welcomeSubtext}>Here's your tinnitus overview</Text>
      </View>

      {riskData && (
        <View style={[styles.riskCard, { borderLeftColor: getRiskColor(riskData.risk_level) }]}>
          <View style={styles.riskHeader}>
            <Text style={styles.riskLabel}>Current Risk Level</Text>
            <Text style={[styles.riskValue, { color: getRiskColor(riskData.risk_level) }]}>
              {riskData.risk_level.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.riskScore}>Score: {riskData.risk_score?.toFixed(1) || "N/A"} / 10</Text>
          {riskData.flare_up_probability != null && (
            <Text style={styles.riskDetail}>
              Flare-up probability: {(riskData.flare_up_probability * 100).toFixed(0)}%
            </Text>
          )}
        </View>
      )}

      {/* Feature Grid */}
      <Text style={styles.sectionTitle}>Your Tools</Text>
      <View style={styles.featureGrid}>
        {FEATURES.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.featureCard, { borderTopColor: f.color }]}
            onPress={() => navigation.navigate(f.screen)}
          >
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Symptoms */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Symptoms</Text>
        {recentSymptoms.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No symptoms recorded yet.</Text>
            <Text style={styles.emptySubtext}>Use Daily Check-In to start tracking.</Text>
          </View>
        ) : (
          recentSymptoms.map((s: any) => (
            <View key={s.id} style={styles.symptomItem}>
              <View style={[styles.severityDot, { backgroundColor: getRiskColor(s.severity) }]} />
              <View style={styles.symptomInfo}>
                <Text style={styles.symptomSeverity}>{s.severity}</Text>
                <Text style={styles.symptomDate}>
                  {new Date(s.recorded_at).toLocaleDateString()}
                </Text>
              </View>
              {s.stress_level && (
                <Text style={styles.symptomExtra}>Stress: {s.stress_level}/10</Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  welcomeCard: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  greeting: { ...typography.body, color: "rgba(255,255,255,0.8)" },
  welcomeText: { ...typography.h1, color: "#fff", marginTop: 2 },
  welcomeSubtext: { ...typography.body, color: "rgba(255,255,255,0.8)", marginTop: spacing.xs },
  riskCard: {
    backgroundColor: colors.surface, margin: spacing.md, padding: spacing.lg,
    borderRadius: 16, borderLeftWidth: 4, elevation: 2,
  },
  riskHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  riskLabel: { ...typography.bodySmall, color: colors.textSecondary },
  riskValue: { ...typography.h2, fontWeight: "700" },
  riskScore: { ...typography.body, color: colors.text, marginTop: spacing.sm },
  riskDetail: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  section: { padding: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.text, paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  featureGrid: {
    flexDirection: "row", paddingHorizontal: spacing.md, gap: spacing.sm,
  },
  featureCard: {
    flex: 1, backgroundColor: colors.surface, padding: spacing.md,
    borderRadius: 16, borderTopWidth: 3, elevation: 2, alignItems: "center",
  },
  featureIcon: { fontSize: 28, marginBottom: spacing.xs },
  featureTitle: { ...typography.bodySmall, fontWeight: "600", color: colors.text, textAlign: "center" },
  featureDesc: { ...typography.caption, color: colors.textLight, textAlign: "center", marginTop: 2 },
  emptyState: { alignItems: "center", padding: spacing.xl, backgroundColor: colors.surface, borderRadius: 16, elevation: 1 },
  emptyIcon: { fontSize: 40, marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: "center" },
  emptySubtext: { ...typography.bodySmall, color: colors.textLight, textAlign: "center", marginTop: spacing.xs },
  symptomItem: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.surface,
    padding: spacing.md, borderRadius: 12, marginBottom: spacing.sm, elevation: 1,
  },
  severityDot: { width: 12, height: 12, borderRadius: 6, marginRight: spacing.sm },
  symptomInfo: { flex: 1 },
  symptomSeverity: { ...typography.body, fontWeight: "600", textTransform: "capitalize" },
  symptomDate: { ...typography.caption, color: colors.textSecondary },
  symptomExtra: { ...typography.bodySmall, color: colors.textSecondary },
});
