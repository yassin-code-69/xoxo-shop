"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon, Link as LinkIcon } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = "Banner Image",
  hint = "PNG, JPG, WEBP up to 10MB (Auto-hosted on ImgBB)",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      onChange(data.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image.";
      setError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setError(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        {label && (
          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">{label}</label>
        )}
        <button
          type="button"
          onClick={() => setShowManualInput(!showManualInput)}
          className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1 cursor-pointer"
        >
          <LinkIcon size={12} />
          {showManualInput ? "Use File Uploader" : "Paste URL manually"}
        </button>
      </div>

      {showManualInput ? (
        <div className="flex flex-col gap-1.5">
          <input
            type="url"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          <span className="text-[10px] text-slate-400 dark:text-zinc-500">
            Enter a direct image link ending in .jpg, .png or .webp
          </span>
        </div>
      ) : value ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-[#222222] bg-slate-100 dark:bg-[#171717] group aspect-[16/7] max-h-48 flex items-center justify-center">
          <img
            src={value}
            alt="Uploaded Preview"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-md transition-transform hover:scale-105 cursor-pointer flex items-center gap-1.5"
            >
              <Upload size={13} /> Change Image
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl shadow-md transition-transform hover:scale-105 cursor-pointer"
              title="Remove Image"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
            isUploading
              ? "border-purple-400 bg-purple-50/40 dark:bg-purple-950/20"
              : "border-slate-200 dark:border-[#262626] hover:border-purple-500 bg-slate-50/60 dark:bg-[#171717]/60 hover:bg-purple-50/30"
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="animate-spin text-purple-600" size={30} />
              <span className="text-xs font-black text-purple-600">Uploading image to ImgBB...</span>
              <span className="text-[10px] text-slate-400">Please wait a moment</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
                <Upload size={20} />
              </div>
              <span className="text-xs font-black text-slate-800 dark:text-zinc-200 mt-1">
                Click to upload image to ImgBB
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500">{hint}</span>
            </div>
          )}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp, image/gif"
        className="hidden"
      />

      {error && <span className="text-xs font-semibold text-red-500 mt-0.5">{error}</span>}
    </div>
  );
}
