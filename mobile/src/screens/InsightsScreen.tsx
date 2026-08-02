import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";
import { endpoints } from "../constants/api";
import { colors, spacing, typography } from "../constants/theme";

export default function InsightsScreen() {
  const [insights, setInsights] = useState<any>(null);
  const [triggers, setTriggers] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const [insightsRes, triggersRes] = await Promise.all([
        api.post(endpoints.predictions.aiInsights).catch(() => null),
        api.get(endpoints.triggers.insights).catch(() => null),
      ]);
      if (insightsRes) setInsights(insightsRes.data.analysis);
      if (triggersRes) setTriggers(triggersRes.data);
    } catch {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchInsights(); }, [fetchInsights]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInsights();
    setRefreshing(false);
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "low": return colors.lowRisk;
      case "medium": return colors.mediumRisk;
      case "high": return colors.highRisk;
      default: return colors.textSecondary;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {insights && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>AI Pattern Analysis</Text>
            <Text style={styles.cardBody}>{insights.pattern_analysis}</Text>
            {insights.severity_trend && (
              <View style={styles.trendRow}>
                <Text style={styles.trendLabel}>Trend: </Text>
                <Text style={[styles.trendValue, { color: insights.severity_trend === "worsening" ? colors.highRisk : insights.severity_trend === "improving" ? colors.success : colors.mediumRisk }]}>
                  {insights.severity_trend}
                </Text>
              </View>
            )}
            {insights.risk_level && (
              <View style={[styles.riskBadge, { backgroundColor: getRiskColor(insights.risk_level) }]}>
                <Text style={styles.riskBadgeText}>Risk: {insights.risk_level.toUpperCase()}</Text>
              </View>
            )}
          </View>

          {insights.recommendations && insights.recommendations.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recommendations</Text>
              {insights.recommendations.map((r: string, i: number) => (
                <View key={i} style={styles.recommendationItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.recommendationText}>{r}</Text>
                </View>
              ))}
            </View>
          )}

          {insights.possible_triggers && insights.possible_triggers.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Possible Triggers</Text>
              {insights.possible_triggers.map((t: string, i: number) => (
                <Text key={i} style={styles.triggerItem}>• {t}</Text>
              ))}
            </View>
          )}
        </>
      )}

      {triggers && triggers.top_triggers && triggers.top_triggers.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Top Triggers</Text>
          <Text style={styles.totalCount}>Total recorded: {triggers.total_triggers}</Text>
          {triggers.top_triggers.map((t: any, i: number) => (
            <View key={i} style={styles.triggerRow}>
              <Text style={styles.triggerType}>{t.type}</Text>
              <Text style={styles.triggerCount}>{t.count} times</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    marginBottom: 0,
    padding: spacing.lg,
    borderRadius: 16,
    elevation: 2,
    marginTop: spacing.md,
  },
  cardTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  cardBody: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  trendRow: { flexDirection: "row", marginTop: spacing.sm },
  trendLabel: { ...typography.body, color: colors.textSecondary },
  trendValue: { ...typography.body, fontWeight: "600", textTransform: "capitalize" },
  riskBadge: { alignSelf: "flex-start", paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 20, marginTop: spacing.sm },
  riskBadgeText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  recommendationItem: { flexDirection: "row", marginBottom: spacing.xs },
  bullet: { ...typography.body, color: colors.primary, marginRight: spacing.sm },
  recommendationText: { ...typography.body, color: colors.textSecondary, flex: 1 },
  triggerItem: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs },
  totalCount: { ...typography.bodySmall, color: colors.textLight, marginBottom: spacing.sm },
  triggerRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  triggerType: { ...typography.body, color: colors.text, textTransform: "capitalize" },
  triggerCount: { ...typography.body, color: colors.textSecondary },
});
