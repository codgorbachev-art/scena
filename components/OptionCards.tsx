import React from "react";
import { motion } from "framer-motion";

type Item = { 
  key: string; 
  title: string; 
  desc: string; 
  icon?: React.ReactNode 
};

interface OptionCardsProps {
  title: string;
  items: Item[];
  value: string;
  onChange: (v: string) => void;
}

export const OptionCards = React.memo((props: OptionCardsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <label className="text-[9px] font-mono font-black text-zinc-600 uppercase tracking-[0.5em]">
          {props.title}
        </label>
      </div>
      <div className="grid grid-cols-2 gap-4" role="radiogroup" aria-label={props.title}>
        {props.items.map((item) => {
          const isActive = props.value === item.key;
          return (
            <motion.button
              key={item.key}
              role="radio"
              aria-checked={isActive}
              tabIndex={0}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => props.onChange(item.key)}
              className={`relative overflow-hidden flex flex-col items-start text-left p-5 rounded-[1.75rem] transition-all duration-500 border outline-none ${
                isActive
                  ? "bg-emerald-500/[0.08] border-emerald-500/40 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]"
                  : "bg-zinc-900/40 border-white/[0.03] hover:border-white/[0.1] hover:bg-zinc-900/60"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId={`${props.title}-active-dot`}
                  className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"
                />
              )}
              
              <div className="flex items-center gap-3 mb-3 w-full">
                {item.icon && (
                  <div className={`shrink-0 transition-colors ${isActive ? "text-emerald-400" : "text-zinc-600"}`}>
                    {item.icon}
                  </div>
                )}
                <span
                  className={`text-[12px] font-heading font-black uppercase tracking-tight transition-colors ${
                    isActive ? "text-white" : "text-zinc-400"
                  }`}
                >
                  {item.title}
                </span>
              </div>
              
              <span className={`text-[10px] font-bold uppercase tracking-widest leading-none ${isActive ? 'text-emerald-500/60' : 'text-zinc-600'}`}>
                {item.desc}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});