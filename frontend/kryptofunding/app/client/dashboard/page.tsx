"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, Activity, Shield,
  XCircle, AlertTriangle, ChevronDown, ChevronUp, LayoutGrid
} from "lucide-react";
import api from "@/lib/axios";
import AuthPromptModal from "@/components/app/AuthPromptModal";
import type { MyChallenge } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [myChallenges, setMyChallenges] = useState<{
    active: MyChallenge[];
    failed: MyChallenge[];
    passed: MyChallenge[];
  }>({ active: [], failed: [], passed: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFailed, setShowFailed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const myRes = await api.get("/user/challenges/my-challenges").catch((err: any) => {
          if (err?.response?.status === 404) {
            return { data: { active: [], failed: [], passed: [] } };
          }
          if (err?.response?.status === 401) throw err;
          return { data: { active: [], failed: [], passed: [] } };
        });
        setMyChallenges(myRes.data);
      } catch (error: any) {
        if (error?.response?.status === 401) {
          setShowAuthModal(true);
          return;
        }
        console.error("Error fetching dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeList = myChallenges.active;
  const failedList = myChallenges.failed;
  const totalActive = activeList.length;
  const totalFailed = failedList.length;

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 border-t-2 border-amber-500 rounded-full animate-spin h-16 w-16"></div>
          <Activity className="h-6 w-6 text-amber-500 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#050304] text-gray-900 dark:text-white pb-24 font-sans selection:bg-purple-600/30">

      <div className="relative overflow-hidden bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/5 pt-12 pb-16 px-6 lg:px-12">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400 text-xs font-bold tracking-widest uppercase mb-4">
              <Activity className="w-3 h-3" /> Dashboard Overview
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase text-gray-900 dark:text-white">
              Simulator <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-amber-500 dark:from-[#8254ee] dark:to-[#e7c965]">HQ</span>
            </h1>
            <p className="text-gray-500 dark:text-[#82717b] text-lg max-w-xl font-light">
              Welcome back, trader. Your performance metrics and next opportunities await.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs uppercase tracking-widest font-bold text-gray-400">Active</span>
              <span className="text-3xl font-black">{totalActive}</span>
            </div>
            <button
              onClick={() => router.push("/challenges")}
              className="px-6 py-3 bg-purple-600 text-white font-bold uppercase tracking-widest rounded-full hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm"
            >
              <LayoutGrid className="w-4 h-4" /> Browse Challenges
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 -mt-8 relative z-20 space-y-24">

        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold uppercase tracking-widest flex items-center gap-3">
              <Activity className="w-6 h-6 text-amber-500" /> Active Terminals
            </h2>
          </div>

          {totalActive > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeList.map((mc) => {
                const ch = mc.challenge;
                const st = mc.status;
                const currentStep = st?.currentStepStatus ?? 1;
                const totalSteps = st?.steps ?? ch.steps ?? 1;
                const stepProgress = Math.min(100, (currentStep / totalSteps) * 100);

                return (
                  <Link
                    key={mc.purchase_id}
                    href={`/client/dashboard/challenge/${ch.id}`}
                    className="group relative bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-white/5 rounded-lg p-6 lg:p-8 hover:border-purple-500/50 dark:hover:border-[#8254ee]/50 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-[0_0_40px_rgba(130,84,238,0.1)]"
                  >
                    <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-purple-500/5 to-amber-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

                    <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 mb-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Active
                          </div>
                          <h3 className="text-2xl font-black tracking-tight">{ch.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-[#82717b] font-mono mt-1">
                            ${ch.value?.toLocaleString() ?? "-"} account
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500 dark:text-[#82717b] font-bold uppercase tracking-widest text-xs">
                          Step {currentStep} of {totalSteps}
                        </span>
                        <span className="text-xs text-gray-400">|</span>
                        <span className="text-gray-500 dark:text-[#82717b] font-bold uppercase tracking-widest text-xs">
                          DD: {ch.drawdown ?? "-"}% | Target: {ch.target ?? "-"}%
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                          <span>Step Progress</span>
                          <span>{currentStep}/{totalSteps}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-amber-500 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.max(2, stepProgress)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="w-full bg-white dark:bg-[#0c0c0c] border border-dashed border-gray-300 dark:border-white/10 rounded-lg p-12 text-center flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-2xl font-black mb-2">No Active Terminals</h3>
              <p className="text-gray-500 max-w-md mb-8">You haven't started any evaluations yet. Browse challenges to find the right plan and begin your trading journey.</p>
              <button onClick={() => router.push("/challenges")} className="px-8 py-3 bg-purple-600 text-white font-bold uppercase tracking-widest rounded-full hover:bg-purple-700 transition-colors">
                Browse Challenges
              </button>
            </div>
          )}
        </section>

        {totalFailed > 0 && (
          <section>
            <button
              onClick={() => setShowFailed(!showFailed)}
              className="flex items-center justify-between w-full mb-6 group"
            >
              <h2 className="text-2xl font-bold uppercase tracking-widest flex items-center gap-3">
                <XCircle className="w-6 h-6 text-red-500" /> Past Challenges
                <span className="text-sm font-mono font-bold text-gray-400">({totalFailed})</span>
              </h2>
              <div className="h-10 w-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                {showFailed ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>

            {showFailed && (
              <div className="space-y-4">
                {failedList.map((mc) => {
                  const ch = mc.challenge;
                  return (
                    <div
                      key={mc.purchase_id}
                      className="relative bg-white dark:bg-[#0c0c0c] border border-red-200 dark:border-red-500/10 rounded-lg p-6 lg:p-8 overflow-hidden"
                    >
                      <div className="absolute right-0 top-0 w-48 h-48 bg-red-500/5 rounded-full blur-3xl"></div>

                      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black tracking-tight">{ch.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-[#82717b] font-bold uppercase tracking-widest mt-1">
                              ${ch.value?.toLocaleString() ?? "-"} account &middot; DD: {ch.drawdown ?? "-"}% &middot; Target: {ch.target ?? "-"}%
                            </p>
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-widest">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                          Failed
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

      </div>

      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
