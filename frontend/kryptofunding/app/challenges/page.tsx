"use client";

import api from "@/lib/axios";
import { Challenge } from "@/lib/types";
import { useEffect, useState } from "react";
import ChallengeCard from "@/components/app/ChallengeCard";
import { Trophy, Activity, Layers, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Page = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stepFilter, setStepFilter] = useState<"all" | 1 | 2>("all");
  const [ddFilter, setDdFilter] = useState<number | null>(null);

  const ddOptions = [6, 8, 10, 12];

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const result = await api.get("/user/challenges");
        if (result.status === 200) {
          setChallenges(result.data.challenges);
        }
      } catch (error) {
        console.error("Error fetching challenges", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChallenges();
  }, []);

  const filteredChallenges = challenges
    .filter((c) => stepFilter === "all" || (c.steps ?? 1) === stepFilter)
    .filter((c) => ddFilter === null || (c.drawdown ?? 10) === ddFilter);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#090909] flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 border-t-2 border-amber-400 rounded-full animate-spin h-16 w-16"></div>
          <Activity className="h-6 w-6 text-amber-400 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#090909] text-gray-900 dark:text-white pb-24 font-sans selection:bg-purple-500/30">
      <div className="relative overflow-hidden bg-white dark:bg-[#090909] border-b border-gray-300 dark:border-[#3b353c] pt-12 pb-16 px-6 lg:px-12">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <Badge className="mb-4 bg-purple-500 text-white hover:bg-purple-500 dark:bg-[#a855f7] text-xs font-bold tracking-widest uppercase px-3 py-1">
            <Trophy className="w-3 h-3" /> Challenges
          </Badge>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase">
            Choose Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-amber-400 dark:from-[#a855f7] dark:to-[#fbbf24]">
              Challenge
            </span>
          </h1>
          <p className="text-gray-500 dark:text-[#82717b] text-lg max-w-xl font-light mt-2">
            Pick the challenge that matches your trading style and goals.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center gap-4 mb-10 pt-12">
          <Layers className="w-5 h-5 text-gray-400" />
          {(["all", 1, 2] as const).map((val) => (
            <Button
              key={val}
              onClick={() => setStepFilter(val)}
              variant={stepFilter === val ? "default" : "outline"}
              className={`h-auto rounded-md px-5 py-2.5 text-xs font-bold uppercase tracking-widest ${stepFilter === val ? "bg-purple-500 text-white hover:bg-purple-600 dark:bg-[#a855f7] dark:hover:bg-[#c084fc]" : "border-gray-300 bg-white text-gray-500 dark:border-[#3b353c] dark:bg-transparent dark:text-[#82717b] dark:hover:border-[#a855f7]/50"}`}
            >
              {val === "all" ? "All" : `${val}-Step`}
            </Button>
          ))}
          <div className="ml-auto text-xs text-gray-400 font-mono">
            {filteredChallenges.length} challenge
            {filteredChallenges.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <Gauge className="w-5 h-5 text-gray-400" />
          <Button
            onClick={() => setDdFilter(null)}
            variant={ddFilter === null ? "default" : "outline"}
            className={`h-auto rounded-md px-5 py-2.5 text-xs font-bold uppercase tracking-widest ${ddFilter === null ? "bg-amber-400 text-black hover:bg-amber-400 dark:bg-[#fbbf24] dark:text-[#090909] dark:hover:bg-[#c1cfc1]" : "border-gray-300 bg-white text-gray-500 dark:border-[#3b353c] dark:bg-transparent dark:text-[#82717b] dark:hover:border-[#fbbf24]/50"}`}
          >
            All DD
          </Button>
          {ddOptions.map((dd) => (
            <Button
              key={dd}
              onClick={() => setDdFilter(dd)}
              variant={ddFilter === dd ? "default" : "outline"}
              className={`h-auto rounded-md px-5 py-2.5 text-xs font-bold uppercase tracking-widest ${ddFilter === dd ? "bg-amber-400 text-black hover:bg-amber-400 dark:bg-[#fbbf24] dark:text-[#090909] dark:hover:bg-[#c1cfc1]" : "border-gray-300 bg-white text-gray-500 dark:border-[#3b353c] dark:bg-transparent dark:text-[#82717b] dark:hover:border-[#fbbf24]/50"}`}
            >
              {dd}% DD
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map((x: Challenge) => (
            <ChallengeCard challenge={x} key={x.id} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
