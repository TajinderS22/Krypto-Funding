"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CircleDollarSign,
  Loader2,
  ShieldCheck,
  Target,
  TrendingDown,
} from "lucide-react";
import api from "@/lib/axios";
import AuthPromptModal from "@/components/app/AuthPromptModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Challenge } from "@/lib/types";

const money = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);

export default function ChallengeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buySuccess, setBuySuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/user/challenges");
        const found = response.data.challenges.find(
          (item: Challenge) => item.id === id,
        );
        if (found) setChallenge(found);
        else setError("Challenge not found");
      } catch {
        setError("We couldn't load this challenge.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleBuy = async () => {
    setIsBuying(true);
    setError(null);
    try {
      await api.post("/user/challenges/buy", { challengeId: id });
      setBuySuccess(true);
      setTimeout(() => router.push("/client/dashboard"), 1500);
    } catch (requestError) {
      const axiosError = requestError as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (axiosError.response?.status === 401) setShowAuthModal(true);
      else
        setError(
          axiosError.response?.data?.message ||
            "Unable to purchase this challenge. Please try again.",
        );
    } finally {
      setIsBuying(false);
    }
  };

  if (isLoading)
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-amber-400 dark:text-[#fbbf24]" />
      </div>
    );
  if (!challenge)
    return (
      <div className="grid min-h-[70vh] place-items-center px-6 text-center">
        <div>
          <p className="text-lg font-bold uppercase tracking-widest">{error}</p>
          <Button
            asChild
            variant="link"
            className="mt-2 text-purple-500 dark:text-[#a855f7]"
          >
            <Link href="/challenges">
              <ArrowLeft />
              All challenges
            </Link>
          </Button>
        </div>
      </div>
    );
  if (buySuccess)
    return (
      <div className="grid min-h-[70vh] place-items-center px-6 text-center">
        <div>
          <Check className="mx-auto size-14 rounded-full bg-amber-400/10 p-3 text-amber-400 dark:bg-[#fbbf24]/10 dark:text-[#fbbf24]" />
          <h1 className="mt-5 text-2xl font-black uppercase tracking-tighter">
            You're in.
          </h1>
          <p className="mt-2 text-gray-500 dark:text-[#82717b]">
            Taking you to your challenge dashboard…
          </p>
        </div>
      </div>
    );

  const features = [
    {
      label: "Starting balance",
      value: money(challenge.value),
      icon: CircleDollarSign,
    },
    {
      label: "Profit target",
      value: `${challenge.target ?? "—"}%`,
      icon: Target,
    },
    {
      label: "Maximum drawdown",
      value: `${challenge.drawdown ?? "—"}%`,
      icon: TrendingDown,
    },
  ];

  const featureTones = [
    "border-purple-200 bg-purple-50/60 dark:border-[#a855f7]/20 dark:bg-[#a855f7]/10",
    "border-amber-200 bg-amber-50/60 dark:border-[#fbbf24]/20 dark:bg-[#fbbf24]/10",
    "border-gray-300 bg-gray-50 dark:border-[#3b353c] dark:bg-[#0c0c0c]",
  ];
  const featureIconTones = [
    "text-purple-500 dark:text-[#a855f7]",
    "text-amber-400 dark:text-[#fbbf24]",
    "text-gray-900 dark:text-[#c1cfc1]",
  ];

  return (
    <main className="min-h-screen bg-white pb-12 dark:bg-[#090909]">
      <div className="border-b border-gray-300 dark:border-[#3b353c]">
        <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 text-purple-500 hover:text-purple-600 dark:text-[#a855f7]"
          >
            <Link href="/challenges">
              <ArrowLeft />
              All challenges
            </Link>
          </Button>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div>
            <Badge className="mb-5 bg-purple-500 text-white hover:bg-purple-500 dark:bg-[#a855f7]">
              {challenge.steps ?? 1}-Step Evaluation
            </Badge>
            <h1 className="max-w-3xl text-4xl font-black uppercase tracking-tighter sm:text-5xl">
              {challenge.title}
            </h1>
            <p className="mt-5 max-w-2xl border-l-4 border-amber-400 pl-6 text-lg leading-8 text-gray-600 dark:border-[#fbbf24] dark:text-[#82717b]">
              {challenge.description ||
                "A clear, focused evaluation designed to help you demonstrate consistent trading."}
            </p>

            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {features.map(({ label, value, icon: Icon }, index) => (
                <Card
                  key={label}
                  className={`gap-0 rounded-md py-0 shadow-none ${featureTones[index]}`}
                >
                  <CardContent className="p-5">
                    <Icon
                      className={`mb-5 size-4 ${featureIconTones[index]}`}
                    />
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-[#82717b]">
                      {label}
                    </p>
                    <p className="mt-1 text-xl font-black">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mt-8 rounded-md border-gray-300 py-0 shadow-sm dark:border-[#3b353c]">
              <CardHeader className="border-b border-gray-300 py-5 dark:border-[#3b353c]">
                <CardTitle className="font-bold uppercase tracking-widest">
                  What this evaluation includes
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
                {[
                  "Trade on your own schedule",
                  "Track each stage from one dashboard",
                  "Connect your exchange securely",
                  "Clear targets and risk limits",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm">
                    <Check className="size-5 shrink-0 rounded-full bg-purple-500/10 p-1 text-purple-500 dark:bg-[#a855f7]/10 dark:text-[#a855f7]" />
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="sticky top-6 rounded-md border-purple-300 py-0 shadow-lg dark:border-[#a855f7]/30">
            <CardHeader className="border-b border-gray-300 py-5 dark:border-[#3b353c]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-[#82717b]">
                    Evaluation fee
                  </p>
                  <CardTitle className="mt-1 text-4xl font-black text-purple-500 dark:text-[#a855f7]">
                    {money(challenge.price)}
                  </CardTitle>
                </div>
                <BadgeCheck className="size-8 rounded-full bg-purple-100 p-1.5 text-purple-500 dark:bg-[#a855f7]/15 dark:text-[#a855f7]" />
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-5">
              <div className="space-y-3">
                {[
                  ["Account size", money(challenge.value)],
                  ["Evaluation stages", `${challenge.steps ?? 1}`],
                  ["Profit target", `${challenge.target ?? "—"}%`],
                  ["Max drawdown", `${challenge.drawdown ?? "—"}%`],
                ].map(([label, value]) => (
                  <div
                    className="flex items-center justify-between text-sm"
                    key={label}
                  >
                    <span className="text-gray-500 dark:text-[#82717b]">
                      {label}
                    </span>
                    <span className="font-bold">{value}</span>
                  </div>
                ))}
              </div>
              <Button
                className="h-auto w-full rounded-md bg-amber-400 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-gray-900 dark:bg-[#fbbf24] dark:text-[#090909] dark:hover:bg-[#c1cfc1]"
                onClick={handleBuy}
                disabled={isBuying}
              >
                {isBuying ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Processing
                  </>
                ) : (
                  "Start evaluation"
                )}
              </Button>
              {error && (
                <p className="text-center text-xs text-destructive">{error}</p>
              )}
              <div className="flex gap-2 border-t border-gray-300 pt-4 text-xs leading-5 text-gray-500 dark:border-[#3b353c] dark:text-[#82717b]">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-purple-500 dark:text-[#a855f7]" />
                Your account setup and challenge tracking are handled securely
                from your dashboard.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </main>
  );
}
