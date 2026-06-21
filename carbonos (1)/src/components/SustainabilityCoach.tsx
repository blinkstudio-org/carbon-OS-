/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { ChatMessage, CarbonProfile } from "../types";
import { Sparkles, Send, Bot, User, Trash2, ArrowRight } from "lucide-react";

interface SustainabilityCoachProps {
  profile: CarbonProfile;
}

export default function SustainabilityCoach({ profile }: SustainabilityCoachProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_init_coach",
      sender: "coach",
      text: "Calibration complete. I am Sora, your personal CarbonOS behavior analyst. Based on your lifestyle parameters, your score starts at **" + profile.carbonScore + "**. How can I assist you with carbon tracking, receipts, or twin simulation projections today?",
      timestamp: new Date().toLocaleTimeString(),
      suggestions: ["Switch to green electricity", "Reduce my meat consumption", "Forecast my 2036 metrics"]
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          userMetrics: profile.metrics,
          carbonScore: profile.carbonScore
        })
      });

      if (!response.ok) {
        throw new Error("Could not reach CarbonOS behavior coach.");
      }

      const coachMsg: ChatMessage = await response.json();
      setMessages((prev) => [...prev, coachMsg]);

    } catch (e: any) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: "coach",
          text: "⚠️ I encountered feedback limitations reaching CarbonOS central servers. Here's a quick tip instead: Upgrading home window caulking or setting overnight temperature cycles saves **140 kg CO₂** annually!",
          timestamp: new Date().toLocaleTimeString(),
          suggestions: ["Unplug standby appliances", "Plant-based meal offsets"]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([
      {
        id: "msg_init_coach_restart",
        sender: "coach",
        text: `Grid reset complete. Let's start fresh, Champion! Ask me anything regarding sustainable offsets or receipt analyses.`,
        timestamp: new Date().toLocaleTimeString(),
        suggestions: ["Explain Carbon Score", "Recommend cheap offsets"]
      }
    ]);
  };

  return (
    <div id="ai_coach_panel" className="bg-white rounded-[24px] border border-slate-100 p-4 shadow-sm relative flex flex-col h-[480px]">
      <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex border-b border-slate-100 pb-3 items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2.5">
          <span className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-150 flex items-center justify-center text-emerald-600">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">AI Behavior Coach</h3>
            <p className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">SORA AGENT CORE // ONLINE</p>
          </div>
        </div>

        <button 
          onClick={clearHistory}
          title="Clear Conversation"
          className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-grow overflow-y-auto space-y-3.5 py-4 pr-1">
        {messages.map((msg) => {
          const isCoach = msg.sender === "coach";
          return (
            <div 
              key={msg.id} 
              className={`flex items-start gap-2.5 max-w-[90%] ${isCoach ? "self-start" : "self-end ml-auto flex-row-reverse"}`}
            >
              <div className={`h-7.5 w-7.5 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                isCoach 
                  ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                  : "bg-slate-100 border-slate-200 text-slate-750"
              }`}>
                {isCoach ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              <div className="space-y-1">
                <div className={`p-3 rounded-2xl text-xs leading-relaxed space-y-1 font-sans ${
                  isCoach 
                    ? "bg-slate-50 border border-slate-150/40 text-slate-700" 
                    : "bg-emerald-600 text-white font-medium shadow-sm"
                }`}>
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                </div>
                
                {/* Suggestions badges */}
                {isCoach && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {msg.suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(suggestion)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100/60 font-sans text-[10px] px-2.5 py-1 rounded-full transition-all cursor-pointer font-bold"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                <span className="text-[9px] text-slate-400 font-mono block text-right">{msg.timestamp}</span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3 animate-fade-in">
            <div className="h-7.5 w-7.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center animate-pulse">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-slate-100 text-slate-500 text-xs py-2 px-3.5 rounded-xl border border-transparent font-mono flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              <span className="ml-1 text-[9px] uppercase font-bold tracking-widest text-slate-400">Sora is writing...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input panel */}
      <div className="border-t border-slate-100 pt-3 flex items-center space-x-2 flex-shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
          placeholder="Ask Sora about offsets or composting..."
          className="flex-grow bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-sans"
        />
        <button
          onClick={() => handleSendMessage(inputText)}
          disabled={!inputText.trim() || loading}
          className="h-9 w-9 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold transition-all flex items-center justify-center shadow-xs flex-shrink-0 cursor-pointer disabled:opacity-40 disabled:hover:bg-emerald-650"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
