import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Attachment } from "../types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = [
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  'application/rtf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/csv',
  'text/csv'
];

interface FileStatus {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  errorMessage?: string;
  result?: Attachment;
  previewUrl?: string;
}

interface UploaderProps {
  onAttachmentsChange: (files: Attachment[]) => void;
  maxFiles?: number;
  hint?: string;
}

const TYPE_COLORS = {
  image: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  pdf: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  text: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  doc: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  other: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20"
};

export const Uploader: React.FC<UploaderProps> = React.memo((props) => {
  const { onAttachmentsChange, maxFiles = 5, hint } = props;
  const ref = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const lastEmittedRef = useRef<string>("");

  useEffect(() => {
    const validAttachments = files
      .filter((f) => f.status === "success" && f.result)
      .map((f) => f.result!);

    const signature = JSON.stringify(validAttachments.map(v => v.name + v.dataBase64.length));

    if (signature !== lastEmittedRef.current) {
      lastEmittedRef.current = signature;
      onAttachmentsChange(validAttachments);
    }
  }, [files, onAttachmentsChange]);

  const updateFile = useCallback((id: string, data: Partial<FileStatus>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...data } : f)));
  }, []);

  const processFile = async (file: File, id: string) => {
    updateFile(id, { status: "uploading", progress: 0 });

    // MIME Type Validation
    const isImage = file.type.startsWith('image/');
    const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.type);

    if (!isImage && !isAllowedMime) {
      updateFile(id, { status: "error", errorMessage: "Неподдерживаемый формат" });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      updateFile(id, { status: "error", errorMessage: "Превышен лимит 10МБ" });
      return;
    }

    try {
      let previewUrl = undefined;
      if (isImage) {
        previewUrl = URL.createObjectURL(file);
      }

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            updateFile(id, { progress: Math.round((e.loaded / e.total) * 100) });
          }
        };
        reader.onload = () => {
          const res = String(reader.result || "");
          const idx = res.indexOf("base64,");
          resolve(idx >= 0 ? res.slice(idx + 7) : "");
        };
        reader.onerror = () => reject(new Error("Ошибка чтения"));
        reader.readAsDataURL(file);
      });

      updateFile(id, {
        status: "success",
        progress: 100,
        previewUrl,
        result: {
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          dataBase64: base64,
        },
      });
    } catch (e) {
      updateFile(id, { status: "error", errorMessage: "Сбой загрузки" });
    }
  };

  const handleFiles = useCallback((incomingFiles: File[]) => {
    setFiles((prev) => {
      const remainingSlots = maxFiles - prev.length;
      if (remainingSlots <= 0) return prev;

      const newFilesRaw = incomingFiles.slice(0, remainingSlots);
      const newFileEntries: FileStatus[] = newFilesRaw.map((f) => ({
        id: Math.random().toString(36).substring(7),
        file: f,
        progress: 0,
        status: "pending",
      }));

      newFileEntries.forEach((entry) => processFile(entry.file, entry.id));
      return [...prev, ...newFileEntries];
    });
    
    if (ref.current) ref.current.value = "";
  }, [maxFiles]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find(f => f.id === id);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const getFormatDetails = (mime: string, name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (mime.includes("pdf")) return { label: "PDF", style: TYPE_COLORS.pdf };
    if (mime.includes("image")) return { label: "IMG", style: TYPE_COLORS.image };
    if (mime.includes("text") || ext === 'txt') return { label: "TXT", style: TYPE_COLORS.text };
    if (['doc', 'docx', 'rtf', 'odt'].includes(ext || '')) return { label: "DOC", style: TYPE_COLORS.doc };
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return { label: "XLS", style: TYPE_COLORS.doc };
    return { label: ext?.toUpperCase() || "FILE", style: TYPE_COLORS.other };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] font-mono">
          Файлы ({files.length}/{maxFiles})
        </label>
        {files.length > 0 && (
           <button 
             onClick={() => {
               files.forEach(f => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
               setFiles([]);
             }}
             className="text-[9px] font-bold text-zinc-700 hover:text-rose-400 uppercase transition-colors"
           >
             Очистить
           </button>
        )}
      </div>

      {files.length < maxFiles && (
        <motion.div 
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          animate={{ 
            borderColor: isDragging ? "rgba(16, 185, 129, 0.5)" : "rgba(39, 39, 42, 0.4)",
            backgroundColor: isDragging ? "rgba(16, 185, 129, 0.05)" : "rgba(9, 9, 11, 0.2)"
          }}
          className="group relative rounded-[2rem] border-2 border-dashed p-8 transition-all cursor-pointer"
          onClick={() => ref.current?.click()}
        >
          <div className="flex flex-col items-center gap-5 text-center pointer-events-none">
            <div className={`w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-xl transition-all ${isDragging ? 'text-emerald-500 border-emerald-500 scale-110' : 'text-zinc-500 group-hover:text-emerald-500 group-hover:border-emerald-500/30'}`}>
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                 <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                 <polyline points="17 8 12 3 7 8"/>
                 <line x1="12" y1="3" x2="12" y2="15"/>
               </svg>
            </div>
            <div className="space-y-1.5">
              <div className="text-[13px] font-black text-zinc-200 uppercase tracking-tight">
                {isDragging ? "Бросайте файлы сюда" : "Добавить документы"}
              </div>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                {hint ?? "Перетащите файлы или нажмите для выбора"}
              </p>
            </div>
          </div>
          <input 
            ref={ref} 
            className="hidden" 
            type="file" 
            multiple 
            accept="image/*,text/plain,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text,application/rtf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/csv,text/csv" 
            onChange={(e) => handleFiles(Array.from(e.target.files || []))} 
          />
        </motion.div>
      )}

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {files.map((f) => {
            const { label, style } = getFormatDetails(f.file.type, f.file.name);
            return (
              <motion.div
                key={f.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className="group relative overflow-hidden rounded-[1.5rem] border border-zinc-800/40 bg-zinc-900/40 p-5 shadow-xl transition-all hover:border-zinc-700/60"
              >
                <div className="flex items-center gap-5 relative z-10">
                   {f.previewUrl ? (
                     <img src={f.previewUrl} alt={f.file.name} loading="lazy" className="shrink-0 w-12 h-12 rounded-xl object-cover border border-zinc-800" />
                   ) : (
                     <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border font-mono text-[10px] font-black ${style}`}>
                        {label}
                     </div>
                   )}
                   
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-2">
                         <span className="text-[13px] font-bold text-zinc-100 truncate">{f.file.name}</span>
                         {f.status === "uploading" && (
                           <span className="text-[10px] font-black font-mono text-emerald-400">{f.progress}%</span>
                         )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] font-bold text-zinc-600 font-mono">
                           {(f.file.size / 1024).toFixed(0)} KB
                         </span>
                         {f.status === "error" && (
                           <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{f.errorMessage}</span>
                         )}
                         {f.status === "success" && (
                           <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                              <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest">OK</span>
                           </div>
                         )}
                      </div>
                   </div>

                   <button 
                     onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                     className="shrink-0 w-9 h-9 rounded-xl bg-zinc-800/50 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/5 transition-all flex items-center justify-center border border-transparent hover:border-rose-500/20"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                   </button>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800/20">
                   {f.status === "uploading" && (
                     <motion.div 
                       role="progressbar"
                       aria-valuemin={0}
                       aria-valuemax={100}
                       aria-valuenow={f.progress}
                       className="h-full bg-emerald-500"
                       initial={{ width: 0 }}
                       animate={{ width: `${f.progress}%` }}
                     />
                   )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
});