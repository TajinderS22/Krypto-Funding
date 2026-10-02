"use client";

import { useState } from "react";
import { Key, X, Loader2, Eye, EyeOff, Shield } from "lucide-react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiKeyModalProps {
    challengeId: string;
    challengeTitle: string;
    purchaseId: number;
    isOpen: boolean;
    stepNumber?: number;
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
    stepNumber
}: ApiKeyModalProps) {
    const [apiKey, setApiKey] = useState("");
    const [apiSecret, setApiSecret] = useState("");
    const [showSecret, setShowSecret] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                challengeId,
            });
            onComplete();
        } catch (err: unknown) {
            const axiosError = err as {
                response?: { data?: { message?: string } };
            };

            setError(
                axiosError.response?.data?.message ||
                (err instanceof Error
                    ? err.message
                    : "Failed to save API key. Please try again."),
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent
                className="border-gray-300 dark:border-[#3b353c] bg-white dark:bg-[#090909] p-0 sm:max-w-md"
                showCloseButton={false}
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 dark:bg-amber-400/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <div className="relative z-10 p-8 space-y-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-[#fbbf24]/10 border border-amber-200 dark:border-[#fbbf24]/20 flex items-center justify-center">
                                <Key className="w-5 h-5 text-amber-400 dark:text-[#fbbf24]" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black uppercase tracking-tighter">
                                    {stepNumber && stepNumber > 1 ? `Stage ${stepNumber} API Key` : "API Key Required"}
                                </DialogTitle>

                                <p className="text-xs text-gray-500 dark:text-[#82717b] font-medium mt-0.5">
                                    {challengeTitle}
                                </p>

                                <p className="text-sm text-gray-500 dark:text-[#82717b] leading-relaxed">
                                    {stepNumber && stepNumber > 1
                                        ? `Connect your new exchange account credentials to begin Stage ${stepNumber}. Your keys are encrypted before storage.`
                                        : "This challenge requires exchange API credentials to start trading. Your keys are encrypted before storage."}
                                </p>


                            </div>
                        </div>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="rounded-md">
                                <X className="w-4 h-4" />
                            </Button>
                        </DialogClose>
                    </div>

                    <div className="space-y-5">
                        <div className="flex flex-col">
                            <Label className="text-xs font-black text-amber-400 dark:text-[#fbbf24] uppercase tracking-widest mb-2">
                                API Key
                            </Label>
                            <Input
                                type="text"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-base font-mono text-gray-900 dark:text-white focus-visible:border-amber-400 focus-visible:ring-0 dark:border-[#3b353c] dark:focus-visible:border-[#fbbf24] placeholder:text-gray-400 dark:placeholder:text-[#3b353c]"
                                placeholder="Enter your API key"
                                disabled={isSaving}
                            />
                        </div>

                        <div className="flex flex-col">
                            <Label className="text-xs font-black text-amber-400 dark:text-[#fbbf24] uppercase tracking-widest mb-2">
                                API Secret
                            </Label>
                            <div className="relative">
                                <Input
                                    type={showSecret ? "text" : "password"}
                                    value={apiSecret}
                                    onChange={(e) => setApiSecret(e.target.value)}
                                    className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 pr-10 text-base font-mono text-gray-900 dark:text-white focus-visible:border-amber-400 focus-visible:ring-0 dark:border-[#3b353c] dark:focus-visible:border-[#fbbf24] placeholder:text-gray-400 dark:placeholder:text-[#3b353c]"
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
                        <DialogClose asChild>
                            <Button
                                disabled={isSaving}
                                variant="outline"
                                className="h-auto flex-1 rounded-md px-6 py-3 text-xs font-bold uppercase tracking-widest border-gray-300 dark:border-[#3b353c]"
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="h-auto flex-1 rounded-md bg-amber-400 px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-gray-900 dark:bg-[#fbbf24] dark:text-[#090909] dark:hover:bg-[#c1cfc1] disabled:opacity-50"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Key className="w-4 h-4" />
                            )}
                            {isSaving ? "Saving..." : "Save & Continue"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
