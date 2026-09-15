"use client";
import React, { useState, useRef } from "react";
import { toast } from "sonner";
import Navbar from "@/components/structural/Navbar";
import Footer from "@/components/structural/Footer";
import Link from "next/link";
import axios from "axios";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminSignIn() {
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
      const res = await api.post("/admin/auth/signin", {
        user: formData,
      });
      if (res.status == 200) {
        toast.success("Please enter your OTP.");
        setOtpSent(true);
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
      const res = await api.post("/admin/auth/verify-otp", {
        email: formData.email,
        otp: otpValue,
      });
      if (res.status == 200) {
        toast.success("OTP verified! Redirecting to admin dashboard...");
        setTimeout(() => {
          router.push("/admin/dashboard");
        }, 1500);
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    }
  };

  return (
    <div className="bg-white dark:bg-[#090909] font-sans text-gray-900 dark:text-[#c1cfc1] min-h-screen flex flex-col selection:bg-purple-500 dark:selection:bg-[#a855f7] selection:text-white transition-colors duration-300">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6 my-12">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row border border-gray-300 dark:border-[#3b353c] bg-white dark:bg-[#050304]">
          <div className="hidden lg:flex flex-col justify-center p-16 w-1/2 border-r border-gray-300 dark:border-[#3b353c] bg-gray-50 dark:bg-transparent relative">
            <h2 className="text-7xl font-black text-gray-900 dark:text-[#c1cfc1] mb-6 tracking-tighter uppercase relative z-10">
              Admin
              <br />
              Portal
            </h2>
            <p className="text-gray-600 dark:text-[#82717b] text-xl font-light relative z-10 border-l-4 border-amber-400 dark:border-[#fbbf24] pl-6 leading-relaxed">
              Sign in to manage challenges, view platform metrics, and oversee
              operations.
            </p>
          </div>

          {otpSent ? (
            <div className="w-full lg:w-1/2 p-8 md:p-16 lg:p-24 bg-white dark:bg-[#090909] relative z-10 flex flex-col justify-center items-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-[#a855f7]/20 flex items-center justify-center mb-8 ring-4 ring-purple-50 dark:ring-[#a855f7]/10">
                <svg
                  className="w-8 h-8 text-purple-500 dark:text-[#a855f7]"
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
                <div className="flex flex-col items-center">
                  <div className="flex gap-2 sm:gap-4 justify-center">
                    {otp.map((digit, index) => (
                      <Input
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
                        className="w-12 h-14 sm:w-16 sm:h-20 rounded-md border-2 border-gray-200 bg-white px-0 text-center text-3xl sm:text-4xl font-black text-gray-900 focus:border-purple-500 focus:ring-0 focus:-translate-y-2 focus:shadow-[0_10px_20px_rgba(130,84,238,0.2)] dark:border-[#3b353c] dark:bg-[#090909] dark:text-white dark:focus:border-[#a855f7]"
                      />
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleOtpSubmit}
                  className="h-auto w-full rounded-md bg-purple-500 px-12 py-5 text-sm font-black uppercase tracking-widest text-white hover:bg-purple-600 dark:bg-[#a855f7] dark:hover:bg-[#c084fc] mt-4"
                >
                  Verify Code →
                </Button>
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
                Admin Sign In
              </h3>
              <p className="text-gray-600 dark:text-[#82717b] mb-12 text-sm uppercase tracking-widest font-bold">
                Sign in to manage the platform.
              </p>

              <form className="space-y-10" onSubmit={handleSubmit}>
                <div className="flex flex-col">
                  <Label className="text-xs font-black text-purple-500 dark:text-[#a855f7] uppercase tracking-widest mb-2">
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-xl font-black tracking-tighter text-gray-900 dark:text-white focus-visible:border-purple-500 focus-visible:ring-0 placeholder:text-gray-400 dark:border-[#3b353c] dark:placeholder:text-[#3b353c] dark:focus-visible:border-[#a855f7]"
                    placeholder="Email"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-2 font-bold">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <Label className="text-xs font-black text-purple-500 dark:text-[#a855f7] uppercase tracking-widest mb-2">
                    Password
                  </Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-xl font-black tracking-tighter text-gray-900 dark:text-white focus-visible:border-purple-500 focus-visible:ring-0 placeholder:text-gray-400 dark:border-[#3b353c] dark:placeholder:text-[#3b353c] dark:focus-visible:border-[#a855f7]"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-2 font-bold">
                      {errors.password}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="h-auto w-full rounded-md bg-purple-500 px-12 py-5 text-sm font-black uppercase tracking-widest text-white hover:bg-purple-600 dark:bg-[#a855f7] dark:hover:bg-[#c084fc] mt-4"
                >
                  Sign In →
                </Button>
              </form>

              <p className="mt-12 text-center text-sm font-bold tracking-widest uppercase text-gray-600 dark:text-[#82717b]">
                Need an admin account?{" "}
                <Link
                  href="/admin/auth/signup"
                  className="text-amber-400 dark:text-[#fbbf24] hover:text-gray-900 dark:hover:text-white transition-colors border-b border-amber-400/30 dark:border-[#fbbf24]/30 hover:border-gray-900 dark:hover:border-white pb-1 ml-2"
                >
                  Register
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
