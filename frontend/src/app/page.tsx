"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Terminal, Loader2, BookOpen, Leaf, Settings, Link as LinkIcon, Code } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type DualScript = { devanagari: string; romanized: string; };

type EngineResponse = {
  original_text?: string;
  reduced_text?: string;
  sanskrit_reduced_text?: DualScript;
  dhatu?: { english_roots: string[]; sanskrit_roots: DualScript[]; english_nouns: string[]; sanskrit_nouns: DualScript[]; explanation: string };
  pratyaya?: { english_affixes: string[]; sanskrit_affixes: DualScript[]; state_changes: string[]; explanation: string };
  sandhi?: { english_junctions: string[]; sanskrit_junctions: DualScript[]; optimization: string };
  sutra?: { formal_rule: string; original_structure: string; optimized_structure: string; sanskrit_optimized_structure: DualScript; changes_made: string[] };
  error?: boolean;
  message?: string;
  raw?: string;
};

const cardVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: custom * 0.15, duration: 0.6, ease: "easeOut" }
  })
};

const MandalaSVG = () => (
  <svg className="absolute -right-10 -top-10 w-[32rem] h-[32rem] text-copper-500/25 pointer-events-none rotate-45 transition-all duration-700 group-hover:text-copper-500/40 group-hover:scale-105" viewBox="0 0 100 100" fill="currentColor">
    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
    <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
    <path d="M50 10 L60 40 L90 50 L60 60 L50 90 L40 60 L10 50 L40 40 Z" fill="none" stroke="currentColor" strokeWidth="1"/>
    <path d="M50 20 L55 45 L80 50 L55 55 L50 80 L45 55 L20 50 L45 45 Z" fill="currentColor" opacity="0.6"/>
  </svg>
);

const RootSVG = () => (
  <svg className="absolute -bottom-5 -right-5 w-72 h-72 text-copper-500/20 pointer-events-none transition-all duration-700 group-hover:text-copper-500/30 group-hover:scale-110" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M50 0 C 50 30, 30 50, 10 70 M50 0 C 50 30, 70 50, 90 70 M50 0 V 80 M50 30 C 60 50, 80 60, 90 90 M50 30 C 40 50, 20 60, 10 90" />
    <circle cx="10" cy="70" r="2.5" fill="currentColor" />
    <circle cx="90" cy="70" r="2.5" fill="currentColor" />
    <circle cx="50" cy="80" r="2.5" fill="currentColor" />
    <circle cx="10" cy="90" r="2.5" fill="currentColor" />
    <circle cx="90" cy="90" r="2.5" fill="currentColor" />
  </svg>
);

const GeometrySVG = () => (
  <svg className="absolute top-1/2 right-0 -translate-y-1/2 w-80 h-80 text-copper-500/20 pointer-events-none translate-x-[15%] transition-all duration-700 group-hover:text-copper-500/30 group-hover:scale-105 group-hover:rotate-6" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
    <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" />
    <polygon points="50,20 80,35 80,65 50,80 20,65 20,35" strokeDasharray="2 3"/>
    <circle cx="50" cy="50" r="25" />
    <path d="M50 10 L50 90 M10 30 L90 70 M10 70 L90 30" />
  </svg>
);

const KnotSVG = () => (
  <svg className="absolute -right-2 -bottom-2 w-72 h-72 text-copper-500/20 pointer-events-none transition-all duration-700 group-hover:text-copper-500/30 group-hover:rotate-12 group-hover:scale-110" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
    <ellipse cx="40" cy="50" rx="30" ry="20" transform="rotate(45 40 50)" />
    <ellipse cx="60" cy="50" rx="30" ry="20" transform="rotate(-45 60 50)" />
    <circle cx="50" cy="50" r="15" strokeDasharray="4 4" strokeWidth="1" />
  </svg>
);

const ConstellationSVG = () => (
  <svg className="absolute inset-0 w-full h-full text-copper-500/15 pointer-events-none transition-all duration-700 group-hover:text-copper-500/30 group-hover:scale-105" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="1" preserveAspectRatio="none">
    <path d="M20 20 L50 40 L80 15 L120 30 L160 10 L180 50 L140 80 L90 60 L40 80 Z" strokeDasharray="4 4" />
    <circle cx="20" cy="20" r="3" fill="currentColor"/>
    <circle cx="50" cy="40" r="4" fill="currentColor"/>
    <circle cx="80" cy="15" r="3" fill="currentColor"/>
    <circle cx="120" cy="30" r="5" fill="currentColor"/>
    <circle cx="160" cy="10" r="3" fill="currentColor"/>
    <circle cx="180" cy="50" r="4" fill="currentColor"/>
    <circle cx="140" cy="80" r="3" fill="currentColor"/>
    <circle cx="90" cy="60" r="5" fill="currentColor"/>
    <circle cx="40" cy="80" r="3" fill="currentColor"/>
  </svg>
);

type Message = {
  role: "user" | "engine";
  content: string | EngineResponse;
};

// SVG Background Component
const MandalaBackground = () => (
  <div className="absolute inset-0 z-0 flex items-center justify-center opacity-20 pointer-events-none overflow-hidden">
    <svg
      className="w-[800px] h-[800px] animate-slow-spin text-copper-500/80"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <circle cx="50" cy="50" r="45" strokeDasharray="2 2" />
      <circle cx="50" cy="50" r="35" />
      <circle cx="50" cy="50" r="25" />
      <path d="M 50 5 L 95 95 L 5 95 Z" strokeOpacity="0.7" />
      <path d="M 50 95 L 5 5 L 95 5 Z" strokeOpacity="0.7" />
      {[...Array(12)].map((_, i) => (
        <line
          key={i}
          x1="50"
          y1="50"
          x2={(50 + 45 * Math.cos((i * Math.PI) / 6)).toFixed(2)}
          y2={(50 + 45 * Math.sin((i * Math.PI) / 6)).toFixed(2)}
          strokeOpacity="0.5"
        />
      ))}
      <rect x="25" y="25" width="50" height="50" transform="rotate(45 50 50)" />
    </svg>
  </div>
);

const PaninianResponseCard = ({ data }: { data: EngineResponse }) => {
  if (data.error) {
    return (
      <div className="text-red-400 bg-red-950/50 p-4 rounded-lg border border-red-900/50 font-mono text-sm">
        <p className="font-bold mb-2">{data.message}</p>
        <pre className="whitespace-pre-wrap overflow-x-auto">{data.raw}</pre>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl" style={{ fontFamily: "var(--font-lora)" }}>
      {/* Header: Reduced Text */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
        className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 sm:p-8 rounded-xl border border-copper-900/60 shadow-[0_0_40px_rgba(194,122,70,0.15)] relative overflow-hidden group hover:border-copper-500/40 transition-all duration-500"
      >
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-copper-500/10 rounded-full blur-3xl group-hover:bg-copper-500/20 transition-all duration-700" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 sm:w-40 sm:h-40 bg-copper-700/10 rounded-full blur-3xl group-hover:bg-copper-700/20 transition-all duration-700" />
        <MandalaSVG />
        
        <h2 className="text-copper-500 text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] uppercase font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 relative z-10" style={{ fontFamily: "var(--font-cinzel)" }}>
          <span className="w-4 sm:w-8 h-[1px] bg-copper-500/50" />
          The Paninian Reduction
          <span className="w-4 sm:w-8 h-[1px] bg-copper-500/50" />
        </h2>
        <div className="space-y-4 sm:space-y-6 relative z-10">
          <p className="text-slate-400 text-xs sm:text-sm italic flex items-start sm:items-center gap-2 leading-relaxed">
            <span className="text-copper-700/50">✦</span> Original: <span className="text-slate-300 not-italic font-medium">{data.original_text}</span>
          </p>
          <div className="flex flex-col gap-3 sm:gap-4 pl-3 sm:pl-4 border-l-2 border-copper-900/50">
            <div className="text-xl sm:text-3xl text-copper-100 font-medium leading-relaxed drop-shadow-[0_2px_10px_rgba(194,122,70,0.2)]">
              {data.reduced_text}
            </div>
            {data.sanskrit_reduced_text && (
              <div className="flex flex-col mt-1 sm:mt-2">
                <div className="text-3xl sm:text-4xl text-copper-500/90 font-medium leading-relaxed drop-shadow-[0_0_15px_rgba(194,122,70,0.4)] tracking-wide">
                  {data.sanskrit_reduced_text.devanagari}
                </div>
                <div className="text-[14px] sm:text-[16px] text-copper-500/60 italic tracking-widest mt-1 sm:mt-2 uppercase">
                  {data.sanskrit_reduced_text.romanized}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Grid of Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        <div className="absolute inset-0 bg-copper-500/5 blur-[100px] pointer-events-none" />
        
        {/* DHATU */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={1} className="bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-copper-900/40 hover:border-copper-500/60 hover:shadow-[0_0_25px_rgba(194,122,70,0.15)] transition-all duration-500 flex flex-col h-full group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-copper-500/0 rounded-full blur-2xl group-hover:bg-copper-500/10 transition-all duration-500" />
          <RootSVG />
          
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 border-b border-copper-900/30 pb-3 sm:pb-4 relative z-10">
            <div className="p-1.5 sm:p-2 bg-copper-900/20 rounded-lg">
              <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-copper-500" />
            </div>
            <h3 className="text-copper-100 font-bold uppercase tracking-widest text-base sm:text-lg" style={{ fontFamily: "var(--font-cinzel)" }}>
              [DHATU] Roots
            </h3>
          </div>
          <div className="space-y-4 sm:space-y-5 text-slate-300 text-[14px] sm:text-[15px] leading-relaxed flex-1 relative z-10">
            <div className="space-y-2 bg-slate-950/50 p-3 sm:p-4 rounded-lg border border-slate-800/50">
              <p><strong className="text-copper-400 font-mono text-[10px] sm:text-xs tracking-widest uppercase">English Roots:</strong> {data.dhatu?.english_roots.join(", ")}</p>
              <div className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 ml-1 sm:ml-2 mt-2 border-l-2 border-copper-500/30 pl-2 sm:pl-3">
                {data.dhatu?.sanskrit_roots.map((r, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-copper-300 font-medium text-[15px] sm:text-[16px] drop-shadow-sm">{r.devanagari}</span>
                    <span className="text-copper-500/60 text-[10px] sm:text-xs italic">{r.romanized}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 bg-slate-950/50 p-3 sm:p-4 rounded-lg border border-slate-800/50">
              <p><strong className="text-copper-400 font-mono text-[10px] sm:text-xs tracking-widest uppercase">English Nouns:</strong> {data.dhatu?.english_nouns.join(", ")}</p>
              <div className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 ml-1 sm:ml-2 mt-2 border-l-2 border-copper-500/30 pl-2 sm:pl-3">
                {data.dhatu?.sanskrit_nouns.map((r, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-copper-300 font-medium text-[15px] sm:text-[16px] drop-shadow-sm">{r.devanagari}</span>
                    <span className="text-copper-500/60 text-[10px] sm:text-xs italic">{r.romanized}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="pt-2 sm:pt-4 text-slate-400 mt-auto leading-loose text-[13px] sm:text-sm">{data.dhatu?.explanation}</p>
          </div>
        </motion.div>

        {/* PRATYAYA */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={2} className="bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-copper-900/40 hover:border-copper-500/60 hover:shadow-[0_0_25px_rgba(194,122,70,0.15)] transition-all duration-500 flex flex-col h-full group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-copper-500/0 rounded-full blur-2xl group-hover:bg-copper-500/10 transition-all duration-500" />
          <GeometrySVG />
          
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 border-b border-copper-900/30 pb-3 sm:pb-4 relative z-10">
            <div className="p-1.5 sm:p-2 bg-copper-900/20 rounded-lg">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-copper-500" />
            </div>
            <h3 className="text-copper-100 font-bold uppercase tracking-widest text-base sm:text-lg" style={{ fontFamily: "var(--font-cinzel)" }}>
              [PRATYAYA] Affixes
            </h3>
          </div>
          <div className="space-y-4 sm:space-y-5 text-slate-300 text-[14px] sm:text-[15px] leading-relaxed flex-1 relative z-10">
            <div className="space-y-2 bg-slate-950/50 p-3 sm:p-4 rounded-lg border border-slate-800/50">
              <p><strong className="text-copper-400 font-mono text-[10px] sm:text-xs tracking-widest uppercase">English Modifiers:</strong> {data.pratyaya?.english_affixes.join(", ")}</p>
              <div className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 ml-1 sm:ml-2 mt-2 border-l-2 border-copper-500/30 pl-2 sm:pl-3">
                {data.pratyaya?.sanskrit_affixes.map((r, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-copper-300 font-medium text-[15px] sm:text-[16px] drop-shadow-sm">{r.devanagari}</span>
                    <span className="text-copper-500/60 text-[10px] sm:text-xs italic">{r.romanized}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-950/30 p-2 sm:p-3 rounded-lg border border-slate-800/30">
              <p><strong className="text-copper-400 font-mono text-[10px] sm:text-xs tracking-widest uppercase block mb-1">Effects:</strong> {data.pratyaya?.state_changes.join(", ")}</p>
            </div>
            <p className="pt-2 sm:pt-4 text-slate-400 mt-auto leading-loose text-[13px] sm:text-sm">{data.pratyaya?.explanation}</p>
          </div>
        </motion.div>

        {/* SANDHI */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={3} className="bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-copper-900/40 hover:border-copper-500/60 hover:shadow-[0_0_25px_rgba(194,122,70,0.15)] transition-all duration-500 flex flex-col h-full group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-copper-500/0 rounded-full blur-2xl group-hover:bg-copper-500/10 transition-all duration-500" />
          <KnotSVG />
          
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 border-b border-copper-900/30 pb-3 sm:pb-4 relative z-10">
            <div className="p-1.5 sm:p-2 bg-copper-900/20 rounded-lg">
              <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-copper-500" />
            </div>
            <h3 className="text-copper-100 font-bold uppercase tracking-widest text-base sm:text-lg" style={{ fontFamily: "var(--font-cinzel)" }}>
              [SANDHI] Integration
            </h3>
          </div>
          <div className="space-y-4 sm:space-y-5 text-slate-300 text-[14px] sm:text-[15px] leading-relaxed flex-1 relative z-10">
            <div className="space-y-2 bg-slate-950/50 p-3 sm:p-4 rounded-lg border border-slate-800/50">
              <p><strong className="text-copper-400 font-mono text-[10px] sm:text-xs tracking-widest uppercase">English Junctions:</strong> {data.sandhi?.english_junctions.join(", ")}</p>
              <div className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 ml-1 sm:ml-2 mt-2 border-l-2 border-copper-500/30 pl-2 sm:pl-3">
                {data.sandhi?.sanskrit_junctions.map((r, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-copper-300 font-medium text-[15px] sm:text-[16px] drop-shadow-sm">{r.devanagari}</span>
                    <span className="text-copper-500/60 text-[10px] sm:text-xs italic">{r.romanized}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="pt-2 sm:pt-4 text-slate-400 mt-auto leading-loose text-[13px] sm:text-sm">{data.sandhi?.optimization}</p>
          </div>
        </motion.div>

        {/* SUTRA */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={4} className="bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-copper-900/40 hover:border-copper-500/60 hover:shadow-[0_0_25px_rgba(194,122,70,0.15)] transition-all duration-500 flex flex-col h-full group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-copper-500/0 rounded-full blur-2xl group-hover:bg-copper-500/10 transition-all duration-500" />
          <ConstellationSVG />
          
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 border-b border-copper-900/30 pb-3 sm:pb-4 relative z-10">
            <div className="p-1.5 sm:p-2 bg-copper-900/20 rounded-lg">
              <Code className="w-4 h-4 sm:w-5 sm:h-5 text-copper-500" />
            </div>
            <h3 className="text-copper-100 font-bold uppercase tracking-widest text-base sm:text-lg" style={{ fontFamily: "var(--font-cinzel)" }}>
              [SUTRA] Output Logic
            </h3>
          </div>
          <div className="space-y-4 sm:space-y-6 text-slate-300 text-[14px] sm:text-[15px] leading-relaxed flex-1 relative z-10">
            <p><strong className="text-copper-400 font-mono text-[10px] sm:text-xs tracking-widest uppercase block mb-1">Governing Rule:</strong> {data.sutra?.formal_rule}</p>
            
            <div className="flex flex-col pt-2 relative">
              {/* Connecting line */}
              <div className="absolute left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-red-900/50 via-copper-900/50 to-green-900/50 -translate-x-1/2 z-0" />

              <div className="bg-gradient-to-b from-red-950/40 to-slate-900 border border-red-900/40 p-3 sm:p-4 rounded-xl flex flex-col relative z-10 shadow-lg backdrop-blur-sm">
                <span className="text-[10px] sm:text-xs text-red-400/80 uppercase tracking-widest mb-2 font-mono flex items-center gap-2">
                  <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-red-500/50" /> Original
                </span>
                <span className="text-slate-200 font-mono text-[13px] sm:text-sm leading-relaxed">{data.sutra?.original_structure}</span>
              </div>
              
              {data.sutra?.changes_made && data.sutra.changes_made.length > 0 && (
                <div className="flex justify-center my-2 z-20 relative">
                  <div className="bg-slate-950/95 border border-copper-900/60 px-3 sm:px-5 py-2 sm:py-3 rounded-xl text-[10px] sm:text-xs text-copper-400 font-mono flex flex-col items-center gap-1 sm:gap-2 max-w-[95%] sm:max-w-[90%] shadow-[0_0_20px_rgba(194,122,70,0.15)] backdrop-blur-md">
                    <span className="text-copper-600/70">▼</span>
                    <ul className="list-disc text-left w-full pl-4 m-0 flex flex-col gap-1 sm:gap-2">
                      {data.sutra.changes_made.map((c, i) => <li key={i} className="text-copper-300/90 break-words whitespace-normal leading-relaxed">{c}</li>)}
                    </ul>
                    <span className="text-copper-600/70">▼</span>
                  </div>
                </div>
              )}
              
              <div className="bg-gradient-to-b from-slate-900 to-green-950/40 border border-green-900/40 p-3 sm:p-5 rounded-xl flex flex-col gap-2 sm:gap-3 relative z-10 shadow-lg backdrop-blur-sm">
                <span className="text-[10px] sm:text-xs text-green-400/80 uppercase tracking-widest mb-1 font-mono flex items-center gap-2">
                  <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-green-500/50" /> Optimized
                </span>
                <span className="text-copper-100 font-mono text-[14px] sm:text-[15px] leading-relaxed drop-shadow-sm">{data.sutra?.optimized_structure}</span>
                {data.sutra?.sanskrit_optimized_structure && (
                  <div className="flex flex-col border-t border-green-900/30 pt-2 sm:pt-3 mt-1 gap-1">
                    <span className="text-copper-500 text-[16px] sm:text-[18px] drop-shadow-[0_0_5px_rgba(194,122,70,0.3)]">{data.sutra?.sanskrit_optimized_structure.devanagari}</span>
                    <span className="text-copper-500/60 text-[10px] sm:text-xs italic tracking-wider">{data.sutra?.sanskrit_optimized_structure.romanized}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/analyze` 
        : "http://localhost:8000/api/analyze";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input_text: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to the Paninian Engine");
      }

      const data = await response.json();
      
      let parsedContent: string | EngineResponse;
      try {
        parsedContent = JSON.parse(data.result);
      } catch (err) {
        // Fallback if the engine still outputs string
        parsedContent = data.result;
      }

      setMessages((prev) => [
        ...prev,
        { role: "engine", content: parsedContent },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "engine",
          content: "### [ERROR]\nThe connection to the underlying engine failed. Ensure the FastAPI backend is running on port 8000.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="flex flex-col h-screen bg-transparent text-slate-300 font-sans relative w-full overflow-hidden">
        <MandalaBackground />

        {/* Header */}
        <header className="relative z-10 flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-b border-copper-900/50 bg-slate-950/80 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <BookOpen className="text-copper-500 w-6 h-6 sm:w-8 sm:h-8 drop-shadow-[0_0_8px_rgba(194,122,70,0.5)]" />
            </motion.div>
            <h1 className="text-xl sm:text-3xl tracking-wide text-copper-100 flex items-center gap-2 text-center sm:text-left" style={{ fontFamily: "var(--font-cinzel)" }}>
              The Paninian Code Engine
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[10px] sm:text-sm text-copper-700 font-mono hidden sm:flex">
            <Terminal size={16} />
            <span>v2.0.0</span>
          </div>
        </header>

      {/* Main Chat Area */}
      <main className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 sm:space-y-6 px-4"
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                >
                  <BookOpen className="w-16 h-16 sm:w-20 sm:h-20 text-copper-700/50" />
                </motion.div>
                <p className="text-lg sm:text-xl max-w-lg text-copper-100/70 leading-relaxed" style={{ fontFamily: "var(--font-cinzel)" }}>
                  Enter your complex English sentences or messy code. The Engine will apply ancient Paninian principles to structure and analyze it.
                </p>
              </motion.div>
            )}

            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-full rounded-lg p-6 relative ${
                    msg.role === "user"
                      ? "bg-slate-900 text-slate-200 border border-slate-700/50 shadow-lg"
                      : ""
                  }`}
                >
                  {/* Decorative corner accents for engine messages - removed wrapper styling so cards pop */}
                  {msg.role === "user" ? (
                    <div className="whitespace-pre-wrap font-sans leading-relaxed text-base sm:text-lg">{msg.content as string}</div>
                  ) : (
                    <div className="engine-output flex justify-start w-full overflow-hidden">
                      {typeof msg.content === "string" ? (
                         <div className="bg-slate-950/90 border border-copper-900/50 p-4 sm:p-6 rounded-lg text-base sm:text-lg text-copper-100 font-mono whitespace-pre-wrap break-words w-full">
                           {msg.content}
                         </div>
                      ) : (
                         <PaninianResponseCard data={msg.content} />
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex w-full justify-start"
              >
                <div className="bg-slate-950/90 border border-copper-900/50 rounded-lg p-5 flex items-center gap-4 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-copper-500 m-1 opacity-50" />
                  <Loader2 className="w-5 h-5 text-copper-500 animate-spin" />
                  <span className="text-copper-500 font-mono text-sm animate-pulse tracking-widest uppercase">
                    Analyzing Structure...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="relative z-10 p-3 sm:p-6 bg-slate-950/90 border-t border-copper-900/50 backdrop-blur-md">
        <form
          onSubmit={handleSubmit}
          className="max-w-5xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4 bg-slate-900 p-2 rounded-xl border border-copper-900/40 focus-within:border-copper-500/60 focus-within:shadow-[0_0_15px_rgba(194,122,70,0.15)] transition-all duration-300"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Input sentence or messy code for Paninian analysis..."
            className="flex-1 max-h-32 sm:max-h-48 min-h-[50px] sm:min-h-[60px] bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-600/70 p-2 sm:p-3 resize-none font-sans outline-none text-base sm:text-lg"
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="group relative flex justify-center items-center gap-2 bg-gradient-to-r from-copper-900 to-copper-700 hover:from-copper-700 hover:to-copper-500 text-copper-100 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-xs sm:mb-1 sm:mr-1 shadow-[0_0_10px_rgba(194,122,70,0.2)] hover:shadow-[0_0_20px_rgba(194,122,70,0.4)] overflow-hidden shrink-0"
          >
            {/* Button Shine Effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
            
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin relative z-10" /> : <Terminal className="w-4 h-4 relative z-10" />}
            <span className="relative z-10" style={{ fontFamily: "var(--font-cinzel)" }}>Compile</span>
          </button>
        </form>
      </footer>
    </div>
  );
}
