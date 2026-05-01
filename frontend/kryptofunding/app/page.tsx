import Rings from "@/components/3D/Rings";
import Navbar from "@/components/structural/Navbar";
import Footer from "@/components/structural/Footer";
import UniquePlanSelector from "@/components/home/UniquePlanSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-white dark:bg-[#090909] font-sans text-gray-900 dark:text-[#c1cfc1] min-h-screen selection:bg-amber-500 dark:selection:bg-[#e7c965] selection:text-white dark:selection:text-[#090909] transition-colors duration-300">
      <Navbar />
      
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row min-h-[60vh] max-h-[900px] w-11/12 mx-auto mt-12 mb-32 gap-12 relative">
        <div className="flex-1 p-4 lg:mt-24 flex flex-col justify-start z-10">
          <p className="text-6xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-amber-500 dark:from-[#8254ee] dark:to-[#e7c965] mb-2 tracking-tighter uppercase">
            Level Up
          </p>
          <div className="flex items-center gap-4 mb-2">
            <div className="h-[2px] w-12 bg-gray-400 dark:bg-[#82717b]"></div>
            <p className="text-4xl lg:text-5xl font-light text-gray-500 dark:text-[#82717b] uppercase tracking-widest">Your</p>
          </div>
          <p className="text-6xl lg:text-8xl font-black text-gray-900 dark:text-[#c1cfc1] mb-8 tracking-tighter drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(193,207,193,0.2)] uppercase">
            Funding Game
          </p>

          <p className="text-xl text-gray-600 dark:text-[#82717b] max-w-xl mb-12 font-light leading-relaxed border-l-4 border-amber-500 dark:border-[#e7c965] pl-6">
            A premier simulator platform engineered to forge your trading mindset. Clear realistic market challenges, hone your edge, and practice in a zero-risk environment.
          </p>

          <div className="flex flex-wrap gap-6">
            <Link href="/auth/signup">
              <Button className="h-auto px-10 py-5 bg-amber-500 dark:bg-[#e7c965] text-white dark:text-[#090909] text-sm font-black uppercase tracking-widest rounded-none hover:bg-gray-900 dark:hover:bg-[#c1cfc1] transition-all hover:scale-105 shadow-md dark:shadow-[0_0_30px_rgba(231,201,101,0.2)] border-none">
                Start Simulator
              </Button>
            </Link>
          </div>
        </div>

        <div className="w-full lg:w-5/12 min-h-[400px] lg:h-[700px] b dark:bg-[#090909] rounded-3xl flex-shrink-0 relative overflow-hidden transition-colors duration-300">
          <Rings />
        </div>
      </div>

      {/* The Mindset Journey (Unique Pitch) */}
      <div className="w-full bg-gray-50 dark:bg-[#050304] border-y border-gray-300 dark:border-[#3b353c] py-32 relative overflow-hidden transition-colors duration-300">
        {/* Decorative huge background text */}
        <div className="absolute -top-10 left-[1%] text-[11rem] font-black text-gray-200 dark:text-[#3b353c]/40 whitespace-nowrap pointer-events-none select-none transition-colors duration-300">
          MINDSET
        </div>
        
        <div className="w-11/12 max-w-7xl mx-auto relative z-10">
          <div className="mb-24 md:w-2/3">
            <h2 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-[#c1cfc1] mb-8 tracking-tighter transition-colors duration-300">
              Trading is <span className="text-purple-600 dark:text-[#8254ee]">80% Psychology</span>.
            </h2>
            <p className="text-2xl text-gray-600 dark:text-[#82717b] font-light leading-relaxed transition-colors duration-300">
              We built Krypto Funding as the ultimate practice ground. Our simulator perfectly mirrors real-world prop firm constraints, training your discipline without the massive upfront costs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="group relative">
              <div className="text-8xl font-black text-gray-200 dark:text-[#3b353c] mb-[-30px] relative z-0 transition-colors duration-500 group-hover:text-purple-600 dark:group-hover:text-[#8254ee]">01</div>
              <Card className="relative z-10 bg-white/80 dark:bg-[#090909]/10 backdrop-blur-sm border-gray-300 dark:border-[#3b353c] group-hover:border-purple-600/50 dark:group-hover:border-[#8254ee]/50 transition-colors duration-500 rounded-2xl overflow-hidden shadow-sm">
                <CardContent className="p-10">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-[#c1cfc1] mb-4">Clear the Simulator</h3>
                  <p className="text-gray-600 dark:text-[#82717b] leading-relaxed">Hit realistic profit targets while managing a strict daily and overall drawdown limit. No hidden rules. Practice Crypto, Forex, and Indices on your terms.</p>
                </CardContent>
              </Card>
            </div>

            <div className="group relative pt-0 md:pt-16">
              <div className="text-8xl font-black text-gray-200 dark:text-[#3b353c] mb-[-30px] relative z-0 transition-colors duration-500 group-hover:text-amber-500 dark:group-hover:text-[#e7c965]">02</div>
              <Card className="relative z-10 bg-white/80 dark:bg-[#090909]/10 backdrop-blur-sm border-gray-300 dark:border-[#3b353c] group-hover:border-amber-500/50 dark:group-hover:border-[#e7c965]/50 transition-colors duration-500 rounded-2xl overflow-hidden shadow-sm">
                <CardContent className="p-10">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-[#c1cfc1] mb-4">Prove Consistency</h3>
                  <p className="text-gray-600 dark:text-[#82717b] leading-relaxed">Showcase your ability to protect capital over time. There are no rushed time limits on our simulations—just pure performance training and infinite patience.</p>
                </CardContent>
              </Card>
            </div>

            <div className="group relative pt-0 md:pt-32">
              <div className="text-8xl font-black text-gray-200 dark:text-[#3b353c] mb-[-30px] relative z-0 transition-colors duration-500 group-hover:text-gray-900 dark:group-hover:text-[#c1cfc1]">03</div>
              <Card className="relative z-10 bg-white/80 dark:bg-[#090909]/10 backdrop-blur-sm border-gray-300 dark:border-[#3b353c] group-hover:border-gray-900/50 dark:group-hover:border-[#c1cfc1]/50 transition-colors duration-500 rounded-2xl overflow-hidden shadow-sm">
                <CardContent className="p-10">
                  <h3 className="text-2xl font-bold text-amber-500 dark:text-[#e7c965] mb-4">Master the Markets</h3>
                  <p className="text-gray-600 dark:text-[#82717b] leading-relaxed">Use your cleared simulated challenges as proof of your consistency. Practice repeatedly at a fraction of the cost until you are truly ready for live capital.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <UniquePlanSelector />
      
      <Footer />
    </div>
  );
}
