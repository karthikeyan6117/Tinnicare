import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";
import { endpoints } from "../constants/api";
import { colors, spacing, typography } from "../constants/theme";

export default function CarePlanScreen() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await api.get(endpoints.assessments.carePlans, {
        params: { patient_id: "me" },
      }).catch(() => ({ data: [] }));
      setPlans(res.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchPlans(); }, [fetchPlans]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlans();
    setRefreshing(false);
  };

  const toggleActivity = async (activityId: string) => {
    try {
      await api.patch(endpoints.assessments.completeActivity(activityId));
      fetchPlans();
    } catch (err: any) {
      Alert.alert("Error", "Failed to update activity");
    }
  };

  if (loading) {
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Care Plans</Text>
        <Text style={styles.headerSubtext}>Your personalized rehabilitation plans</Text>
      </View>

      {plans.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Active Care Plans</Text>
          <Text style={styles.emptyText}>
            Your doctor will create personalized care plans based on your assessments.
          </Text>
        </View>
      ) : (
        plans.map((plan: any) => (
          <View key={plan.id} style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>{plan.title}</Text>
              {plan.is_active && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              )}
            </View>
            {plan.description && (
              <Text style={styles.planDesc}>{plan.description}</Text>
            )}
            {plan.duration_days && (
              <Text style={styles.planDuration}>{plan.duration_days} day plan</Text>
            )}

            {plan.activities && plan.activities.length > 0 && (
              <View style={styles.activitiesSection}>
                <Text style={styles.activitiesTitle}>Activities</Text>
                {plan.activities.map((act: any) => (
                  <TouchableOpacity
                    key={act.id}
                    style={[styles.activityItem, act.is_completed && styles.activityCompleted]}
                    onPress={() => !act.is_completed && toggleActivity(act.id)}
                    disabled={act.is_completed}
                  >
                    <View style={[styles.checkbox, act.is_completed && styles.checkboxChecked]}>
                      {act.is_completed && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={[styles.activityTitle, act.is_completed && styles.textStrikethrough]}>
                        {act.title}
                      </Text>
                      {act.duration_minutes && (
                        <Text style={styles.activityDetail}>{act.duration_minutes} min</Text>
                      )}
                      {act.frequency && (
                        <Text style={styles.activityDetail}>{act.frequency}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: spacing.xxl },
  headerTitle: { ...typography.h2, color: "#fff" },
  headerSubtext: { ...typography.body, color: "rgba(255,255,255,0.8)", marginTop: spacing.xs },
  emptyCard: {
    backgroundColor: colors.surface, margin: spacing.md, padding: spacing.xl,
    borderRadius: 16, alignItems: "center", elevation: 2,
  },
  emptyTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: "center" },
  planCard: {
    backgroundColor: colors.surface, margin: spacing.md,
    padding: spacing.lg, borderRadius: 16, elevation: 2,
  },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  planTitle: { ...typography.h3, color: colors.text, flex: 1 },
  activeBadge: { backgroundColor: colors.success, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 12 },
  activeBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  planDesc: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs },
  planDuration: { ...typography.bodySmall, color: colors.primary, fontWeight: "500", marginBottom: spacing.sm },
  activitiesSection: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  activitiesTitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
  activityItem: {
    flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  activityCompleted: { opacity: 0.6 },
  checkbox: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
    borderColor: colors.primary, justifyContent: "center", alignItems: "center",
    marginRight: spacing.sm,
  },
  checkboxChecked: { backgroundColor: colors.success, borderColor: colors.success },
  checkMark: { color: "#fff", fontWeight: "700", fontSize: 14 },
  activityInfo: { flex: 1 },
  activityTitle: { ...typography.body, color: colors.text },
  textStrikethrough: { textDecorationLine: "line-through", color: colors.textLight },
  activityDetail: { ...typography.caption, color: colors.textSecondary },
});
