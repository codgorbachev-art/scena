import React, { useEffect, useState, useRef } from "react";
import { HashRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { OptionCards } from "./components/OptionCards";
import { ResultPanel } from "./components/ResultPanel";
import { Uploader } from "./components/Uploader";
import { ThumbnailCarousel } from "./components/ThumbnailCarousel";
import { AudioPlayer } from "./components/AudioPlayer";
import { BrainstormChat } from "./components/BrainstormChat";
import { Attachment, GenerateResult, Limits } from "./types";
import { formatMMSS } from "./utils";
import { generateScenario } from "./services/geminiService";
import { mockBackend } from "./services/mockBackend";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 30, stiffness: 200 } }
};

const styleItems = [
  { key: "storytelling", title: "Сторителлинг", desc: "История с аркой" },
  { key: "provocative", title: "Провокация", desc: "Дерзко и хайпово" },
  { key: "educational", title: "Обучение", desc: "Польза и факты" },
  { key: "entertaining", title: "Развлечение", desc: "Юмор и динамика" },
];

const directionItems = [
  { key: "sale", title: "Продажи", desc: "Фокус на оффере" },
  { key: "expertise", title: "Экспертность", desc: "Личный бренд" },
  { key: "ads", title: "Реклама", desc: "Нативная подача" },
  { key: "engagement", title: "Вовлечение", desc: "Шеринг" },
];

const platformItems = [
  { key: "youtube", title: "YouTube", desc: "16:9" },
  { key: "reels", title: "Reels / TikTok", desc: "9:16" },
  { key: "shorts", title: "Shorts", desc: "Shorts" }
];

function HomePage() {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [style, setStyle] = useState<any>("storytelling");
  const [direction, setDirection] = useState<any>("expertise");
  const [platform, setPlatform] = useState<any>("youtube");
  const [durationSec, setDurationSec] = useState(180);

  const [limits, setLimits] = useState<Limits | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<GenerateResult | null>(null);
  
  const [isListening, setIsListening] = useState(false);
  const [showBrainstorm, setShowBrainstorm] = useState(false);
  const [apiKeySelected, setApiKeySelected] = useState<boolean | null>(null);
  const recognitionRef = useRef<any>(null);

  const navigate = useNavigate();

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

    setLimits(mockBackend.getUserStatus());
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

    if (!mockBackend.consumeCredit()) {
      setLoading(false);
      return setError("Дневной лимит исчерпан. Перейдите на PRO.");
    }

    try {
      const result = await generateScenario({
        input: { text, attachments },
        options: { style, direction, durationSec, platform, ctaStrength: "soft" },
      });
      setCurrentResult(result);
      setLimits(mockBackend.getUserStatus());
      setTimeout(() => {
        document.getElementById('result-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (e: any) {
      const msg = e.message || "Ошибка ИИ";
      if (msg.includes("Requested entity was not found.")) {
        setApiKeySelected(false);
      }
      setError(msg.includes("API key") ? "Ошибка: Проверьте API_KEY или выберите его заново." : msg);
    } finally {
      setLoading(false);
    }
  }

  if (apiKeySelected === false) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-zinc-100">
        <div className="glass-card p-12 md:p-16 rounded-[3rem] text-center max-w-xl w-full">
          <div className="relative z-10">
            <div className="w-20 h-20 bg-purple-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-purple-500/20 text-purple-500">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778z"/><path d="M12 12l.94 2.48c.18.47.63.78 1.14.78h2.34c.5 0 .93-.31 1.1-.78l.48-1.48h2.5"/><path d="M16 8l2 2"/></svg>
            </div>
            <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">API Key Required</h2>
            <p className="text-zinc-500 mb-10 font-bold uppercase tracking-[0.1em] text-xs leading-relaxed">Для работы студии требуется API ключ с включенным биллингом.</p>
            <div className="flex flex-col gap-4">
              <button onClick={handleOpenSelectKey} className="w-full py-6 bg-purple-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-purple-500 transition-all shadow-xl">Выбрать Ключ</button>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-400">Документация</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-purple-500/30">
      
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mx-auto max-w-[1440px] px-6 lg:px-12 py-10 lg:py-12">
        
        {/* Header */}
        <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-12 gap-8">
          <div className="space-y-2">
            <motion.div variants={itemVariants} className="flex items-center gap-6">
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase flex items-center gap-3">
                <span className="text-white">SCENARIST</span>
                <span className="bg-purple-600 text-white px-3 py-0.5 rounded-xl text-lg md:text-2xl not-italic -rotate-2">PRO</span>
              </h1>
              <div className="hidden sm:block w-px h-8 bg-zinc-800" />
              <AudioPlayer />
            </motion.div>
            <motion.p variants={itemVariants} className="text-zinc-500 text-[10px] md:text-xs font-black uppercase tracking-[0.4em]">
              Professional Creative Logic • <span className="text-purple-500">Gemini 3 Pro Engine</span>
            </motion.p>
          </div>
          
          <motion.div variants={itemVariants} className="flex items-center gap-4">
             <div className="px-5 py-3 rounded-2xl glass-card flex items-center gap-4">
               <div className={`w-2 h-2 rounded-full ${limits?.isPro ? 'bg-purple-500 shadow-[0_0_10px_#7C3AED]' : 'bg-zinc-700'}`} />
               <span className="text-[10px] font-black font-mono uppercase tracking-[0.2em] text-zinc-400">
                 {limits?.isPro ? "STATUS: PRO" : `QUOTA: ${limits?.remainingToday} UNITS`}
               </span>
             </div>
             {!limits?.isPro && (
               <button onClick={() => navigate('/billing/success')} className="bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">UPGRADE</button>
             )}
          </motion.div>
        </header>

        {/* Bento Grid Layout */}
        <div className="bento-grid">
          
          {/* Main Content (Results) */}
          <div className="lg:col-span-7 lg:row-span-6 order-2 lg:order-1 flex flex-col gap-6">
            <motion.div variants={itemVariants} id="result-area" className="flex-1 bento-glow">
              <ResultPanel loading={loading} error={error} result={currentResult} onCopy={() => {}} />
            </motion.div>

            {/* Thumbnails below results */}
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

          {/* Configuration Column (Sidebar in Bento) */}
          <div className="lg:col-span-5 flex flex-col gap-6 order-1 lg:order-2">
            
            {/* Input Terminal Bento Tile */}
            <motion.div variants={itemVariants} className="glass-card bento-glow rounded-[2.5rem] p-8 md:p-10 flex flex-col group min-h-[300px]">
              <div className="flex justify-between items-center mb-8">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="3"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                   </div>
                   <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-purple-500/80">Input Terminal</h2>
                 </div>
                 <div className="flex gap-2">
                   <button onClick={() => setShowBrainstorm(true)} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-all"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></button>
                   <button onClick={toggleVoiceInput} className={`p-3 rounded-xl border transition-all ${isListening ? 'bg-rose-500 border-rose-400 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'}`}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg></button>
                 </div>
              </div>

              <textarea 
                value={text} 
                onChange={(e) => setText(e.target.value)}
                placeholder="Describe your vision..."
                className="w-full flex-1 bg-transparent text-xl font-black placeholder:text-zinc-800 outline-none resize-none leading-relaxed text-zinc-100 mb-8"
              />
              
              <AnimatePresence>
                {showBrainstorm && (
                  <BrainstormChat 
                    currentInput={text} 
                    onClose={() => setShowBrainstorm(false)} 
                    onApply={(t) => {setText(p => p + "\n" + t); setShowBrainstorm(false);}} 
                  />
                )}
              </AnimatePresence>

              <div className="pt-8 border-t border-zinc-800/40">
                <Uploader onAttachmentsChange={setAttachments} hint="Context Files (PDF/Images)" />
              </div>
            </motion.div>

            {/* Duration & Actions Bento Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
              
              {/* Duration Bento Tile */}
              <motion.div variants={itemVariants} className="glass-card bento-glow rounded-[2rem] p-8 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-6">
                   <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em]">Duration</span>
                   <span className="text-3xl font-black text-purple-400 font-mono tracking-tighter">{formatMMSS(durationSec)}</span>
                </div>
                <input 
                  type="range" min={15} max={600} step={15} value={durationSec} 
                  onChange={(e) => setDurationSec(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-purple-600"
                />
              </motion.div>

              {/* Action Button Bento Tile */}
              <motion.button 
                disabled={loading} onClick={onGenerate}
                whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="glass-card bento-glow rounded-[2rem] py-10 bg-purple-600/90 text-white font-black uppercase tracking-[0.5em] shadow-[0_25px_50px_-15px_rgba(124,58,237,0.4)] disabled:opacity-40 transition-all text-[12px] relative group"
              >
                <span className="relative z-10">{loading ? "Synthesizing..." : "Initialize Engine"}</span>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
              </motion.button>
            </div>

            {/* Config Options Bento Tiles */}
            <motion.div variants={itemVariants} className="space-y-6">
              <OptionCards title="Platform" items={platformItems} value={platform} onChange={setPlatform} />
              <div className="grid grid-cols-1 gap-6">
                <OptionCards title="Narrative Style" items={styleItems} value={style} onChange={setStyle} />
                <OptionCards title="Conversion Goal" items={directionItems} value={direction} onChange={setDirection} />
              </div>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SuccessPage() {
  useEffect(() => mockBackend.subscribe(), []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 font-manrope">
       <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-16 md:p-24 rounded-[4rem] text-center max-w-2xl w-full">
          <div className="relative z-10">
            <div className="w-24 h-24 bg-purple-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-12 border border-purple-500/30">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 className="text-5xl font-black mb-8 uppercase tracking-tighter">PRO ACTIVATED</h2>
            <p className="text-zinc-500 mb-16 font-bold uppercase tracking-[0.2em] text-[11px] leading-relaxed max-w-sm mx-auto">Access to the High-Performance AI Pipeline is now fully granted.</p>
            <Link to="/" className="block w-full py-7 bg-white text-black font-black uppercase tracking-widest rounded-3xl hover:scale-105 active:scale-95 transition-all shadow-2xl">Return to Studio</Link>
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
        <Route path="/billing/success" element={<SuccessPage />} />
      </Routes>
    </Router>
  );
}
