"use client";

import React from "react";
import Navbar from "@/components/structural/Navbar";
import Footer from "@/components/structural/Footer";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQPage() {
  const faqs = [
    {
      q: "Is Krypto Funding a real prop firm?",
      a: "Krypto Funding operates strictly as an educational and simulation platform. We provide realistic trading environments to help traders train their psychology and risk management. We do not provide real capital for trading.",
    },
    {
      q: "What instruments can I trade?",
      a: "Our simulator supports over 100+ simulated instruments including major and minor Forex pairs, Crypto assets (BTC, ETH, etc.), major Indices, and Commodities.",
    },
    {
      q: "How does the Practice Fee work?",
      a: "The Practice Fee covers server costs, platform access, and data feeds for your simulated environment. It is non-refundable as it grants immediate access to our proprietary training tools.",
    },
    {
      q: "Are there any hidden rules?",
      a: "No. What you see on the Rules page is exactly how our automated system operates. We pride ourselves on transparency.",
    },
    {
      q: "How do I connect my Bybit API for a demo account?",
      a: "Connecting your Bybit API for a demo account is simple. You can find a complete step-by-step guide on our Bybit API Connection Guide.",
    },
  ];

  return (
    <div className="bg-white dark:bg-[#090909] font-sans text-gray-900 dark:text-[#c1cfc1] min-h-screen flex flex-col selection:bg-purple-500 dark:selection:bg-[#a855f7] selection:text-white transition-colors duration-300">
      <Navbar />
      <div className="flex-1 w-11/12 max-w-7xl mx-auto py-24 md:py-32">
        <div className="mb-20 md:mb-32 border-b border-gray-300 dark:border-[#3b353c] pb-8">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-500 dark:from-[#fbbf24] dark:to-[#a855f7] tracking-tighter uppercase mb-4">
            FAQ
          </h1>
          <p className="text-gray-600 dark:text-[#82717b] text-xl md:text-2xl font-light">
            Answers to your most common questions.
          </p>
        </div>

        <Accordion
          type="single"
          collapsible
          className="border-t border-gray-300 dark:border-[#3b353c]"
        >
          {faqs.map((faq, idx) => (
            <AccordionItem
              key={idx}
              value={`item-${idx}`}
              className="border-gray-300 dark:border-[#3b353c]"
            >
              <AccordionTrigger className="py-6 px-4 text-lg md:text-xl font-black uppercase tracking-tighter hover:no-underline">
                <div className="flex items-center gap-4">
                  <span className="text-purple-500 dark:text-[#a855f7] opacity-50 shrink-0">
                    0{idx + 1}
                  </span>
                  <span>{faq.q}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-6 text-gray-600 dark:text-[#82717b] leading-relaxed text-lg max-w-4xl pl-[calc(3rem+16px)]">
                {faq.a ===
                "Connecting your Bybit API for a demo account is simple. You can find a complete step-by-step guide on our Bybit API Connection Guide." ? (
                  <>
                    Connecting your Bybit API for a demo account is simple. You
                    can find a complete step-by-step guide on our{" "}
                    <Link
                      href="/connect-bybit"
                      className="text-purple-500 dark:text-[#a855f7] hover:text-amber-400 dark:hover:text-[#fbbf24] underline transition-colors"
                    >
                      Bybit API Connection Guide
                    </Link>
                    .
                  </>
                ) : (
                  faq.a
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <Footer />
    </div>
  );
}
