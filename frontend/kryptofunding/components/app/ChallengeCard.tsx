"use client";

import { Challenge } from "@/lib/types";
import React from "react";
import Link from "next/link";
import {
  ChevronRight,
  TrendingUp,
  DollarSign,
  Layers,
  Gauge,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ChallengeCard = ({ challenge }: { challenge: Challenge }) => {
  return (
    <div className="group relative">
      <div className="absolute -inset-[1.5px] bg-gradient-to-br from-amber-400 via-purple-500 to-amber-400 dark:from-[#fbbf24] dark:via-[#a855f7] dark:to-[#fbbf24] rounded-md opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md group-hover:blur-lg pointer-events-none" />
      <div className="absolute -inset-[1.5px] bg-gradient-to-br from-amber-400 via-purple-500 to-amber-400 dark:from-[#fbbf24] dark:via-[#a855f7] dark:to-[#fbbf24] rounded-md opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

      <Card className="relative rounded-md border-gray-300 p-0 py-0 group-hover:border-transparent transition-all duration-500 h-full shadow-sm hover:shadow-xl dark:border-[#3b353c] dark:bg-[#0c0a16] dark:hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]">
        <div className="absolute right-0 top-0 w-48 h-48 bg-gradient-to-br from-purple-500/[0.03] to-amber-400/[0.03] rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
        <CardContent className="relative z-10 flex flex-col h-full p-8">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-black text-2xl uppercase tracking-tighter text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-amber-400 dark:group-hover:from-[#a855f7] dark:group-hover:to-[#fbbf24] transition-all duration-500">
              {challenge.title}
            </h3>
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-[#a855f7]/15 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300 shrink-0">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>

          <p className="text-gray-500 dark:text-[#82717b] text-sm leading-relaxed mb-8 flex-grow line-clamp-3">
            {challenge.description}
          </p>

          <div className="space-y-3 mb-8">
            {[
              {
                label: "Price",
                icon: DollarSign,
                value: `$${challenge.price?.toLocaleString() ?? "-"}`,
                accent: "text-amber-400 dark:text-[#fbbf24]",
                bg: "bg-amber-50 dark:bg-[#fbbf24]/8 border-amber-200 dark:border-[#fbbf24]/20",
              },
              {
                label: "Value",
                icon: TrendingUp,
                value: `$${challenge.value?.toLocaleString() ?? "-"}`,
                bg: "bg-purple-50 dark:bg-[#a855f7]/8 border-purple-200 dark:border-[#a855f7]/20",
              },
              {
                label: "Drawdown",
                icon: Gauge,
                value: `${challenge.drawdown ?? "-"}%`,
                bg: "bg-gray-50 dark:bg-[#3b353c]/20 border-gray-300 dark:border-[#3b353c]",
              },
              {
                label: "Target",
                icon: Target,
                value: `${challenge.target ?? "-"}%`,
                bg: "bg-green-50 dark:bg-emerald-500/8 border-green-200 dark:border-emerald-500/20",
              },
              {
                label: "Steps",
                icon: Layers,
                value: `${challenge.steps ?? 1}-Step`,
                bg: "bg-blue-50 dark:bg-blue-500/8 border-blue-200 dark:border-blue-500/20",
              },
            ].map(({ label, icon: Icon, value, accent, bg }) => (
              <div
                key={label}
                className={`flex justify-between items-center py-3 px-4 rounded-md border ${bg}`}
              >
                <span className="text-xs uppercase tracking-widest font-bold text-gray-400 flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" /> {label}
                </span>
                <span className={`text-xl font-black ${accent || ""}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          <Button
            asChild
            className="h-auto w-full rounded-md bg-amber-400 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-gray-900 dark:bg-[#fbbf24] dark:text-[#090909] dark:hover:bg-[#c1cfc1]"
          >
            <Link href={`/challenges/${challenge.id}`}>
              Start Challenge <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChallengeCard;
