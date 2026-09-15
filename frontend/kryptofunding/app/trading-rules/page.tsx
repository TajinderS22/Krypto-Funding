import React from "react";
import Navbar from "@/components/structural/Navbar";
import Footer from "@/components/structural/Footer";
import { Card, CardContent } from "@/components/ui/card";

const rules = [
  {
    label: "Rule 01",
    accent: "text-amber-400 dark:text-[#fbbf24]",
    title: "Daily Drawdown",
    body: "Your daily drawdown is calculated based on the initial balance of your account at 00:00 UTC. If your floating equity drops below this daily threshold (4% for 1-Step, 5% for 2-Step), your simulation is terminated.",
  },
  {
    label: "Rule 02",
    accent: "text-amber-400 dark:text-[#fbbf24]",
    title: "Overall Drawdown",
    body: "Your overall drawdown is static, calculated from the initial starting balance of your account. You must not drop below this absolute limit at any point, including floating PnL.",
  },
  {
    label: "Rule 03",
    accent: "text-purple-500 dark:text-[#a855f7]",
    title: "News Trading",
    body: "Trading during high-impact macroeconomic news releases is permitted in our simulation environment to help you practice real-world volatility, though severe slippage may be simulated.",
  },
  {
    label: "Rule 04",
    accent: "text-purple-500 dark:text-[#a855f7]",
    title: "Weekend Holding",
    body: "You are free to hold trades over the weekend. However, be aware that crypto markets remain open, and forex/indices will simulate weekend gap risks.",
  },
];

export default function TradingRulesPage() {
  return (
    <div className="bg-white dark:bg-[#090909] font-sans text-gray-900 dark:text-[#c1cfc1] min-h-screen flex flex-col selection:bg-purple-500 dark:selection:bg-[#a855f7] selection:text-white transition-colors duration-300">
      <Navbar />
      <div className="flex-1 w-11/12 max-w-7xl mx-auto py-24 md:py-32">
        <div className="border-b border-gray-300 dark:border-[#3b353c] pb-12 mb-16">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-500 dark:from-[#fbbf24] dark:to-[#a855f7] tracking-tighter uppercase mb-6">
            Trading Rules
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-[#82717b] font-light max-w-3xl leading-relaxed">
            Our simulation platform strictly enforces standard risk management
            protocols to prepare you for actual market conditions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rules.map((rule) => (
            <Card
              key={rule.label}
              className="group rounded-md border-gray-300 py-0 hover:border-purple-500/50 dark:border-[#3b353c] dark:hover:border-[#a855f7]/50 transition-colors"
            >
              <CardContent className="p-10 md:p-16">
                <div
                  className={`${rule.accent} text-xl font-black mb-4 tracking-widest uppercase`}
                >
                  {rule.label}
                </div>
                <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tighter">
                  {rule.title}
                </h3>
                <p className="text-gray-600 dark:text-[#82717b] text-lg leading-relaxed font-light">
                  {rule.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
