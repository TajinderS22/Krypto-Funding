import React from "react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-[#090909] border-t border-gray-300 dark:border-[#3b353c] py-12 mt-20 transition-colors duration-300">
      <div className="w-11/12 max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
        <div className="max-w-xs">
          <p className="text-3xl font-black text-amber-400 dark:text-[#fbbf24] mb-4 uppercase tracking-tighter">
            Krypto
          </p>
          <p className="text-gray-600 dark:text-[#82717b] mb-6">
            The ultimate simulator platform to train your trading mindset and
            hone your edge in a risk-free environment.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-12 md:gap-24">
          <div>
            <h3 className="text-gray-900 dark:text-white font-black uppercase tracking-widest mb-4">
              Platform
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/simulations"
                  className="text-gray-600 dark:text-[#82717b] hover:text-amber-400 dark:hover:text-[#fbbf24] transition-colors font-semibold"
                >
                  Simulations
                </Link>
              </li>
              <li>
                <Link
                  href="/trading-rules"
                  className="text-gray-600 dark:text-[#82717b] hover:text-amber-400 dark:hover:text-[#fbbf24] transition-colors font-semibold"
                >
                  Trading Rules
                </Link>
              </li>
              <li>
                <Link
                  href="/metrics-analytics"
                  className="text-gray-600 dark:text-[#82717b] hover:text-amber-400 dark:hover:text-[#fbbf24] transition-colors font-semibold"
                >
                  Metrics & Analytics
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-gray-600 dark:text-[#82717b] hover:text-amber-400 dark:hover:text-[#fbbf24] transition-colors font-semibold"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-gray-900 dark:text-white font-black uppercase tracking-widest mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-gray-600 dark:text-[#82717b] hover:text-amber-400 dark:hover:text-[#fbbf24] transition-colors font-semibold"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-600 dark:text-[#82717b] hover:text-amber-400 dark:hover:text-[#fbbf24] transition-colors font-semibold"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-600 dark:text-[#82717b] hover:text-amber-400 dark:hover:text-[#fbbf24] transition-colors font-semibold"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-600 dark:text-[#82717b] hover:text-amber-400 dark:hover:text-[#fbbf24] transition-colors font-semibold"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="w-11/12 max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-300 dark:border-[#3b353c] text-center md:text-left flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-[#82717b]">
        <p className="font-bold uppercase tracking-widest">
          &copy; {new Date().getFullYear()} Krypto Funding. All rights reserved.
        </p>
        <p className="mt-2 md:mt-0 max-w-xl text-xs md:text-right font-semibold">
          Disclaimer: Trading involves substantial risk and is not suitable for
          every investor. The evaluation programs are simulated environments for
          skill demonstration.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
