"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Challenge } from "@/lib/types";
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Layers,
  Shield,
  CheckCircle,
  Loader2,
  Activity,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import AuthPromptModal from "@/components/app/AuthPromptModal";

const Page = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buySuccess, setBuySuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const res = await api.get("/user/challenges");
        const found = res.data.challenges.find(
          (c: Challenge) => c.id === id
        );
        if (!found) {
          setError("Challenge not found");
        } else {
          setChallenge(found);
        }
      } catch {
        setError("Failed to load challenge");
      } finally {
        setIsLoading(false);
      }
    };
    fetchChallenge();
  }, [id]);

  const handleBuy = async () => {
    setIsBuying(true);
    setError(null);
    try {
      const res = await api.post("/user/challenges/buy", {
        challengeId: id,
      });
      if (res.status === 200) {
        setBuySuccess(true);
        setTimeout(() => router.push("/client/dashboard"), 1500);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setShowAuthModal(true);
        return;
      }
      const msg =
        err.response?.data?.message ||
        "Failed to purchase challenge. Please try again.";
      setError(msg);
    } finally {
      setIsBuying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#050304] flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 border-t-2 border-amber-500 rounded-full animate-spin h-16 w-16" />
          <Activity className="h-6 w-6 text-amber-500 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error && !challenge) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#050304] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-gray-400 mx-auto" />
          <h2 className="text-2xl font-black uppercase tracking-wider">
            {error}
          </h2>
          <Link
            href="/challenges"
            className="inline-flex items-center gap-2 text-purple-600 dark:text-[#8254ee] font-bold hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Challenges
          </Link>
        </div>
      </div>
    );
  }

  if (!challenge) return null;

  if (buySuccess) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#050304] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-wider">
            Challenge Purchased!
          </h2>
          <p className="text-gray-500 dark:text-[#82717b] text-lg">
            Redirecting to your dashboard...
          </p>
          <div className="flex justify-center">
            <div className="h-1.5 w-48 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-amber-500 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#050304] text-gray-900 dark:text-white pb-24 font-sans selection:bg-purple-600/30">
      <div className="relative overflow-hidden bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/5 pt-12 pb-16 px-6 lg:px-12">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <Link
            href="/challenges"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-[#82717b] hover:text-gray-900 dark:hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{" "}
            Back to Challenges
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400 text-xs font-bold tracking-widest uppercase">
                <BarChart3 className="w-3 h-3" /> Challenge Details
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">
                {challenge.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-12 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-white/5 rounded-lg p-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
                Description
              </h2>
              <p className="text-gray-600 dark:text-[#a08e96] text-lg leading-relaxed">
                {challenge.description || "No description provided."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-white/5 rounded-lg p-6 text-center hover:border-purple-500/30 dark:hover:border-[#8254ee]/30 transition-colors">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-[#8254ee] mx-auto mb-3" />
                <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1">
                  Account Value
                </p>
                <p className="text-3xl font-black">
                  ${challenge.value?.toLocaleString() ?? "-"}
                </p>
              </div>
              <div className="bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-white/5 rounded-lg p-6 text-center hover:border-amber-500/30 dark:hover:border-[#e7c965]/30 transition-colors">
                <DollarSign className="w-6 h-6 text-amber-500 mx-auto mb-3" />
                <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1">
                  Price
                </p>
                <p className="text-3xl font-black text-amber-500">
                  ${challenge.price?.toLocaleString() ?? "-"}
                </p>
              </div>
              <div className="bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-white/5 rounded-lg p-6 text-center hover:border-purple-500/30 dark:hover:border-[#8254ee]/30 transition-colors">
                <Layers className="w-6 h-6 text-purple-600 dark:text-[#8254ee] mx-auto mb-3" />
                <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1">
                  Steps
                </p>
                <p className="text-3xl font-black">
                  {challenge.steps ?? "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-white/5 rounded-lg p-8 shadow-sm space-y-6">
              <div className="text-center pb-6 border-b border-gray-100 dark:border-white/5">
                <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">
                  Price
                </p>
                <p className="text-5xl font-black text-amber-500">
                  ${challenge.price?.toLocaleString() ?? "-"}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-[#82717b]">Account Size</span>
                  <span className="font-bold">
                    ${challenge.value?.toLocaleString() ?? "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-[#82717b]">Steps</span>
                  <span className="font-bold">{challenge.steps ?? "-"}</span>
                </div>
              </div>

              <button
                onClick={handleBuy}
                disabled={isBuying}
                className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden bg-gradient-to-r from-purple-600 to-amber-500 text-white hover:shadow-lg hover:shadow-purple-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isBuying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>Buy Challenge</>
                )}
              </button>

              {error && (
                <p className="text-red-500 text-xs text-center">{error}</p>
              )}

              <p className="text-xs text-gray-400 text-center">
                By purchasing, you agree to the challenge terms and conditions.
              </p>
            </div>
          </div>
        </div>
      </div>

      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default Page;
