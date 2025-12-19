import React from "react";
import { motion } from "framer-motion";

type Item = { key: string; title: string; desc: string };

export function OptionCards(props: {
  title: string;
  items: Item[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] font-mono">
          {props.title}
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {props.items.map((item) => {
          const isActive = props.value === item.key;
          return (
            <motion.button
              key={item.key}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => props.onChange(item.key)}
              className={`relative overflow-hidden flex flex-col items-start text-left p-4 rounded-2xl transition-all duration-300 border ${
                isActive
                  ? "bg-purple-600/10 border-purple-500 shadow-[0_0_20px_rgba(124,58,237,0.1)]"
                  : "bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700/80"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId={`${props.title}-active-glow`}
                  className="absolute inset-0 bg-purple-500/5 pointer-events-none"
                />
              )}
              <span
                className={`text-[12px] font-black uppercase tracking-tight mb-1 transition-colors ${
                  isActive ? "text-purple-400" : "text-zinc-300"
                }`}
              >
                {item.title}
              </span>
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-tight">
                {item.desc}
              </span>
              
              {isActive && (
                <div className="absolute top-3 right-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_#7C3AED]" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
