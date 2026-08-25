"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, User, RotateCcw, Loader2, ChevronDown } from "lucide-react";
import Link from "next/link";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome-1",
    role: "assistant",
    content: `হ্যালো! **XoXo Shop**-এ আপনাকে স্বাগতম! 🎮
আমি আপনার এআই অ্যাসিস্ট্যান্ট। Free Fire Diamond Top-Up, UID টপআপ, বা পেমেন্ট সংক্রান্ত যেকোনো বিষয়ে আমি সাহায্য করতে পারি।`,
    timestamp: "Just now",
  },
];

const SUGGESTIONS = [
  "⚡ UID দিয়ে টপআপ করার নিয়ম",
  "💳 বিকাশ / নগদ পেমেন্ট হেল্প",
  "⏱️ ডেলিভারি হতে কতক্ষণ লাগে?",
  "📞 কাস্টমার কেয়ার হেল্পলাইন",
];

export function FloatingChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(1);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    messageIdRef.current += 1;
    const userMsg: ChatMessage = {
      id: `user-${messageIdRef.current}`,
      role: "user",
      content: query,
      timestamp: "Now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch response");
      }

      const data = await res.json();
      messageIdRef.current += 1;
      const botMsg: ChatMessage = {
        id: `bot-${messageIdRef.current}`,
        role: "assistant",
        content: data.reply || "দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না।",
        timestamp: "Now",
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      messageIdRef.current += 1;
      const errorMsg: ChatMessage = {
        id: `bot-err-${messageIdRef.current}`,
        role: "assistant",
        content:
          "দুঃখিত, সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন বা সরাসরি আমাদের [টেলিগ্রাম সাপোর্টে](https://t.me/xoxoshop_support) মেসেজ দিন।",
        timestamp: "Now",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  const renderMarkdownText = (text: string) => {
    // Format bold and markdown links safely
    const parts = text.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*|\n)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-bold text-purple-950 dark:text-purple-200">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
        const titleMatch = part.match(/\[(.*?)\]/);
        const urlMatch = part.match(/\((.*?)\)/);
        if (titleMatch && urlMatch) {
          const rawUrl = urlMatch[1].trim();
          const lowerUrl = rawUrl.toLowerCase();

          // Reject unsafe protocols to prevent XSS
          const isUnsafe =
            lowerUrl.startsWith("javascript:") ||
            lowerUrl.startsWith("data:") ||
            lowerUrl.startsWith("vbscript:");

          // Safe protocols: http:, https:, mailto:, tel:, or leading / (relative path)
          const isSafeExternal =
            !isUnsafe &&
            (lowerUrl.startsWith("https://") ||
              lowerUrl.startsWith("http://") ||
              lowerUrl.startsWith("mailto:") ||
              lowerUrl.startsWith("tel:"));
          const isSafeRelative = !isUnsafe && rawUrl.startsWith("/") && !rawUrl.startsWith("//");

          if (isSafeExternal) {
            return (
              <a
                key={index}
                href={rawUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 dark:text-purple-400 font-bold underline hover:opacity-80"
              >
                {titleMatch[1]}
              </a>
            );
          } else if (isSafeRelative) {
            return (
              <Link
                key={index}
                href={rawUrl}
                onClick={() => setIsOpen(false)}
                className="text-purple-600 dark:text-purple-400 font-bold underline hover:opacity-80 cursor-pointer"
              >
                {titleMatch[1]}
              </Link>
            );
          } else {
            // Neutralize unsafe schemes by rendering title as plain text
            return <span key={index}>{titleMatch[1]}</span>;
          }
        }
      }
      if (part === "\n") {
        return <br key={index} />;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-50 flex items-center gap-2">
          {/* Tooltip / Prompt bubble on desktop */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/90 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-lg border border-purple-500/30 backdrop-blur-md animate-bounce">
            <Sparkles size={12} className="text-purple-400" />
            <span>Need Help? Chat AI</span>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open AI Assistant"
            className="w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white flex items-center justify-center shadow-[0_3px_15px_rgba(147,51,234,0.4)] hover:scale-110 active:scale-95 transition-all duration-300 relative group cursor-pointer"
          >
            <Bot size={20} className="sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-green-500 border-2 border-white dark:border-black"></span>
            </span>
          </button>
        </div>
      )}

      {/* Floating Chat Modal / Widget */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 w-[94vw] sm:w-[400px] h-[550px] max-h-[82vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-purple-200 dark:border-slate-800 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white p-1 flex items-center justify-center border border-white/40 shadow-inner">
                  <img src="/xoxo_logo.png" alt="XoXo AI" className="w-full h-full object-contain" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-purple-800 rounded-full"></span>
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  XoXo Assistant
                  <span className="bg-purple-500/40 text-purple-200 text-[9px] font-black uppercase px-2 py-0.2 rounded-full border border-purple-400/30">
                    Gemini AI
                  </span>
                </h3>
                <span className="text-[11px] text-purple-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                  Online • Instant FF Support
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="Reset Chat"
                className="w-8 h-8 rounded-full hover:bg-white/15 text-purple-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                className="w-8 h-8 rounded-full hover:bg-white/15 text-purple-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronDown size={20} />
              </button>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 text-xs shadow-sm mt-0.5">
                      <Bot size={16} />
                    </div>
                  )}

                  <div
                    className={`flex flex-col gap-1 max-w-[82%] ${
                      isUser ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        isUser
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none"
                          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-bl-none"
                      }`}
                    >
                      {renderMarkdownText(msg.content)}
                    </div>
                    <span className="text-[9px] text-slate-400 px-1 font-medium">
                      {msg.timestamp}
                    </span>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 text-xs shadow-sm mt-0.5">
                      <User size={16} />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium py-1">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce"></span>
                  <span
                    className="w-2 h-2 rounded-full bg-purple-600 animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></span>
                  <span
                    className="w-2 h-2 rounded-full bg-purple-600 animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick FAQ Suggestion Chips */}
          <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(s)}
                disabled={isLoading}
                className="whitespace-nowrap text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about FF Topup..."
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-md disabled:opacity-40 transition-all cursor-pointer"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
