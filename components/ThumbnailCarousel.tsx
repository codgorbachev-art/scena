import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { generateThumbnailVisual } from "../services/geminiService";

interface ThumbnailCarouselProps {
  ideas: string[];
}

interface ThumbnailCardProps {
  idea: string;
  index: number;
  visual?: string;
  isLoading: boolean;
  error: string | null;
  onVisualize: () => void;
  onDownload: () => void;
}

const ThumbnailCard: React.FC<ThumbnailCardProps> = ({ 
  idea, 
  index, 
  visual, 
  isLoading, 
  error, 
  onVisualize, 
  onDownload 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 35, stiffness: 250 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const rotateX = useTransform(y, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-8, 8]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((event.clientX - (rect.left + rect.width / 2)) / rect.width);
    mouseY.set((event.clientY - (rect.top + rect.height / 2)) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, perspective: 1000, transformStyle: "preserve-3d" }}
      className="relative flex flex-col group h-full cursor-default"
    >
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#09090b]/60 border border-zinc-800/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex flex-col h-full transition-all duration-700 group-hover:border-emerald-500/40 group-hover:shadow-[0_40px_80px_-15px_rgba(16,185,129,0.15)] group-hover:-translate-y-2">
        
        <div className="aspect-video bg-[#020202] relative overflow-hidden flex items-center justify-center border-b border-zinc-900/50">
          <AnimatePresence mode="wait">
            {visual ? (
              <motion.div key="img" className="w-full h-full relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <img src={visual} className="w-full h-full object-cover select-none brightness-90 group-hover:brightness-105 transition-all duration-700" alt={`Превью: ${idea}`} loading="lazy" />
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-center items-center p-6 gap-3 backdrop-blur-md">
                    <button 
                      onClick={onDownload} 
                      className="w-full py-4 rounded-2xl bg-white text-black font-black text-[11px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.2)]"
                    >
                      Скачать HD
                    </button>
                    <button 
                      onClick={onVisualize} 
                      className="w-full py-3 rounded-2xl bg-zinc-900/80 border border-zinc-700 text-zinc-400 font-black text-[9px] uppercase tracking-[0.2em] hover:text-white hover:bg-zinc-800 transition-all"
                    >
                      Регенерация
                    </button>
                </div>
              </motion.div>
            ) : isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-10 h-10">
                   <motion.div 
                     animate={{ rotate: 360 }} 
                     transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} 
                     className="absolute inset-0 border-[3px] border-emerald-500/5 border-t-emerald-500 rounded-full" 
                   />
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                   </div>
                </div>
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.4em] font-mono animate-pulse">Rendering...</span>
              </div>
            ) : error ? (
              <button 
                onClick={onVisualize} 
                className="text-rose-400 font-black text-[10px] uppercase tracking-widest flex flex-col items-center gap-3 group/error"
              >
                 <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 group-hover/error:bg-rose-500/20 transition-all">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                 </div>
                 Ошибка
              </button>
            ) : (
              <div className="relative group/btn">
                <div className="absolute -inset-6 bg-emerald-500/10 blur-2xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                <button 
                  onClick={onVisualize} 
                  className="relative z-10 bg-white text-black px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-110 active:scale-95 transition-all"
                >
                  Визуализировать
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="p-8 md:p-10 space-y-4 bg-gradient-to-b from-transparent to-black/40 flex-1 flex flex-col">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${visual ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-800'}`} />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] font-mono">Концепт 0{index + 1}</span>
             </div>
             {visual && (
               <div className="flex items-center gap-1.5">
                 <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest font-mono">1K Ready</span>
               </div>
             )}
          </div>
          <p className="text-[14px] md:text-[16px] text-zinc-300 leading-snug font-black uppercase tracking-tight group-hover:text-white transition-colors line-clamp-3">
            {idea}
          </p>
        </div>
        
        <div className="absolute inset-0 pointer-events-none rounded-[2.5rem] border border-white/5 group-hover:border-emerald-500/20 transition-all duration-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:shadow-[inset_0_1px_2px_rgba(16,185,129,0.2)]" />
      </div>
    </motion.div>
  );
};

export const ThumbnailCarousel = React.memo(({ ideas }: ThumbnailCarouselProps) => {
  const [visuals, setVisuals] = useState<Record<number, string>>({});
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});
  const [errorStates, setErrorStates] = useState<Record<number, string | null>>({});

  const handleVisualize = async (index: number, idea: string) => {
    if (loadingStates[index]) return;
    setLoadingStates(p => ({ ...p, [index]: true }));
    setErrorStates(p => ({ ...p, [index]: null }));
    try {
      const imageUrl = await generateThumbnailVisual(idea);
      setVisuals(p => ({ ...p, [index]: imageUrl }));
    } catch (err: any) {
      setErrorStates(p => ({ ...p, [index]: "Error" }));
    } finally {
      setLoadingStates(p => ({ ...p, [index]: false }));
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-xl">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
          <div>
             <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Галерея обложек</h3>
             <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-2">Визуализация превью для максимизации CTR</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="h-px w-16 bg-zinc-800" />
           <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest font-mono">Пакет: {ideas.length} Вариаций</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 w-full">
        {ideas.map((idea, index) => (
          <ThumbnailCard 
            key={index}
            idea={idea}
            index={index}
            visual={visuals[index]}
            isLoading={loadingStates[index]}
            error={errorStates[index]}
            onVisualize={() => handleVisualize(index, idea)}
            onDownload={() => {
              if (!visuals[index]) return;
              const a = document.createElement("a");
              a.href = visuals[index];
              a.download = `concept-${index + 1}.png`;
              a.click();
            }}
          />
        ))}
      </div>
    </div>
  );
});