"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus, Shield } from "lucide-react";

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function AuthPromptModal({ isOpen, onClose }: AuthPromptModalProps) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-white/5 rounded-lg p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-purple-600 dark:text-[#8254ee]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tighter uppercase">
              Authentication Required
            </h2>
            <p className="text-gray-500 dark:text-[#82717b] text-sm">
              You need to sign in or create an account to access this feature.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/auth/signin")}
              className="group relative w-full px-8 py-4 bg-transparent overflow-hidden rounded-full ring-2 ring-purple-600/50 dark:ring-[#8254ee]/50 text-gray-900 dark:text-white hover:text-white dark:hover:text-black hover:ring-purple-600 dark:hover:ring-[#8254ee] transition-all duration-500 flex items-center justify-center gap-3"
            >
              <div className="absolute inset-0 w-0 bg-purple-600 dark:bg-gradient-to-r dark:from-[#8254ee] dark:to-[#966bfe] transition-all duration-300 ease-in-out group-hover:w-full rounded-r-full" />
              <LogIn className="w-4 h-4 relative z-10" />
              <span className="relative z-10 font-bold uppercase tracking-widest text-sm">
                Sign In
              </span>
            </button>

            <button
              onClick={() => router.push("/auth/signup")}
              className="group relative w-full px-8 py-4 bg-transparent overflow-hidden rounded-full ring-2 ring-amber-500/50 dark:ring-[#e7c965]/50 text-gray-900 dark:text-white hover:text-black hover:ring-amber-500 dark:hover:ring-[#e7c965] transition-all duration-500 flex items-center justify-center gap-3"
            >
              <div className="absolute inset-0 w-0 bg-amber-500 dark:bg-gradient-to-r dark:from-[#e7c965] dark:to-[#b3a473] transition-all duration-300 ease-in-out group-hover:w-full rounded-r-full" />
              <UserPlus className="w-4 h-4 relative z-10" />
              <span className="relative z-10 font-bold uppercase tracking-widest text-sm">
                Sign Up
              </span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/5" />
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest whitespace-nowrap">
              Auto-redirect in {countdown}s
            </p>
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/5" />
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
      </div>
    </div>
  );
}
