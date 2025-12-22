import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GenerateResult } from "../types";

const LOADING_STEPS = [
  "ГЛУБОКИЙ ПОИСК: ИНИЦИАЛИЗАЦИЯ ПОТОКОВ ДАННЫХ...",
  "АНАЛИЗ ОБЪЕКТА: ПОСТРОЕНИЕ СПЕЦИФИКАЦИЙ...",
  "АНАЛИЗ РЫНКА: ПОИСК ТРИГГЕРОВ УДЕРЖАНИЯ...",
  "SEO ДВИЖОК: ОПТИМИЗАЦИЯ ЗАЦЕПОК...",
  "СИНТЕЗ СЦЕНАРИЯ: СБОРКА НАРРАТИВА...",
  "ВИЗУАЛЬНЫЙ ПЛАН: ГЕНЕРАЦИЯ СПИСКА КАДРОВ..."
];

interface SectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string;
}

const CollapsibleSection: React.FC<SectionProps> = ({ title, isOpen, onToggle, children, icon, badge }) => (
  <motion.div layout className="border-b border-white/[0.03] last:border-0">
    <button onClick={onToggle} className="w-full flex flex-col sm:flex-row sm:items-center justify-between px-8 md:px-10 py-8 md:py-10 hover:bg-white/[0.02] transition-all text-left group gap-4">
      <div className="flex items-center gap-6 min-w-0">
        <div className={`p-4 rounded-[1.25rem] transition-all shadow-xl shrink-0 ${isOpen ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 inner-glow' : 'bg-zinc-900/50 text-zinc-600 border border-white/[0.03]'}`}>{icon}</div>
        <div className="flex flex-col min-w-0">
          <span className={`text-[11px] md:text-[13px] font-heading font-black uppercase tracking-[0.3em] transition-colors truncate ${isOpen ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-400'}`}>{title}</span>
          {badge && <span className="text-[8px] md:text-[9px] font-mono font-bold text-emerald-500/40 uppercase tracking-[0.4em] mt-1.5">{badge}</span>}
        </div>
      </div>
      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className={`shrink-0 ${isOpen ? 'text-emerald-500' : 'text-zinc-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
      </motion.div>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
          <div className="px-8 md:px-10 pb-12 md:pb-16 pt-0 text-zinc-300 min-w-0">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

export const ResultPanel = React.memo((props: {
  loading: boolean;
  error: string | null;
  result: GenerateResult | null;
  onCopy: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ research: true, script: true, shots: false });
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    let interval: any;
    if (props.loading) {
      interval = setInterval(() => setLoadingStep(p => (p + 1) % LOADING_STEPS.length), 3500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [props.loading]);

  const handleCopy = () => {
    if (!props.result?.scriptMarkdown) return;
    navigator.clipboard.writeText(props.result.scriptMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!props.result) return;
    const blob = new Blob([props.result.scriptMarkdown], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `сценарий-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (props.loading) {
    return (
      <div className="h-full min-h-[600px] glass-card rounded-[3.5rem] flex flex-col items-center justify-center p-12 text-center space-y-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-500/[0.01] animate-pulse" />
        <div className="relative z-10">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="w-64 h-64 md:w-80 md:h-80 border border-emerald-500/5 rounded-full flex items-center justify-center">
            <motion.div animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 6, repeat: Infinity }} className="w-48 h-48 md:w-60 md:h-60 border-2 border-dashed border-emerald-500/10 rounded-full" />
          </motion.div>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
             <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping mb-6" />
             <span className="text-emerald-500/30 font-mono text-[10px] font-black uppercase tracking-[0.6em]">ОБРАБОТКА</span>
          </div>
        </div>
        <div className="space-y-8 w-full max-w-sm z-10">
          <h3 className="text-xl md:text-2xl font-heading font-black uppercase tracking-[0.4em] text-white">СИНТЕЗ СТУДИИ</h3>
          <div className="h-12 overflow-hidden px-4">
            <AnimatePresence mode="wait">
              <motion.p key={loadingStep} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="text-emerald-500/50 text-[10px] md:text-[11px] font-mono font-bold uppercase tracking-[0.3em] leading-tight">{LOADING_STEPS[loadingStep]}</motion.p>
            </AnimatePresence>
          </div>
          <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
             <motion.div initial={{ width: "0%" }} animate={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }} className="h-full bg-emerald-500 shadow-[0_0_20px_#10b981]" />
          </div>
        </div>
      </div>
    );
  }

  if (props.error) {
    return (
      <div className="glass-card rounded-[3rem] p-16 text-center border-rose-500/20">
        <div className="w-20 h-20 bg-rose-500/5 rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-rose-500 border border-rose-500/10">
           <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <p className="text-rose-200/50 text-[11px] font-mono font-black uppercase tracking-[0.3em]">{props.error}</p>
        <button onClick={() => window.location.reload()} className="mt-10 text-[9px] font-heading font-black uppercase tracking-[0.4em] text-zinc-600 hover:text-white transition-all underline underline-offset-[12px]">Перезагрузить</button>
      </div>
    );
  }

  if (!props.result) {
    return (
      <div className="h-full min-h-[600px] glass-card rounded-[3.5rem] flex flex-col items-center justify-center p-16 opacity-30 text-zinc-800 text-center grayscale border-white/[0.02]">
         <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="mb-12"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
         <p className="text-[11px] font-heading font-black uppercase tracking-[1.2em]">ОЖИДАНИЕ</p>
      </div>
    );
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-[3.5rem] overflow-hidden shadow-[0_60px_120px_-20px_rgba(0,0,0,0.8)] border-white/[0.04]">
      <div className="p-6 md:p-8 border-b border-white/[0.03] bg-emerald-500/[0.01] flex flex-col sm:flex-row gap-6 justify-between items-center">
         <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981]" />
            <span className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-emerald-500/60">Вывод: Высокая точность</span>
         </div>
         <div className="flex w-full sm:w-auto gap-3">
           <button onClick={handleDownload} title="Скачать текст" className="px-5 py-4 rounded-[1.25rem] bg-zinc-900 border border-white/[0.05] text-zinc-400 hover:text-white hover:border-white/[0.1] transition-all flex items-center justify-center">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/></svg>
           </button>
           <button onClick={handleCopy} className={`flex-1 sm:flex-none px-10 py-4 rounded-[1.25rem] text-[10px] font-heading font-black uppercase tracking-[0.4em] transition-all shadow-2xl ${copied ? 'bg-emerald-500 text-black' : 'bg-white text-black hover:scale-105 active:scale-95'}`}>
             {copied ? "Скопировано" : "Копировать"}
           </button>
         </div>
      </div>

      <CollapsibleSection title="Анализ и факты" isOpen={openSections.research} onToggle={() => setOpenSections(p => ({...p, research: !p.research}))} badge="ДАННЫЕ ПРОВЕРЕНЫ" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}>
        <div className="p-8 md:p-10 rounded-[2.5rem] bg-black/40 border border-emerald-500/10 space-y-8 font-mono inner-glow">
           <p className="text-zinc-100 text-[15px] md:text-[17px] leading-relaxed font-bold opacity-90">{props.result?.extractedText}</p>
           {props.result?.sources && props.result.sources.length > 0 && (
             <div className="pt-8 border-t border-white/[0.03]">
               <div className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-5">Источники</div>
               <div className="flex flex-wrap gap-3">
                 {props.result.sources.map((s, i) => (
                   <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-zinc-900/50 border border-white/[0.03] text-[9px] font-bold text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all uppercase tracking-widest truncate max-w-[200px]">
                     {s.title}
                   </a>
                 ))}
               </div>
             </div>
           )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Текст сценария" isOpen={openSections.script} onToggle={() => setOpenSections(p => ({...p, script: !p.script}))} badge="БЕЗ РАЗМЕТКИ" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}>
        <div className="space-y-6 md:space-y-8 min-w-0">
           {props.result?.scriptMarkdown?.split('\n').map((line, i) => {
             if (!line.trim()) return null;
             const isLikelyHeader = line.length < 50 && (line.includes(':') || line === line.toUpperCase());
             return (
               <p key={i} className={`${isLikelyHeader ? 'text-emerald-400 font-heading font-black mt-10 first:mt-2 mb-6 border-l-[4px] border-emerald-500 pl-6 text-base md:text-xl lg:text-2xl uppercase tracking-tighter' : 'text-zinc-200 font-medium text-[16px] md:text-[18px] leading-[1.6] opacity-95'}`}>
                 {line}
               </p>
             );
           })}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Раскадровка" isOpen={openSections.shots} onToggle={() => setOpenSections(p => ({...p, shots: !p.shots}))} badge="ДЕТАЛЬНЫЙ ТАЙМЛАЙН" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/></svg>}>
        <div className="space-y-6 md:space-y-8 min-w-0">
          {props.result?.shots?.map((shot, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="p-8 md:p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/[0.03] flex flex-col lg:flex-row gap-8 lg:gap-12 hover:bg-zinc-900/60 transition-all group shadow-2xl inner-glow">
               <div className="lg:w-24 shrink-0 flex items-center lg:flex-col lg:items-start gap-6 lg:gap-0">
                  <div className="px-4 py-2 rounded-[1rem] bg-emerald-500 text-black font-mono font-black text-[10px] md:text-xs shadow-lg">
                    {shot.t}
                  </div>
                  <div className="flex-1 lg:flex-none w-full h-[1px] lg:w-[2px] lg:h-24 bg-zinc-800 rounded-full mt-6 group-hover:bg-emerald-500/20 transition-all" />
               </div>
               <div className="flex-1 space-y-6 min-w-0">
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-black uppercase text-zinc-600 tracking-[0.3em] block">Визуальный ряд</span>
                    <p className="text-white font-heading font-black leading-tight text-lg md:text-xl">{shot.frame}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                     <div className="p-6 rounded-[1.5rem] bg-black/40 border border-white/[0.03] space-y-3">
                        <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-[0.4em] block">Диктор / VO</span>
                        <p className="text-[14px] md:text-[16px] text-zinc-400 font-medium italic leading-[1.6]">{shot.voiceOver}</p>
                     </div>
                     <div className="p-6 rounded-[1.5rem] bg-emerald-500/[0.02] border border-emerald-500/10 space-y-3">
                        <span className="text-[8px] font-mono font-black text-emerald-500/40 uppercase tracking-[0.4em] block">Монтаж / Эффекты</span>
                        <p className="text-[14px] md:text-[16px] text-emerald-100 font-black uppercase tracking-tight leading-tight">{shot.onScreenText || shot.broll}</p>
                     </div>
                  </div>
               </div>
            </motion.div>
          ))}
        </div>
      </CollapsibleSection>
    </motion.div>
  );
});