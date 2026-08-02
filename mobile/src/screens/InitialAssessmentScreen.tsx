import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Animated, Dimensions, Alert, ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing, typography } from "../constants/theme";
import api from "../services/api";

const { width } = Dimensions.get("window");

const QUESTIONS = [
  {
    id: "tinnitus_type",
    question: "What type of tinnitus do you experience?",
    options: ["Subjective (only you can hear)", "Objective (others can hear too)", "Not sure"],
  },
  {
    id: "onset",
    question: "When did your tinnitus start?",
    options: ["Less than 3 months ago", "3-6 months ago", "6-12 months ago", "More than a year ago"],
  },
  {
    id: "frequency",
    question: "How often do you notice your tinnitus?",
    options: ["Rarely (a few times a month)", "Sometimes (a few times a week)", "Often (daily)", "Constantly (always present)"],
  },
  {
    id: "severity",
    question: "How would you rate your tinnitus severity?",
    options: ["Mild (hardly noticeable)", "Moderate (noticeable but manageable)", "Severe (disrupts daily life)", "Very Severe (debilitating)"],
  },
  {
    id: "sleep_impact",
    question: "How much does tinnitus affect your sleep?",
    options: ["Not at all", "Slightly (sometimes delays sleep)", "Moderately (often affects sleep)", "Severely (significantly impacts sleep)"],
  },
  {
    id: "stress_level",
    question: "How would you rate your current stress level?",
    options: ["Low", "Moderate", "High", "Very High"],
  },
];

type Props = {
  navigation: NativeStackNavigationProp<any>;
  onComplete: () => void;
};

export default function InitialAssessmentScreen({ navigation, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [details, setDetails] = useState({ age: "", hearing_issues: "", previous_treatment: "" });
  const [submitting, setSubmitting] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progress = ((step + 1) / (QUESTIONS.length + 1)) * 100;

  const selectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      slideAnim.setValue(0);
      if (step < QUESTIONS.length - 1) {
        setStep(step + 1);
      } else {
        setStep(QUESTIONS.length);
      }
    });
  };

  const handleSubmit = async () => {
    if (!details.age) { Alert.alert("Required", "Please enter your age"); return; }
    setSubmitting(true);
    try {
      await api.post("/assessments/initial", {
        ...answers,
        age: parseInt(details.age),
        hearing_issues: details.hearing_issues,
        previous_treatment: details.previous_treatment,
      });
      await AsyncStorage.setItem("assessment_completed", "true");
      onComplete();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.detail || "Failed to save assessment");
    } finally {
      setSubmitting(false);
    }
  };

  if (step < QUESTIONS.length) {
    const q = QUESTIONS[step];
    return (
      <View style={styles.container}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.stepIndicator}>{step + 1} of {QUESTIONS.length}</Text>
        <Animated.View style={[styles.questionCard, { opacity: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.8] }) }]}>
          <Text style={styles.questionText}>{q.question}</Text>
          <View style={styles.optionsContainer}>
            {q.options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.optionBtn, answers[q.id] === opt && styles.optionBtnActive]}
                onPress={() => selectOption(q.id, opt)}
              >
                <Text style={[styles.optionText, answers[q.id] === opt && styles.optionTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: "100%" }]} />
      </View>
      <Text style={styles.completionTitle}>Almost Done!</Text>
      <Text style={styles.completionSubtext}>Just a few more details to complete your profile</Text>

      <View style={styles.detailsCard}>
        <Text style={styles.detailLabel}>Your Age</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your age"
          placeholderTextColor={colors.textLight}
          value={details.age}
          onChangeText={(t) => setDetails({ ...details, age: t })}
          keyboardType="numeric"
        />

        <Text style={styles.detailLabel}>Any existing hearing issues?</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="E.g., hearing loss, ear infections..."
          placeholderTextColor={colors.textLight}
          value={details.hearing_issues}
          onChangeText={(t) => setDetails({ ...details, hearing_issues: t })}
          multiline
        />

        <Text style={styles.detailLabel}>Previous treatments tried?</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="E.g., medication, therapy, sound machines..."
          placeholderTextColor={colors.textLight}
          value={details.previous_treatment}
          onChangeText={(t) => setDetails({ ...details, previous_treatment: t })}
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
          <Text style={styles.submitBtnText}>Create My Profile</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxl },
  progressBar: { height: 4, backgroundColor: colors.border, marginTop: spacing.xxl + 20 },
  progressFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 2 },
  stepIndicator: { textAlign: "center", ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  questionCard: { margin: spacing.lg, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: 20, elevation: 3 },
  questionText: { ...typography.h3, color: colors.text, marginBottom: spacing.lg, lineHeight: 26 },
  optionsContainer: { gap: spacing.sm },
  optionBtn: {
    padding: spacing.md, borderRadius: 14, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.background,
  },
  optionBtnActive: { borderColor: colors.primary, backgroundColor: "#EBF4FF" },
  optionText: { ...typography.body, color: colors.text },
  optionTextActive: { color: colors.primary, fontWeight: "600" },
  completionTitle: { ...typography.h2, color: colors.text, textAlign: "center", marginTop: spacing.xl },
  completionSubtext: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xs, marginBottom: spacing.lg },
  detailsCard: { backgroundColor: colors.surface, margin: spacing.md, padding: spacing.lg, borderRadius: 20, elevation: 2 },
  detailLabel: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.background, borderRadius: 12, padding: spacing.md,
    fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.border,
  },
  textArea: { height: 90, textAlignVertical: "top" },
  submitBtn: {
    backgroundColor: colors.primary, margin: spacing.md, padding: spacing.md,
    borderRadius: 14, alignItems: "center", marginTop: spacing.lg,
  },
  submitBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});
