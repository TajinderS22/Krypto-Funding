"use client";

import { useState } from "react";
import { Key, X, Loader2, Eye, EyeOff, Shield } from "lucide-react";
import api from "@/lib/axios";

interface ApiKeyModalProps {
  challengeId: string;
  challengeTitle: string;
  purchaseId:number;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function ApiKeyModal({
  challengeId,
  challengeTitle,
  purchaseId,
  isOpen,
  onClose,
  onComplete,
}: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError("API Key is required");
      return;
    }
    if (!apiSecret.trim()) {
      setError("API Secret is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await api.post(`/user/api-key`, {
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
        purchaseId,
        challengeId
      });
      onComplete();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to save API key. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-white/5 rounded-lg p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-amber-600 dark:text-[#e7c965]" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tighter uppercase">
                  API Key Required
                </h2>
                <p className="text-xs text-gray-500 dark:text-[#82717b] font-medium mt-0.5">
                  {challengeTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-gray-500 dark:text-[#82717b] leading-relaxed">
            This challenge requires exchange API credentials to start trading.
            Your keys are encrypted before storage.
          </p>

          <div className="space-y-5">
            <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
              <label className="block text-xs font-black text-amber-600 dark:text-[#e7c965] uppercase tracking-widest mb-2">
                API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-transparent text-base text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-mono"
                placeholder="Enter your API key"
                disabled={isSaving}
              />
            </div>

            <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
              <label className="block text-xs font-black text-amber-600 dark:text-[#e7c965] uppercase tracking-widest mb-2">
                API Secret
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  className="w-full bg-transparent text-base text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-mono pr-10"
                  placeholder="Enter your API secret"
                  disabled={isSaving}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showSecret ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold">
              <Shield className="w-3 h-3" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-6 py-3 rounded-full font-bold uppercase tracking-widest text-xs border border-gray-300 dark:border-white/10 text-gray-700 dark:text-[#82717b] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="group relative flex-1 px-6 py-3 bg-transparent overflow-hidden rounded-full ring-2 ring-amber-500/50 dark:ring-[#e7c965]/50 text-gray-900 dark:text-white hover:text-black hover:ring-amber-500 dark:hover:ring-[#e7c965] transition-all duration-500 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <div className="absolute inset-0 w-0 bg-amber-500 dark:bg-gradient-to-r dark:from-[#e7c965] dark:to-[#b3a473] transition-all duration-300 ease-in-out group-hover:w-full rounded-r-full" />
              <span className="relative z-10 flex items-center gap-2">
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                {isSaving ? "Saving..." : "Save & Continue"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
