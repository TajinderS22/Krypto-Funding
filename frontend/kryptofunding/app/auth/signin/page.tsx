"use client";
import React, { useState, useRef } from "react";
import { toast } from "sonner";
import Navbar from "@/components/structural/Navbar";
import Footer from "@/components/structural/Footer";
import Link from "next/link";
import axios from "axios";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const router = useRouter();

  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!formData.email.match(/^\S+@\S+\.\S+$/)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors in the form.");
      return;
    }

    try {
      const res = await api.post("/user/auth/signin", {
        user: formData,
      });
      if (res.status == 200) {
        toast.success("Please enter your OTP.");
        setOtpSent(true);
      } else {
        toast.error("Sign in failed. Please try again.");
      }
    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message
        : undefined;
      toast.error(errorMessage || "An error occurred during sign in.");
      console.error(err);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    if (value.length > 2) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input if value is entered
    if (value !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async () => {
    const otpValue = otp.join("");
    try {
      const res = await api.post("/user/auth/verify-otp", {
        email: formData.email,
        otp: otpValue,
      });
      if (res.status == 200) {
        toast.success("OTP verified! Redirecting...");
        setTimeout(() => {
          router.push("/client/dashboard");
        }, 3000);
      }
    } catch (error) {
      toast.error("Someting Went Wrong");
      console.error(error);
    }
  };

  return (
    <div className="bg-white dark:bg-[#090909] font-sans text-gray-900 dark:text-[#c1cfc1] min-h-screen flex flex-col selection:bg-purple-600 dark:selection:bg-[#8254ee] selection:text-white transition-colors duration-300">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6 my-12">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row border border-gray-300 dark:border-[#3b353c] bg-white dark:bg-[#050304]">
          <div className="hidden lg:flex flex-col justify-center p-16 w-1/2 border-r border-gray-300 dark:border-[#3b353c] bg-gray-50 dark:bg-transparent relative">
            <h2 className="text-7xl font-black text-gray-900 dark:text-[#c1cfc1] mb-6 tracking-tighter uppercase relative z-10">
              Welcome
              <br />
              Back
            </h2>
            <p className="text-gray-600 dark:text-[#82717b] text-xl font-light relative z-10 border-l-4 border-amber-500 dark:border-[#e7c965] pl-6 leading-relaxed">
              Access your dashboard to review your simulator metrics and
              continue your journey.
            </p>
          </div>

          {otpSent ? (
            <div className="w-full lg:w-1/2 p-8 md:p-16 lg:p-24 bg-white dark:bg-[#090909] relative z-10 flex flex-col justify-center items-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-[#8254ee]/20 flex items-center justify-center mb-8 ring-4 ring-purple-50 dark:ring-[#8254ee]/10">
                <svg
                  className="w-8 h-8 text-purple-600 dark:text-[#8254ee]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter uppercase text-center">
                Verify OTP
              </h3>
              <p className="text-gray-600 dark:text-[#82717b] mb-12 text-sm uppercase tracking-widest font-bold text-center">
                Enter the 6-digit code sent to your email.
              </p>

              <div className="w-full max-w-sm space-y-10">
                <div className="flex flex-col pb-2 items-center">
                  <div className="flex gap-2 sm:gap-4 justify-center">
                    {otp.map((digit, index) => (
                      <input
                        key={`otp-${index}`}
                        ref={(el) => {
                          otpRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 sm:w-16 sm:h-20 text-center text-3xl sm:text-4xl font-black bg-white dark:bg-[#090909] border-2 border-gray-200 dark:border-[#2a262b] text-gray-900 dark:text-white focus:outline-none focus:border-purple-600 dark:focus:border-[#8254ee] focus:-translate-y-2 focus:shadow-[0_10px_20px_rgba(130,84,238,0.2)] rounded-lg transition-all duration-300 shadow-sm"
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleOtpSubmit}
                  className="group relative px-12 py-5 bg-transparent overflow-hidden rounded-full ring-2 ring-purple-600/50 dark:ring-[#8254ee]/50 text-gray-900 dark:text-white hover:text-white dark:hover:text-black hover:ring-purple-600 dark:hover:ring-[#8254ee] transition-all duration-500 inline-flex items-center justify-center w-full mt-4"
                >
                  <div className="absolute inset-0 w-0 bg-purple-600 dark:bg-linear-to-r dark:from-[#8254ee] dark:to-[#966bfe] transition-all duration-300 ease-in-out group-hover:w-full rounded-r-full"></div>
                  <span className="relative font-black tracking-widest uppercase flex items-center gap-4">
                    <span>Verify Code</span>{" "}
                    <span className="text-xl group-hover:translate-x-2 transition-transform">
                      →
                    </span>
                  </span>
                </button>
              </div>

              <button
                onClick={() => {
                  setOtpSent(false);
                  setOtp(["", "", "", "", "", ""]);
                }}
                className="mt-8 text-xs font-bold text-gray-500 dark:text-[#82717b] hover:text-gray-900 dark:hover:text-white transition-colors uppercase tracking-widest border-b border-transparent hover:border-gray-900 dark:hover:border-white pb-1"
              >
                ← Back to Login
              </button>
            </div>
          ) : (
            <div className="w-full lg:w-1/2 p-8 md:p-16 lg:p-24 bg-white dark:bg-[#090909] relative z-10">
              <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter uppercase">
                Sign In
              </h3>
              <p className="text-gray-600 dark:text-[#82717b] mb-12 text-sm uppercase tracking-widest font-bold">
                Log in to your account.
              </p>

              <form className="space-y-10" onSubmit={handleSubmit}>
                <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                  <label className="block text-xs font-black text-purple-600 dark:text-[#8254ee] uppercase tracking-widest mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-black tracking-tighter "
                    placeholder="Email"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-2 font-bold">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-black text-purple-600 dark:text-[#8254ee] uppercase tracking-widest">
                      Password
                    </label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs font-bold text-amber-500 dark:text-[#e7c965] hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-black tracking-tighter uppercase"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-2 font-bold">
                      {errors.password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="group relative px-12 py-5 bg-transparent overflow-hidden rounded-full ring-2 ring-purple-600/50 dark:ring-[#8254ee]/50 text-gray-900 dark:text-white hover:text-white dark:hover:text-black hover:ring-purple-600 dark:hover:ring-[#8254ee] transition-all duration-500 inline-flex items-center justify-center w-full mt-4"
                >
                  <div className="absolute inset-0 w-0 bg-purple-600 dark:bg-linear-to-r dark:from-[#8254ee] dark:to-[#966bfe] transition-all duration-300 ease-in-out group-hover:w-full rounded-r-full"></div>
                  <span className="relative font-black tracking-widest uppercase flex items-center gap-4">
                    <span>Sign In</span>{" "}
                    <span className="text-xl group-hover:translate-x-2 transition-transform">
                      →
                    </span>
                  </span>
                </button>
              </form>

              <p className="mt-12 text-center text-sm font-bold tracking-widest uppercase text-gray-600 dark:text-[#82717b]">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="text-amber-500 dark:text-[#e7c965] hover:text-gray-900 dark:hover:text-white transition-colors border-b border-amber-500/30 dark:border-[#e7c965]/30 hover:border-gray-900 dark:hover:border-white pb-1 ml-2"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
