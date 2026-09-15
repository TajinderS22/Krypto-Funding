"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Navbar from "@/components/structural/Navbar";
import Footer from "@/components/structural/Footer";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    username: "",
  });

  const [errors, setErrors] = useState<{
    firstname?: string;
    lastname?: string;
    email?: string;
    password?: string;
    username?: string;
  }>({});

  const validate = () => {
    const newErrors: {
      firstname?: string;
      lastname?: string;
      email?: string;
      password?: string;
    } = {};
    if (!formData.firstname.trim())
      newErrors.firstname = "First name is required.";
    if (!formData.lastname.trim())
      newErrors.lastname = "Last name is required.";
    if (!formData.email.match(/^\S+@\S+\.\S+$/))
      newErrors.email = "Please enter a valid email address.";
    if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    try {
      const result = await api.post("/user/auth/signup", {
        user: formData,
      });
      if (result.status === 200 || result.status === 201) {
        toast.success("Account created successfully!");
        router.push("/auth/signin");
      } else {
        toast.error("Failed to create account. Please try again.");
      }
    } catch (err: unknown) {
      let message = "An error occurred during signup.";

      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "object" && err !== null && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        message = axiosError.response?.data?.message || message;
      }

      toast.error(message);
      console.error(err);
    }
  };

  return (
    <div className="bg-white dark:bg-[#090909] font-sans text-gray-900 dark:text-[#c1cfc1] min-h-screen flex flex-col selection:bg-amber-400 dark:selection:bg-[#fbbf24] selection:text-white dark:selection:text-[#090909] transition-colors duration-300">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6 my-12">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row-reverse border border-gray-300 dark:border-[#3b353c] bg-white dark:bg-[#050304]">
          <div className="hidden lg:flex flex-col justify-center p-16 w-1/2 border-l border-gray-300 dark:border-[#3b353c] bg-gray-50 dark:bg-transparent relative">
            <h2 className="text-7xl font-black text-gray-900 dark:text-[#c1cfc1] mb-6 tracking-tighter uppercase relative z-10 text-right">
              Begin Your
              <br />
              Training
            </h2>
            <p className="text-gray-600 dark:text-[#82717b] text-xl font-light relative z-10 border-r-4 border-purple-500 dark:border-[#a855f7] pr-6 text-right leading-relaxed">
              Create an account to access our risk-free simulator platform and
              hone your trading edge.
            </p>
          </div>

          <div className="w-full lg:w-1/2 p-8 md:p-16 lg:p-24 bg-white dark:bg-[#090909] relative z-10">
            <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter uppercase">
              Create Account
            </h3>
            <p className="text-gray-600 dark:text-[#82717b] mb-10 text-sm uppercase tracking-widest font-bold">
              Join the premier trading simulator today.
            </p>

            <form className="space-y-10" onSubmit={handleSubmit}>
              <div className="flex flex-col sm:flex-row gap-8">
                <div className="flex flex-col flex-1">
                  <Label className="text-xs font-black text-amber-400 dark:text-[#fbbf24] tracking-widest mb-2">
                    First Name
                  </Label>
                  <Input
                    type="text"
                    value={formData.firstname}
                    onChange={(e) =>
                      setFormData({ ...formData, firstname: e.target.value })
                    }
                    className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-xl font-black tracking-tighter text-gray-900 dark:text-white focus-visible:border-amber-400 focus-visible:ring-0 placeholder:text-gray-400 dark:border-[#3b353c] dark:placeholder:text-[#3b353c] dark:focus-visible:border-[#fbbf24]"
                    placeholder="JOHN"
                  />
                  {errors.firstname && (
                    <p className="text-red-500 text-xs mt-2 font-bold">
                      {errors.firstname}
                    </p>
                  )}
                </div>
                <div className="flex flex-col flex-1">
                  <Label className="text-xs font-black text-amber-400 dark:text-[#fbbf24] tracking-widest mb-2">
                    Last Name
                  </Label>
                  <Input
                    type="text"
                    value={formData.lastname}
                    onChange={(e) =>
                      setFormData({ ...formData, lastname: e.target.value })
                    }
                    className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-xl font-black tracking-tighter text-gray-900 dark:text-white focus-visible:border-amber-400 focus-visible:ring-0 placeholder:text-gray-400 dark:border-[#3b353c] dark:placeholder:text-[#3b353c] dark:focus-visible:border-[#fbbf24]"
                    placeholder="DOE"
                  />
                  {errors.lastname && (
                    <p className="text-red-500 text-xs mt-2 font-bold">
                      {errors.lastname}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <Label className="text-xs font-black text-amber-400 dark:text-[#fbbf24] uppercase tracking-widest mb-2">
                  Username
                </Label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-xl font-black tracking-tighter text-gray-900 dark:text-white focus-visible:border-amber-400 focus-visible:ring-0 placeholder:text-gray-400 dark:border-[#3b353c] dark:placeholder:text-[#3b353c] dark:focus-visible:border-[#fbbf24]"
                  placeholder="Username"
                />
                {errors.username && (
                  <p className="text-red-500 text-xs mt-2 font-bold">
                    {errors.username}
                  </p>
                )}
              </div>

              <div className="flex flex-col">
                <Label className="text-xs font-black text-amber-400 dark:text-[#fbbf24] uppercase tracking-widest mb-2">
                  Email Address
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-xl font-black tracking-tighter text-gray-900 dark:text-white focus-visible:border-amber-400 focus-visible:ring-0 placeholder:text-gray-400 dark:border-[#3b353c] dark:placeholder:text-[#3b353c] dark:focus-visible:border-[#fbbf24]"
                  placeholder="Email"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-2 font-bold">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="flex flex-col">
                <Label className="text-xs font-black text-amber-400 dark:text-[#fbbf24] uppercase tracking-widest mb-2">
                  Password
                </Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-xl font-black tracking-tighter text-gray-900 dark:text-white focus-visible:border-amber-400 focus-visible:ring-0 placeholder:text-gray-400 dark:border-[#3b353c] dark:placeholder:text-[#3b353c] dark:focus-visible:border-[#fbbf24]"
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
                className="h-auto w-full rounded-md bg-amber-400 px-12 py-5 text-sm font-black uppercase tracking-widest text-white hover:bg-gray-900 dark:bg-[#fbbf24] dark:text-[#090909] dark:hover:bg-[#c1cfc1] mt-4"
              >
                Create Account →
              </Button>
            </form>

            <p className="mt-12 text-center text-sm font-bold tracking-widest uppercase text-gray-600 dark:text-[#82717b]">
              Already have an account?{" "}
              <Link
                href="/auth/signin"
                className="text-purple-500 dark:text-[#a855f7] hover:text-gray-900 dark:hover:text-white transition-colors border-b border-purple-500/30 dark:border-[#a855f7]/30 hover:border-gray-900 dark:hover:border-white pb-1 ml-2"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
