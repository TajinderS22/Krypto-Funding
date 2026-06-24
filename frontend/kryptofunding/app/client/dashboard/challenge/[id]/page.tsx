"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Activity, TrendingUp, DollarSign, Layers,
  Shield, CheckCircle, Key, Loader2, BarChart3
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import ApiKeyModal from "@/components/app/ApiKeyModal";
import AuthPromptModal from "@/components/app/AuthPromptModal";
import type { MyChallenge } from "@/lib/types";

const Page = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [myChallenge, setMyChallenge] = useState<MyChallenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyDone, setApiKeyDone] = useState(false);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const res = await api.get("/user/challenges/my-challenges").catch((err: any) => {
          if (err?.response?.status === 401) throw err;
          return { data: { active: [], failed: [], passed: [] } };
        });
        const all: MyChallenge[] = [
          ...(res.data.active || []),
          ...(res.data.failed || []),
          ...(res.data.passed || []),
        ];
        const found = all.find(
          (mc) => mc.challenge.id === id && mc.status?.status === "active"
        );
        if (!found) {
          setError("Challenge not found or no longer active.");
        } else {
          setMyChallenge(found);
          if (!found.status?.hasApiKey) {
            setShowApiKeyModal(true);
          } else {
            setApiKeyDone(true);
          }
        }
      } catch (err: any) {
        if (err?.response?.status === 401) {
          setShowAuthModal(true);
          return;
        }
        setError("Failed to load challenge details.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChallenge();
  }, [id]);

  const handleApiKeyComplete = () => {
    setShowApiKeyModal(false);
    setApiKeyDone(true);
    // Re-fetch to update hasApiKey
    const refetch = async () => {
      try {
        const res = await api.get("/user/challenges/my-challenges");
        const all: MyChallenge[] = [
          ...(res.data.active || []),
          ...(res.data.failed || []),
          ...(res.data.passed || []),
        ];
        const found = all.find(
          (mc) => mc.challenge.id === id && mc.status?.status === "active"
        );
        if (found) setMyChallenge(found);
      } catch {}
    };
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#050304] flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 border-t-2 border-amber-500 rounded-full animate-spin h-16 w-16"></div>
          <Activity className="h-6 w-6 text-amber-500 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#050304] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-gray-400 mx-auto" />
          <h2 className="text-2xl font-black uppercase tracking-wider">{error}</h2>
          <Link
            href="/client/dashboard"
            className="inline-flex items-center gap-2 text-purple-600 dark:text-[#8254ee] font-bold hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!myChallenge) return null;

  const ch = myChallenge.challenge;
  const st = myChallenge.status;
  const currentStep = st?.currentStepStatus ?? 1;
  const totalSteps = st?.steps ?? ch.steps ?? 1;
  const stepProgress = Math.min(100, (currentStep / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#050304] text-gray-900 dark:text-white pb-24 font-sans selection:bg-purple-600/30">

      <div className="relative overflow-hidden bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/5 pt-12 pb-16 px-6 lg:px-12">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <Link
            href="/client/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-[#82717b] hover:text-gray-900 dark:hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 text-xs font-bold tracking-widest uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Active Terminal
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">
                {ch.title}
              </h1>
              <p className="text-lg text-gray-500 dark:text-[#82717b] font-light">
                ${ch.value?.toLocaleString() ?? "-"} account &middot; Step {currentStep} of {totalSteps}
              </p>
            </div>
          </div>
        </div>
      </div>

      {apiKeyDone ? (
        <div className="max-w-5xl mx-auto px-6 lg:px-12 -mt-8 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-white/5 rounded-lg p-6 text-center hover:border-purple-500/30 dark:hover:border-[#8254ee]/30 transition-colors">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-[#8254ee] mx-auto mb-3" />
                  <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1">Account Value</p>
                  <p className="text-3xl font-black">${ch.value?.toLocaleString() ?? "-"}</p>
                </div>
                <div className="bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-white/5 rounded-lg p-6 text-center hover:border-amber-500/30 dark:hover:border-[#e7c965]/30 transition-colors">
                  <DollarSign className="w-6 h-6 text-amber-500 mx-auto mb-3" />
                  <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1">Max Drawdown</p>
                  <p className="text-3xl font-black text-amber-500">{ch.drawdown ?? "-"}%</p>
                </div>
                <div className="bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-white/5 rounded-lg p-6 text-center hover:border-purple-500/30 dark:hover:border-[#8254ee]/30 transition-colors">
                  <Layers className="w-6 h-6 text-purple-600 dark:text-[#8254ee] mx-auto mb-3" />
                  <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1">Target</p>
                  <p className="text-3xl font-black">{ch.target ?? "-"}%</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-white/5 rounded-lg p-8">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Step Progress</h2>
                <div className="space-y-4">
                  {Array.from({ length: totalSteps }, (_, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                        i + 1 < currentStep
                          ? "border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/5"
                          : i + 1 === currentStep
                          ? "border-purple-300 dark:border-[#8254ee]/30 bg-purple-50 dark:bg-purple-500/5"
                          : "border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02]"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                          i + 1 <= currentStep
                            ? "bg-purple-600 text-white"
                            : "bg-gray-200 dark:bg-white/10 text-gray-400"
                        }`}
                      >
                        {i + 1 <= currentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">Step {i + 1}</p>
                        <p className="text-xs text-gray-500 dark:text-[#82717b]">
                          {i + 1 === currentStep
                            ? "In progress"
                            : i + 1 < currentStep
                            ? "Completed"
                            : "Locked"}
                        </p>
                      </div>
                      {i + 1 === currentStep && (
                        <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-[#8254ee] uppercase tracking-widest">
                          <Activity className="w-3 h-3 animate-pulse" /> Active
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-8 bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-white/5 rounded-lg p-8 shadow-sm space-y-6">
                <div className="text-center pb-6 border-b border-gray-100 dark:border-white/5">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <Key className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1">Status</p>
                  <p className="text-xl font-black text-green-500 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    API Connected
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-[#82717b]">Account Size</span>
                    <span className="font-bold">${ch.value?.toLocaleString() ?? "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-[#82717b]">Drawdown</span>
                    <span className="font-bold">{ch.drawdown ?? "-"}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-[#82717b]">Target</span>
                    <span className="font-bold">{ch.target ?? "-"}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-[#82717b]">Steps</span>
                    <span className="font-bold">{totalSteps}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-[#82717b]">Current Step</span>
                    <span className="font-bold">{currentStep}/{totalSteps}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                    <span>Overall Progress</span>
                    <span>{stepProgress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-amber-500 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.max(2, stepProgress)}%` }}
                    ></div>
                  </div>
                </div>

                <button
                  className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all duration-300 bg-gradient-to-r from-purple-600 to-amber-500 text-white hover:shadow-lg hover:shadow-purple-600/20"
                >
                  <BarChart3 className="w-4 h-4" /> Open Terminal
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ApiKeyModal
        challengeId={ch.id}
        challengeTitle={ch.title}
        purchaseId={myChallenge.purchase_id}
        isOpen={showApiKeyModal}
        onClose={() => router.push("/client/dashboard")}
        onComplete={handleApiKeyComplete}
      />

      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => router.push("/auth/signin")}
      />
    </div>
  );
};

export default Page;
