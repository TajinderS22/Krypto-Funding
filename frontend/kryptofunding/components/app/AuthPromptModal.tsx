"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function AuthPromptModal({
  isOpen,
  onClose,
}: AuthPromptModalProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/auth/signup");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, router]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && onClose) onClose();
      }}
    >
      <DialogContent
        className="border-gray-300 dark:border-[#3b353c] bg-white dark:bg-[#090909] p-0 sm:max-w-md"
        showCloseButton={false}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 p-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-md bg-purple-100 dark:bg-[#a855f7]/10 border border-purple-200 dark:border-[#a855f7]/20 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-purple-500 dark:text-[#a855f7]" />
          </div>

          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
              Authentication Required
            </DialogTitle>
            <p className="text-sm text-gray-500 dark:text-[#82717b] font-medium mt-2">
              You need to sign in or create an account to access this feature.
            </p>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push("/auth/signin")}
              className="h-auto w-full rounded-md bg-purple-500 px-8 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-purple-600 dark:bg-[#a855f7] dark:hover:bg-[#c084fc]"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </Button>

            <Button
              onClick={() => router.push("/auth/signup")}
              className="h-auto w-full rounded-md bg-amber-400 px-8 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-gray-900 dark:bg-[#fbbf24] dark:text-[#090909] dark:hover:bg-[#c1cfc1]"
            >
              <UserPlus className="w-4 h-4" /> Sign Up
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className="flex-1 h-px bg-gray-200 dark:bg-[#3b353c]" />
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest whitespace-nowrap">
              Auto-redirect in {countdown}s
            </p>
            <div className="flex-1 h-px bg-gray-200 dark:bg-[#3b353c]" />
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-xs font-bold text-gray-500 dark:text-[#82717b] hover:text-gray-900 dark:hover:text-white transition-colors uppercase tracking-widest"
            >
              Cancel
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
