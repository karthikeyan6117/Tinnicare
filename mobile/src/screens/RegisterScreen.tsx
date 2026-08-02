import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { colors, spacing, typography } from "../constants/theme";

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Register">;
};

export default function RegisterScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [age, setAge] = useState("");
  const [occupation, setOccupation] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [hearingAid, setHearingAid] = useState("no");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    if (role === "patient" && !age) {
      Alert.alert("Error", "Please enter your age");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, fullName, role, {
        age: age ? parseInt(age) : undefined,
        occupation: occupation || undefined,
        height: height || undefined,
        weight: weight || undefined,
        hearing_aid: hearingAid,
      });
      Alert.alert("Success", "Account created! Please login.", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (err: any) {
      Alert.alert("Registration Failed", err.response?.data?.detail || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join TinniCare to manage your tinnitus</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={colors.textLight}
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textLight}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Role</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleBtn, role === "patient" && styles.roleBtnActive]}
              onPress={() => setRole("patient")}
            >
              <Text style={[styles.roleText, role === "patient" && styles.roleTextActive]}>Patient</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, role === "doctor" && styles.roleBtnActive]}
              onPress={() => setRole("doctor")}
            >
              <Text style={[styles.roleText, role === "doctor" && styles.roleTextActive]}>Doctor</Text>
            </TouchableOpacity>
          </View>

          {role === "patient" && (
            <>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <TextInput
                style={styles.input}
                placeholder="Age"
                placeholderTextColor={colors.textLight}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Occupation"
                placeholderTextColor={colors.textLight}
                value={occupation}
                onChangeText={setOccupation}
              />
              <TextInput
                style={styles.input}
                placeholder="Height (e.g. 5'10 or 178cm)"
                placeholderTextColor={colors.textLight}
                value={height}
                onChangeText={setHeight}
              />
              <TextInput
                style={styles.input}
                placeholder="Weight (e.g. 70 kg)"
                placeholderTextColor={colors.textLight}
                value={weight}
                onChangeText={setWeight}
              />
              <Text style={styles.label}>Hearing Aid?</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[styles.roleBtn, hearingAid === "yes" && styles.roleBtnActive]}
                  onPress={() => setHearingAid("yes")}
                >
                  <Text style={[styles.roleText, hearingAid === "yes" && styles.roleTextActive]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleBtn, hearingAid === "no" && styles.roleBtnActive]}
                  onPress={() => setHearingAid("no")}
                >
                  <Text style={[styles.roleText, hearingAid === "no" && styles.roleTextActive]}>No</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.link}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: spacing.lg },
  header: { alignItems: "center", marginBottom: spacing.xxl },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  form: { gap: spacing.md },
  label: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: -spacing.xs },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md,
    fontSize: 16, borderWidth: 1, borderColor: colors.border, color: colors.text,
  },
  roleRow: { flexDirection: "row", gap: spacing.sm },
  roleBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.border, alignItems: "center",
    backgroundColor: colors.surface,
  },
  roleBtnActive: { borderColor: colors.primary, backgroundColor: "#EBF4FF" },
  roleText: { ...typography.body, color: colors.text },
  roleTextActive: { color: colors.primary, fontWeight: "600" },
  button: { backgroundColor: colors.primary, borderRadius: 12, padding: spacing.md, alignItems: "center", marginTop: spacing.sm },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  linkText: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginTop: spacing.md },
  link: { color: colors.primary, fontWeight: "600" },
});
