import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { colors, spacing, typography } from "../constants/theme";
import api from "../services/api";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const QUICK_ACTIONS = [
  "What can help with my tinnitus today?",
  "Explain my risk level",
  "Tips for better sleep",
  "When should I see a doctor?",
];

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      text: "Hi! I'm your TinniCare AI assistant. Ask me anything about your tinnitus or get personalized tips.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/chat/message", { message: text.trim() });
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: res.data.response || res.data.message || "I'm here to help! Could you tell me more about your symptoms?",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const fallback: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting. Please try again or check your connection.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageRow, item.sender === "user" && styles.userRow]}>
      <View style={[styles.bubble, item.sender === "user" ? styles.userBubble : styles.botBubble]}>
        <Text style={[styles.bubbleText, item.sender === "user" && styles.userBubbleText]}>{item.text}</Text>
        <Text style={[styles.timestamp, item.sender === "user" && styles.userTimestamp]}>
          {item.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🤖</Text>
        <Text style={styles.headerTitle}>AI Assistant</Text>
        <Text style={styles.headerSubtext}>Ask me anything about your tinnitus</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListHeaderComponent={
          messages.length === 1 ? (
            <View style={styles.quickActions}>
              <Text style={styles.quickTitle}>Quick Questions</Text>
              <View style={styles.quickGrid}>
                {QUICK_ACTIONS.map((action) => (
                  <TouchableOpacity
                    key={action}
                    style={styles.quickBtn}
                    onPress={() => sendMessage(action)}
                  >
                    <Text style={styles.quickBtnText}>{action}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null
        }
      />

      {loading && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.typingText}>AI is thinking...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask about your tinnitus..."
          placeholderTextColor={colors.textLight}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    alignItems: "center", paddingTop: spacing.xxl + 10, paddingBottom: spacing.md,
    backgroundColor: colors.accent, paddingHorizontal: spacing.md,
  },
  headerIcon: { fontSize: 36, marginBottom: spacing.xs },
  headerTitle: { ...typography.h2, color: "#fff" },
  headerSubtext: { ...typography.bodySmall, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  chatList: { flex: 1 },
  chatContent: { padding: spacing.md, paddingBottom: spacing.sm },
  messageRow: { marginBottom: spacing.sm },
  userRow: { alignItems: "flex-end" },
  bubble: { maxWidth: "80%", padding: spacing.md, borderRadius: 18 },
  botBubble: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, elevation: 1, alignSelf: "flex-start" },
  userBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleText: { ...typography.body, color: colors.text, lineHeight: 22 },
  userBubbleText: { color: "#fff" },
  timestamp: { ...typography.caption, color: colors.textLight, marginTop: 4, alignSelf: "flex-end" },
  userTimestamp: { color: "rgba(255,255,255,0.6)" },
  quickActions: { marginBottom: spacing.lg },
  quickTitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  quickBtn: {
    backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border, elevation: 1,
  },
  quickBtnText: { ...typography.bodySmall, color: colors.primary, fontWeight: "500" },
  typingIndicator: { flexDirection: "row", alignItems: "center", padding: spacing.sm, paddingLeft: spacing.md },
  typingText: { ...typography.bodySmall, color: colors.textLight, marginLeft: spacing.sm },
  inputContainer: {
    flexDirection: "row", alignItems: "flex-end", padding: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
  },
  input: {
    flex: 1, backgroundColor: colors.background, borderRadius: 20,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, maxHeight: 100,
    fontSize: 16, color: colors.text, marginRight: spacing.sm,
  },
  sendBtn: {
    backgroundColor: colors.primary, width: 56, height: 56, borderRadius: 28,
    justifyContent: "center", alignItems: "center",
  },
  sendBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
