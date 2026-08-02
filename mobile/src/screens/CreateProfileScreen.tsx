import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import api from "../services/api";
import { endpoints } from "../constants/api";
import { useAuth } from "../context/AuthContext";
import { colors, spacing, typography } from "../constants/theme";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

type FormData = {
  age: string; gender: string; occupation: string; height: string; weight: string; hearing_aid: string;
  existing_conditions: string; medications: string; family_history: string; allergies: string;
  affected_ear: string; sound_type: string; tinnitus_duration: string; tinnitus_onset: string; severity_rating: string;
  smoking: string; alcohol: string; caffeine: string; exercise: string;
};

const STEPS = ["Basic Info", "Medical History", "Tinnitus", "Lifestyle"];

export default function CreateProfileScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    age: "", gender: "", occupation: "", height: "", weight: "", hearing_aid: "",
    existing_conditions: "", medications: "", family_history: "", allergies: "",
    affected_ear: "", sound_type: "", tinnitus_duration: "", tinnitus_onset: "", severity_rating: "",
    smoking: "", alcohol: "", caffeine: "", exercise: "",
  });

  const update = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.put(endpoints.auth.profileUpdate, {
        basic: { age: parseInt(form.age) || 0, gender: form.gender || null, occupation: form.occupation || null, height: form.height || null, weight: form.weight || null, hearing_aid: form.hearing_aid || null },
        medical: { existing_conditions: form.existing_conditions || null, medications: form.medications || null, family_history: form.family_history || null, allergies: form.allergies || null },
        tinnitus: { affected_ear: form.affected_ear || null, sound_type: form.sound_type || null, tinnitus_duration: form.tinnitus_duration || null, tinnitus_onset: form.tinnitus_onset || null, severity_rating: form.severity_rating || null },
        lifestyle: { smoking: form.smoking || null, alcohol: form.alcohol || null, caffeine: form.caffeine || null, exercise: form.exercise || null },
        mark_completed: true,
      });
      Alert.alert("Profile Complete", "Your profile has been saved.");
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.detail || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={{ gap: spacing.md }}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <TextInput style={styles.input} placeholder="Age *" placeholderTextColor={colors.textLight} value={form.age} onChangeText={v => update("age", v)} keyboardType="numeric" />
            <Text style={styles.label}>Gender</Text>
            <View style={styles.row}>
              {["male", "female", "other"].map(v => (
                <TouchableOpacity key={v} style={[styles.optionBtn, form.gender === v && styles.optionBtnActive]} onPress={() => update("gender", v)}>
                  <Text style={[styles.optionText, form.gender === v && styles.optionTextActive]}>{v.charAt(0).toUpperCase() + v.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Occupation" placeholderTextColor={colors.textLight} value={form.occupation} onChangeText={v => update("occupation", v)} />
            <TextInput style={styles.input} placeholder="Height (e.g. 5'10 or 178cm)" placeholderTextColor={colors.textLight} value={form.height} onChangeText={v => update("height", v)} />
            <TextInput style={styles.input} placeholder="Weight (e.g. 70 kg)" placeholderTextColor={colors.textLight} value={form.weight} onChangeText={v => update("weight", v)} />
            <Text style={styles.label}>Hearing Aid?</Text>
            <View style={styles.row}>
              {["yes", "no"].map(v => (
                <TouchableOpacity key={v} style={[styles.optionBtn, form.hearing_aid === v && styles.optionBtnActive]} onPress={() => update("hearing_aid", v)}>
                  <Text style={[styles.optionText, form.hearing_aid === v && styles.optionTextActive]}>{v.charAt(0).toUpperCase() + v.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 1:
        return (
          <View style={{ gap: spacing.md }}>
            <Text style={styles.sectionTitle}>Medical History</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Existing Conditions" placeholderTextColor={colors.textLight} value={form.existing_conditions} onChangeText={v => update("existing_conditions", v)} multiline />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Current Medications" placeholderTextColor={colors.textLight} value={form.medications} onChangeText={v => update("medications", v)} multiline />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Family History" placeholderTextColor={colors.textLight} value={form.family_history} onChangeText={v => update("family_history", v)} multiline />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Allergies" placeholderTextColor={colors.textLight} value={form.allergies} onChangeText={v => update("allergies", v)} multiline />
          </View>
        );
      case 2:
        return (
          <View style={{ gap: spacing.md }}>
            <Text style={styles.sectionTitle}>Tinnitus Details</Text>
            <Text style={styles.label}>Affected Ear</Text>
            <View style={styles.row}>
              {["left", "right", "both"].map(v => (
                <TouchableOpacity key={v} style={[styles.optionBtn, form.affected_ear === v && styles.optionBtnActive]} onPress={() => update("affected_ear", v)}>
                  <Text style={[styles.optionText, form.affected_ear === v && styles.optionTextActive]}>{v.charAt(0).toUpperCase() + v.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Sound Type</Text>
            <View style={styles.row}>
              {["ringing", "buzzing", "hissing", "roaring", "clicking", "pulsing"].map(v => (
                <TouchableOpacity key={v} style={[styles.optionBtn, form.sound_type === v && styles.optionBtnActive, { flex: undefined, paddingHorizontal: 12 }]} onPress={() => update("sound_type", v)}>
                  <Text style={[styles.optionText, form.sound_type === v && styles.optionTextActive]}>{v.charAt(0).toUpperCase() + v.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Duration</Text>
            <View style={styles.row}>
              {[["lt3", "< 3 months"], ["3-6", "3–6 mo"], ["6-12", "6–12 mo"], ["1-2y", "1–2 yr"], ["gt2", "> 2 yr"]].map(([val, label]) => (
                <TouchableOpacity key={val} style={[styles.optionBtn, form.tinnitus_duration === val && styles.optionBtnActive, { flex: undefined, paddingHorizontal: 10 }]} onPress={() => update("tinnitus_duration", val)}>
                  <Text style={[styles.optionText, form.tinnitus_duration === val && styles.optionTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Onset</Text>
            <View style={styles.row}>
              {["sudden", "gradual", "after injury", "after illness", "noise exposure"].map(v => (
                <TouchableOpacity key={v} style={[styles.optionBtn, form.tinnitus_onset === v && styles.optionBtnActive, { flex: undefined, paddingHorizontal: 10 }]} onPress={() => update("tinnitus_onset", v)}>
                  <Text style={[styles.optionText, form.tinnitus_onset === v && styles.optionTextActive]}>{v.charAt(0).toUpperCase() + v.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Severity (1–10)</Text>
            <View style={styles.row}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <TouchableOpacity key={n} style={[styles.numBtn, form.severity_rating === String(n) && styles.numBtnActive]} onPress={() => update("severity_rating", String(n))}>
                  <Text style={[styles.numText, form.severity_rating === String(n) && styles.numTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={{ gap: spacing.md }}>
            <Text style={styles.sectionTitle}>Lifestyle</Text>
            <Text style={styles.label}>Smoking</Text>
            <View style={styles.row}>
              {["never", "former", "occasional", "regular"].map(v => (
                <TouchableOpacity key={v} style={[styles.optionBtn, form.smoking === v && styles.optionBtnActive, { flex: undefined, paddingHorizontal: 14 }]} onPress={() => update("smoking", v)}>
                  <Text style={[styles.optionText, form.smoking === v && styles.optionTextActive]}>{v.charAt(0).toUpperCase() + v.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Alcohol</Text>
            <View style={styles.row}>
              {["never", "rarely", "moderate", "frequent"].map(v => (
                <TouchableOpacity key={v} style={[styles.optionBtn, form.alcohol === v && styles.optionBtnActive, { flex: undefined, paddingHorizontal: 14 }]} onPress={() => update("alcohol", v)}>
                  <Text style={[styles.optionText, form.alcohol === v && styles.optionTextActive]}>{v.charAt(0).toUpperCase() + v.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Caffeine</Text>
            <View style={styles.row}>
              {["none", "low", "moderate", "high"].map(v => (
                <TouchableOpacity key={v} style={[styles.optionBtn, form.caffeine === v && styles.optionBtnActive, { flex: undefined, paddingHorizontal: 14 }]} onPress={() => update("caffeine", v)}>
                  <Text style={[styles.optionText, form.caffeine === v && styles.optionTextActive]}>{v.charAt(0).toUpperCase() + v.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Exercise</Text>
            <View style={styles.row}>
              {["none", "light", "moderate", "active"].map(v => (
                <TouchableOpacity key={v} style={[styles.optionBtn, form.exercise === v && styles.optionBtnActive, { flex: undefined, paddingHorizontal: 14 }]} onPress={() => update("exercise", v)}>
                  <Text style={[styles.optionText, form.exercise === v && styles.optionTextActive]}>{v.charAt(0).toUpperCase() + v.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>Almost done! Tap Complete to finish setting up your profile.</Text>
            </View>
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Help us personalize your care</Text>
        </View>

        <View style={styles.stepIndicator}>
          {STEPS.map((label, i) => (
            <View key={label} style={styles.stepItem}>
              <View style={[styles.stepDot, i <= step ? styles.stepDotActive : styles.stepDotInactive]}>
                <Text style={[styles.stepDotText, i <= step ? styles.stepDotTextActive : styles.stepDotTextInactive]}>{i + 1}</Text>
              </View>
              {i < STEPS.length - 1 && <View style={[styles.stepLine, i < step ? styles.stepLineActive : styles.stepLineInactive]} />}
            </View>
          ))}
        </View>

        <View style={styles.form}>{renderStep()}</View>

        <View style={styles.navRow}>
          {step > 0 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          {step < 3 ? (
            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(s => s + 1)}>
              <Text style={styles.nextText}>Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.nextBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextText}>Complete Profile</Text>}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xxl * 2 },
  header: { alignItems: "center", marginBottom: spacing.xxl },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  stepIndicator: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: spacing.xl },
  stepItem: { flexDirection: "row", alignItems: "center" },
  stepDot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  stepDotActive: { backgroundColor: colors.primary },
  stepDotInactive: { backgroundColor: colors.border },
  stepDotText: { fontSize: 14, fontWeight: "600" },
  stepDotTextActive: { color: "#fff" },
  stepDotTextInactive: { color: colors.textLight },
  stepLine: { width: 24, height: 2, marginHorizontal: 6 },
  stepLineActive: { backgroundColor: colors.primary },
  stepLineInactive: { backgroundColor: colors.border },
  form: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  label: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: -spacing.xs, marginTop: spacing.xs },
  input: {
    backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md,
    fontSize: 16, borderWidth: 1, borderColor: colors.border, color: colors.text,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  optionBtn: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  optionBtnActive: { borderColor: colors.primary, backgroundColor: "#EBF4FF" },
  optionText: { ...typography.body, color: colors.text },
  optionTextActive: { color: colors.primary, fontWeight: "600" },
  numBtn: {
    width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  numBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  numText: { fontSize: 14, color: colors.text },
  numTextActive: { color: "#fff", fontWeight: "600" },
  summaryCard: { backgroundColor: "#EBF4FF", borderRadius: 12, padding: spacing.md, marginTop: spacing.md },
  summaryText: { ...typography.body, color: colors.primary, textAlign: "center" },
  navRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.lg },
  backBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border },
  backText: { ...typography.body, color: colors.textSecondary },
  nextBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, alignItems: "center", minWidth: 140 },
  nextText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
