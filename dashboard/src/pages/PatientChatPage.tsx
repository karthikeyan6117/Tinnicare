import { useState, useEffect, useRef, KeyboardEvent } from "react";
import api from "../services/api";
import { endpoints } from "../constants/api";
import { MessageSquare, Send, Bot, User, Sparkles, Loader2 } from "lucide-react";

interface Message {
  id?: string;
  sender: "user" | "bot";
  text: string;
  created_at?: string;
}

export default function PatientChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const fetchHistory = async () => {
    try {
      const res = await api.get(endpoints.chat.history);
      const formatted: Message[] = [];
      res.data.forEach((item: any) => {
        formatted.push({ id: item.id + "-user", sender: "user", text: item.message, created_at: item.created_at });
        formatted.push({ id: item.id + "-bot", sender: "bot", text: item.response, created_at: item.created_at });
      });
      setMessages(formatted);
    } catch {
      setMessages([
        {
          sender: "bot",
          text: "Hello! I am your TinniCare AI Assistant. I can help with tinnitus management, sound therapy, stress reduction, and daily symptom tracking.",
        },
      ]);
    } finally {
      setFetchingHistory(false);
    }
  };

  const appendMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    appendMessage({ sender: "user", text: userText, id: `${Date.now()}-user` });
    setLoading(true);

    try {
      const res = await api.post(endpoints.chat.message, { message: userText });
      appendMessage({ sender: "bot", text: res.data.response, id: `${Date.now()}-bot` });
    } catch {
      appendMessage({
        sender: "bot",
        text: "I'm having trouble reaching the AI right now. Please try again soon, or contact a healthcare professional if this is urgent.",
        id: `${Date.now()}-bot-error`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) {
        const form = e.currentTarget.closest("form");
        form?.requestSubmit();
      }
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-teal-500 to-emerald-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight flex items-center gap-2">
              TinniCare AI Assistant <Sparkles className="w-4 h-4 text-amber-300" />
            </h1>
            <p className="text-xs text-teal-100">Powered by LangChain LCEL & Groq LLaMA 3.3 70B</p>
          </div>
        </div>
        <span className="text-xs bg-white/20 backdrop-blur-md text-white font-medium px-3 py-1 rounded-full border border-white/20">
          Online Memory Active
        </span>
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/40">
        {fetchingHistory ? (
          <div className="flex items-center justify-center h-full text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading chat history...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-teal-300" />
            <p className="font-medium text-gray-600">No messages yet</p>
            <p className="text-xs mt-1">Type your question below to start chatting with your AI assistant.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "bot" && (
                <div className="w-9 h-9 rounded-full bg-teal-500 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-md shadow-teal-100">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-xl rounded-[28px] p-5 text-sm leading-7 shadow-sm ${
                msg.sender === "user"
                  ? "bg-teal-600 text-white rounded-br-none"
                  : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
              }`}>
                <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                {msg.created_at && (
                  <div className="mt-2 text-[10px] text-gray-400 text-right">
                    {formatDate(msg.created_at)}
                  </div>
                )}
              </div>

              {msg.sender === "user" && (
                <div className="w-9 h-9 rounded-full bg-gray-700 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-md">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3 items-center text-teal-600 text-xs font-medium pl-2">
            <div className="w-9 h-9 rounded-full bg-teal-500 text-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white px-4 py-3 rounded-3xl border border-gray-100 flex items-center gap-2 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-teal-500" /> Generating ChatGPT-style response...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 space-y-3">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Type your question</label>
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your tinnitus, sound therapy, or care plan..."
          className="w-full resize-none px-4 py-3 rounded-3xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-gray-50/50 leading-6"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">Press Enter to send, Shift+Enter for a new line.</p>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-600 transition-colors shadow-md shadow-teal-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </form>
    </div>
  );
}
