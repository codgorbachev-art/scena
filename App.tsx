import React, { useEffect, useState, useRef } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { OptionCards } from "./components/OptionCards";
import { ResultPanel } from "./components/ResultPanel";
import { Uploader } from "./components/Uploader";
import { ThumbnailCarousel } from "./components/ThumbnailCarousel";
import { Attachment, GenerateResult } from "./types";
import { formatMMSS } from "./utils";
import { generateScenario } from "./services/geminiService";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: 15 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 140 } }
};

const styleItems = [
  { 
    key: "storytelling", 
    title: "История", 
    desc: "Арка повествования",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  },
  { 
    key: "provocative", 
    title: "Провокация", 
    desc: "Хайп и вызов",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
  },
  { 
    key: "educational", 
    title: "Обучение", 
    desc: "Польза и факты",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
  },
  { 
    key: "entertaining", 
    title: "Шоу", 
    desc: "Динамика и юмор",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/></svg>
  },
];

const directionItems = [
  { 
    key: "sale", 
    title: "Продажи", 
    desc: "Фокус на оффер",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/></svg>
  },
  { 
    key: "expertise", 
    title: "Эксперт", 
    desc: "Личный бренд",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
  },
  { 
    key: "ads", 
    title: "Нативка", 
    desc: "Нативная подача",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
  },
  { 
    key: "engagement", 
    title: "Виральность", 
    desc: "Шеринг и лайки",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7"/></svg>
  },
];

const platformItems = [
  { 
    key: "youtube", 
    title: "YouTube", 
    desc: "16:9 Горизонтально",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75"/></svg>
  },
  { 
    key: "reels", 
    title: "Reels / TikTok", 
    desc: "9:16 Вертикально",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/></svg>
  }
];

function HomePage() {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [style, setStyle] = useState<any>("storytelling");
  const [direction, setDirection] = useState<any>("expertise");
  const [platform, setPlatform] = useState<any>("youtube");
  const [durationSec, setDurationSec] = useState(180);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<GenerateResult | null>(null);
  
  const [isListening, setIsListening] = useState(false);
  const [apiKeySelected, setApiKeySelected] = useState<boolean | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setApiKeySelected(selected);
      } else {
        setApiKeySelected(true);
      }
    };
    checkKey();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'ru-RU';
      recognitionRef.current.onresult = (e: any) => setText(p => p + " " + e.results[0][0].transcript);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const handleOpenSelectKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setApiKeySelected(true);
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (isListening) { recognitionRef.current.stop(); } 
    else { setIsListening(true); recognitionRef.current.start(); }
  };

  async function onGenerate() {
    if (!text && attachments.length === 0) return setError("Опишите вашу идею или добавьте файлы");
    setLoading(true);
    setError(null);
    setCurrentResult(null);

    try {
      const result = await generateScenario({
        input: { text, attachments },
        options: { style, direction, durationSec, platform, ctaStrength: "soft" },
      });
      setCurrentResult(result);
      setTimeout(() => {
        document.getElementById('result-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (e: any) {
      const msg = e.message || "Ошибка ИИ";
      if (msg.includes("Requested entity was not found.")) setApiKeySelected(false);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (apiKeySelected === false) {
    return (
      <div className="min-h-screen bg-[#020203] flex items-center justify-center p-8">
        <div className="glass-card p-16 rounded-[4rem] text-center max-w-xl w-full border-emerald-500/10">
          <div className="w-24 h-24 bg-emerald-500/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-emerald-500/10">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778z"/><path d="M12 12l.94 2.48c.18.47.63.78 1.14.78h2.34c.5 0 .93-.31 1.1-.78l.48-1.48h2.5"/><path d="M16 8l2 2"/></svg>
          </div>
          <h2 className="text-3xl font-heading font-black mb-6 uppercase tracking-tight text-white">Требуется API ключ</h2>
          <p className="text-zinc-500 mb-12 font-bold uppercase tracking-[0.2em] text-[10px]">Для работы студии требуется ключ с биллингом.</p>
          <button onClick={handleOpenSelectKey} className="w-full py-6 bg-emerald-600 text-white font-heading text-[12px] font-black uppercase tracking-[0.4em] rounded-3xl hover:bg-emerald-500 transition-all shadow-[0_20px_40px_rgba(16,185,129,0.2)]">Подключить ключ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mx-auto max-w-[1440px] px-6 lg:px-12 py-10 lg:py-16">
        
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-16 gap-10">
          <div className="space-y-3">
            <motion.div variants={itemVariants} className="flex items-center gap-6">
              <h1 className="text-4xl md:text-6xl font-heading font-black tracking-tighter uppercase flex items-center gap-4">
                <span className="text-white">SCENARIST</span>
                <span className="bg-emerald-500 text-black px-4 py-1 rounded-[1.5rem] text-xl md:text-3xl font-heading -rotate-3 shadow-lg">PRO</span>
              </h1>
            </motion.div>
            <motion.p variants={itemVariants} className="text-emerald-500/50 text-[10px] md:text-xs font-mono font-bold uppercase tracking-[0.5em]">
              Creative Intelligence Engine • Gemini 3.0
            </motion.p>
          </div>
          
          <motion.div variants={itemVariants} className="flex items-center gap-6">
             <div className="px-6 py-4 rounded-[2rem] glass-card flex items-center gap-6 inner-glow">
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981]" />
               <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-zinc-400">
                 Статус: Активен
               </span>
             </div>
          </motion.div>
        </header>

        {/* Bento Grid Layout */}
        <div className="bento-grid">
          
          {/* Main Controls & Input (Left Section) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Input Bento */}
            <motion.div variants={itemVariants} className="glass-card bento-glow rounded-[3rem] p-10 md:p-12 flex flex-col min-h-[450px]">
              <div className="flex justify-between items-center mb-10">
                 <div className="flex items-center gap-5">
                   <div className="w-12 h-12 rounded-[1.25rem] bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10 inner-glow">
                     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                   </div>
                   <h2 className="text-[11px] font-heading font-black uppercase tracking-[0.5em] text-zinc-400">Терминал ввода</h2>
                 </div>
                 <button onClick={toggleVoiceInput} className={`p-4 rounded-2xl border transition-all ${isListening ? 'bg-rose-500 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-white hover:border-zinc-700'}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg></button>
              </div>

              <textarea 
                value={text} 
                onChange={(e) => setText(e.target.value)}
                placeholder="Опишите ваше видение ролика..."
                className="w-full flex-1 bg-transparent text-2xl font-black placeholder:text-zinc-900 outline-none resize-none leading-[1.4] text-white mb-10 selection:bg-emerald-500/20"
              />
              
              <div className="pt-10 border-t border-white/[0.03]">
                <Uploader onAttachmentsChange={setAttachments} hint="PDF техзадания или фото объекта" />
              </div>
            </motion.div>

            {/* Platform & Duration Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <motion.div variants={itemVariants} className="glass-card bento-glow rounded-[2.5rem] p-8 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-8">
                   <span className="text-[9px] font-mono font-black uppercase text-zinc-600 tracking-[0.4em]">Хронометраж</span>
                   <span className="text-3xl font-mono font-black text-emerald-500 tracking-tighter">{formatMMSS(durationSec)}</span>
                </div>
                <input 
                  type="range" min={15} max={1800} step={15} value={durationSec} 
                  onChange={(e) => setDurationSec(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-900 rounded-full appearance-none cursor-pointer accent-emerald-500"
                />
              </motion.div>
              
              <motion.button 
                disabled={loading} onClick={onGenerate}
                whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="glass-card bento-glow rounded-[2.5rem] py-10 bg-emerald-600 text-white font-heading font-black uppercase tracking-[0.6em] shadow-[0_20px_50px_-10px_rgba(16,185,129,0.3)] disabled:opacity-30 transition-all text-[12px] group"
              >
                <span className="relative z-10">{loading ? "Синтез..." : "Создать"}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
              </motion.button>
            </div>

            {/* Options Bento Tile */}
            <motion.div variants={itemVariants} className="space-y-6">
              <OptionCards title="Платформа" items={platformItems} value={platform} onChange={setPlatform} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <OptionCards title="Тон" items={styleItems} value={style} onChange={setStyle} />
                <OptionCards title="Стратегия" items={directionItems} value={direction} onChange={setDirection} />
              </div>
            </motion.div>

          </div>

          {/* Results Display (Right Section) */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <motion.div variants={itemVariants} id="result-area" className="flex-1 bento-glow min-h-[600px]">
              <ResultPanel loading={loading} error={error} result={currentResult} onCopy={() => {}} />
            </motion.div>

            <AnimatePresence>
              {currentResult && !loading && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: 30 }}
                  className="w-full"
                >
                  <ThumbnailCarousel ideas={currentResult.thumbnailIdeas} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Router>
  );
}