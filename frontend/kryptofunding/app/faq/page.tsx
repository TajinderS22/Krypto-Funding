import React from 'react';
import Navbar from "@/components/structural/Navbar";
import Footer from "@/components/structural/Footer";

export default function FAQPage() {
  const faqs = [
    {
      q: "Is Krypto Funding a real prop firm?",
      a: "Krypto Funding operates strictly as an educational and simulation platform. We provide realistic trading environments to help traders train their psychology and risk management. We do not provide real capital for trading."
    },
    {
      q: "What instruments can I trade?",
      a: "Our simulator supports over 100+ simulated instruments including major and minor Forex pairs, Crypto assets (BTC, ETH, etc.), major Indices, and Commodities."
    },
    {
      q: "How does the Practice Fee work?",
      a: "The Practice Fee covers server costs, platform access, and data feeds for your simulated environment. It is non-refundable as it grants immediate access to our proprietary training tools."
    },
    {
      q: "Are there any hidden rules?",
      a: "No. What you see on the Rules page is exactly how our automated system operates. We pride ourselves on transparency."
    },
    {
      q: "How do I connect my Bybit API for a demo account?",
      a: (
        <>
          Connecting your Bybit API for a demo account is simple. You can find a complete step-by-step guide on our <a href="/connect-bybit" className="text-purple-600 dark:text-[#8254ee] hover:text-amber-600 dark:hover:text-[#e7c965] underline transition-colors">Bybit API Connection Guide</a>.
        </>
      )
    }
  ];

  return (
    <div className="bg-white dark:bg-[#090909] font-sans text-gray-900 dark:text-[#c1cfc1] min-h-screen flex flex-col selection:bg-purple-600 dark:selection:bg-[#8254ee] selection:text-white transition-colors duration-300">
      <Navbar />
      <div className="flex-1 w-11/12 max-w-7xl mx-auto py-24 md:py-32">
        <div className="mb-20 md:mb-32 border-b border-gray-300 dark:border-[#3b353c] pb-8">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-purple-600 dark:from-[#e7c965] dark:to-[#8254ee] tracking-tighter uppercase mb-4">
            FAQ
          </h1>
          <p className="text-gray-600 dark:text-[#82717b] text-xl md:text-2xl font-light">
            Answers to your most common questions.
          </p>
        </div>
        
        <div className="space-y-0 border-t border-gray-300 dark:border-[#3b353c]">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-8 border-b border-gray-300 dark:border-[#3b353c] flex flex-col md:flex-row gap-6 md:gap-12 hover:bg-gray-50 dark:hover:bg-[#3b353c]/5 transition-colors px-4 -mx-4">
              <div className="text-purple-600 dark:text-[#8254ee] font-black text-xl md:text-2xl shrink-0 opacity-50 w-12">0{idx + 1}</div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tighter">{faq.q}</h3>
                <p className="text-gray-600 dark:text-[#82717b] leading-relaxed text-lg max-w-4xl">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
