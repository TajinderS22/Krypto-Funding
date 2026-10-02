"use client";
import React, { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

interface DBChallenge {
  id: string;
  title: string;
  value: number | null;
  price: number | null;
  steps: number | null;
  drawdown: number | null;
  target: number | null;
}

const PLAN_SIZES = [5000, 10000, 25000, 50000, 100000];

const UniquePlanSelector = () => {
  const router = useRouter();
  const [dbChallenges, setDbChallenges] = useState<DBChallenge[]>([]);
  const [size, setSize] = useState<number>(50000);
  const [isTwoStep, setIsTwoStep] = useState<boolean>(true);
  const [maxDrawdown, setMaxDrawdown] = useState<number>(10);

  const drawdowns = [6, 8, 10, 12];

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const res = await api.get("/user/challenges");
        const mapped: DBChallenge[] = (res.data.challenges || []).map(
          (c: any) => ({
            id: c.id,
            title: c.title,
            value: Number(c.value) || 0,
            price: Number(c.price) || 0,
            steps: c.steps ?? 1,
            drawdown: c.drawdown ?? null,
            target: c.target ?? null,
          }),
        );
        setDbChallenges(mapped);
      } catch {
        setDbChallenges([]);
      }
    };
    fetchChallenges();
  }, []);

  const getChallengeForConfig = (
    s: number,
    stepCount: number,
    dd: number,
  ): DBChallenge | undefined => {
    return dbChallenges.find(
      (c) =>
        Number(c.value) === s &&
        (c.steps ?? 1) === stepCount &&
        (c.drawdown ?? 10) === dd,
    );
  };

  const getSpecs = () => {
    const match = getChallengeForConfig(size, isTwoStep ? 2 : 1, maxDrawdown);
    const dailyDrawdown = maxDrawdown / 2;

    return {
      target: `${maxDrawdown}%`,
      daily: `${dailyDrawdown}%`,
      overall: `${maxDrawdown}%`,
      fee: match?.price ?? (size / 5000) * 2 - 0.01,
    };
  };

  const specs = getSpecs();

  const handleCta = () => {
    const match = getChallengeForConfig(size, isTwoStep ? 2 : 1, maxDrawdown);
    if (match) {
      router.push(`/challenges/${match.id}`);
    } else {
      router.push("/challenges");
    }
  };

  return (
    <div className="w-full py-32 bg-gray-50 dark:bg-linear-to-b dark:from-[#090909] dark:to-[#000000] relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 dark:bg-[#a855f7]/10 blur-[120px] rounded-md pointer-events-none transition-all duration-1000 ease-in-out" />

      <div className="w-11/12 max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 border-b border-gray-300 dark:border-[#3b353c] pb-8 transition-colors duration-300">
          <div>
            <h2 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-l from-amber-400 to-purple-500 dark:from-[#fbbf24] dark:to-[#a855f7] tracking-tighter uppercase mb-4 drop-shadow-sm">
              Simulator Access
            </h2>
            <p className="text-gray-600 dark:text-[#82717b] text-xl md:text-2xl font-light">
              Train with real constraints. Master your psychology risk-free.
            </p>
          </div>

          <Tabs
            defaultValue="two"
            onValueChange={(val) => setIsTwoStep(val === "two")}
            className="mt-8 md:mt-0"
          >
            <TabsList className="flex bg-white dark:bg-[#090909] p-1.5 rounded-md ring-1 ring-gray-300 dark:ring-[#3b353c] shadow-sm dark:shadow-inner dark:shadow-black h-auto transition-colors duration-300">
              <TabsTrigger
                value="one"
                className="px-8 py-3 rounded-md text-sm font-bold uppercase tracking-widest transition-all duration-300 data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-[#c1cfc1] dark:data-[state=active]:text-[#090909] data-[state=active]:shadow-md dark:data-[state=active]:shadow-[0_0_20px_rgba(193,207,193,0.4)] data-[state=active]:scale-105 text-gray-500 dark:text-[#82717b] hover:text-gray-900 dark:hover:text-[#c1cfc1] data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-[#3b353c]/50"
              >
                1-Step Sim
              </TabsTrigger>
              <TabsTrigger
                value="two"
                className="px-8 py-3 rounded-md text-sm font-bold uppercase tracking-widest transition-all duration-300 data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-[#c1cfc1] dark:data-[state=active]:text-[#090909] data-[state=active]:shadow-md dark:data-[state=active]:shadow-[0_0_20px_rgba(193,207,193,0.4)] data-[state=active]:scale-105 text-gray-500 dark:text-[#82717b] hover:text-gray-900 dark:hover:text-[#c1cfc1] data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-[#3b353c]/50"
              >
                2-Step Sim
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 mb-16">
          {PLAN_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`transition-all duration-500 ease-out flex flex-col items-center group ${
                size === s ? "scale-125 mx-4" : "scale-100 hover:scale-110"
              }`}
            >
              <span
                className={`text-4xl md:text-7xl font-bold transition-all ${
                  size === s
                    ? "text-gray-900 dark:text-[#c1cfc1] drop-shadow-md dark:drop-shadow-[0_0_25px_rgba(193,207,193,0.4)]"
                    : "text-gray-400 dark:text-[#3b353c] group-hover:text-gray-600 dark:group-hover:text-[#82717b]"
                }`}
              >
                ${s >= 1000 ? `${s / 1000}k` : s}
              </span>
              <div
                className={`h-1 rounded-md transition-all duration-500 mt-2 ${
                  size === s
                    ? "w-full bg-amber-400 dark:bg-[#fbbf24]"
                    : "w-0 group-hover:w-1/2 bg-gray-400 dark:bg-[#82717b]"
                }`}
              />
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center mb-24">
          <p className="text-gray-500 dark:text-[#82717b] uppercase tracking-widest text-sm font-bold mb-6">
            Select Max Drawdown
          </p>
          <div className="flex flex-wrap justify-center gap-4 bg-white dark:bg-[#090909] p-2 rounded-md border border-gray-200 dark:border-[#3b353c] shadow-sm transition-colors duration-300">
            {drawdowns.map((d) => (
              <button
                key={d}
                onClick={() => setMaxDrawdown(d)}
                className={`px-6 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                  maxDrawdown === d
                    ? "bg-purple-500 dark:bg-[#a855f7] text-white shadow-md dark:shadow-[0_0_15px_rgba(130,84,238,0.4)] scale-105"
                    : "text-gray-500 dark:text-[#82717b] hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#3b353c]/50"
                }`}
              >
                {d}%
              </button>
            ))}
          </div>
        </div>

        <Card className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-0 mt-12 bg-white dark:bg-[#090909]/60 backdrop-blur-2xl border border-purple-500/20 dark:border-[#a855f7]/30 rounded-md p-8 md:p-12 shadow-xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative overflow-hidden group transition-colors duration-300">
          <div className="absolute inset-0 bg-linear-to-r from-purple-500/5 to-amber-400/5 dark:from-[#a855f7]/5 dark:to-[#fbbf24]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="md:border-r border-gray-200 dark:border-[#3b353c] px-6 text-center relative z-10 transition-transform hover:-translate-y-1">
            <p className="text-gray-500 dark:text-[#82717b] uppercase tracking-widest text-xs mb-3 font-semibold">
              Profit Target
            </p>
            <p className="text-amber-400 dark:text-[#fbbf24] font-black text-3xl md:text-4xl">
              {specs.target}
            </p>
          </div>
          <div className="md:border-r border-gray-200 dark:border-[#3b353c] px-6 text-center relative z-10 transition-transform hover:-translate-y-1">
            <p className="text-gray-500 dark:text-[#82717b] uppercase tracking-widest text-xs mb-3 font-semibold">
              Max Daily Loss
            </p>
            <p className="text-purple-500 dark:text-[#a855f7] font-black text-4xl">
              {specs.daily}
            </p>
          </div>
          <div className="md:border-r border-gray-200 dark:border-[#3b353c] px-6 text-center relative z-10 transition-transform hover:-translate-y-1">
            <p className="text-gray-500 dark:text-[#82717b] uppercase tracking-widest text-xs mb-3 font-semibold">
              Max Overall Loss
            </p>
            <p className="text-purple-500 dark:text-[#a855f7] font-black text-4xl">
              {specs.overall}
            </p>
          </div>
          <div className="px-6 text-center flex flex-col justify-center items-center relative z-10 transition-transform hover:-translate-y-1">
            <p className="text-gray-500 dark:text-[#82717b] uppercase tracking-widest text-xs mb-3 font-semibold">
              Practice Fee
            </p>
            <p className="text-gray-900 dark:text-[#c1cfc1] font-black text-5xl tracking-tighter drop-shadow-sm dark:drop-shadow-md">
              ${specs.fee}
            </p>
          </div>
        </Card>

        <div className="mt-20 flex justify-center">
          <button
            onClick={handleCta}
            className="group relative px-16 py-6 bg-gray-900 dark:bg-transparent overflow-hidden rounded-md ring-2 ring-gray-900 dark:ring-[#a855f7]/50 text-white hover:ring-amber-400 dark:hover:ring-[#fbbf24] transition-all duration-500 shadow-xl dark:shadow-[0_0_40px_rgba(130,84,238,0.2)] dark:hover:shadow-[0_0_60px_rgba(231,201,101,0.3)] dark:hover:text-black"
          >
            <div className="absolute inset-0 w-0 bg-amber-400 dark:bg-gradient-to-r dark:from-[#a855f7] dark:to-[#fbbf24] transition-all duration-300 ease-in-out group-hover:w-full rounded-r-full" />
            <span className="relative font-black tracking-[0.2em] uppercase transition-colors duration-300 flex items-center gap-4">
              <span>Begin Practice</span>{" "}
              <span className="text-xl group-hover:translate-x-2 transition-transform">
                →
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UniquePlanSelector;
