"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { Eye, EyeOff, Lock, Mail, LogIn } from "lucide-react";
import useLogin from "@/app/controller/useLogin";
import { getFirstAllowedRoute, getStoredUser } from "@/lib/permissions";
import { toast } from "react-toastify";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useLogin();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        router.replace(getFirstAllowedRoute(getStoredUser()) || "/dashboard/trainees");
      }
    }
  }, [router]);

  const validate = () => {
    if (!email) {
      toast.error("Email address is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!password) {
      toast.error("Password is required");
      return false;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-[#decfc7] via-[#fff] to-[#e9e1d8] flex p-2 gap-8 xl:gap-16">
      <Script
        id="check-auth-login"
        dangerouslySetInnerHTML={{
          __html: `
            function checkAuth() {
              if (document.cookie.split('; ').find(function(row) { return row.startsWith('accessToken='); })) {
                window.location.href = '/dashboard';
              }
            }
            checkAuth();
            window.addEventListener('pageshow', function(event) {
              if (event.persisted) checkAuth();
            });
          `,
        }}
      />

      {/* Left Side: Orange Card containing loginImg.png */}
      <div className="hidden lg:block relative w-[38%] max-w-[580px] shrink-0 select-none rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <img
          src="/images/loginImg.png"
          alt="Ignited Code Art Learning Platform"
          className="w-full h-full object-fill rounded-[24px]"
        />
      </div>

      {/* Right Side: Sign-in Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-0">
        <div className="w-full max-w-[372px] flex flex-col items-center">
          {/* Top Login Icon box */}
          <div className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-gray-100/80 mb-6">
            <LogIn className="h-5 w-5 text-gray-700" />
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-sans text-center">
            Sign in with email
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed text-center mt-2.5 mb-8 max-w-[320px]">
            Sign in to access the Trainee Management System and manage trainees,
            training Programs, and user accounts.
          </p>

          <form onSubmit={(e) => e.preventDefault()} className="w-full space-y-4">
            {/* Email Field with inline label and Mail Icon */}
            <div>
              <div className="relative border border-gray-200 rounded-xl px-4 py-1.5 flex items-center gap-3 bg-white transition-all duration-200 focus-within:border-[#ff5b21] focus-within:ring-2 focus-within:ring-[#ff5b21]/15">
                <Mail className="h-5 w-5 text-[#ff5b21] shrink-0" />
                <div className="flex flex-col flex-1 min-w-0">
                  <label className="text-[10px] text-gray-400 font-semibold leading-tight">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        void handleLogin(e);
                      }
                    }}
                    className="text-sm text-gray-900 bg-transparent border-none p-0 focus:ring-0 focus:outline-none placeholder-gray-300 h-5 leading-normal w-full"
                    placeholder="debbie.baker@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Password Field with inline label, Lock Icon & Visibility Toggle */}
            <div>
              <div className="relative border border-gray-200 rounded-xl px-4 py-1.5 flex items-center gap-3 bg-white transition-all duration-200 focus-within:border-[#ff5b21] focus-within:ring-2 focus-within:ring-[#ff5b21]/15">
                <Lock className="h-5 w-5 text-[#ff5b21] shrink-0" />
                <div className="flex flex-col flex-1 min-w-0">
                  <label className="text-[10px] text-gray-400 font-semibold leading-tight">
                    Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length > 19) {
                        toast.error("Password cannot be greater than 20 characters.");
                        return;
                      }
                      setPassword(value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        void handleLogin(e);
                      }
                    }}
                    maxLength={20}
                    className="text-sm text-gray-900 bg-transparent border-none p-0 focus:ring-0 focus:outline-none placeholder-gray-300 h-5 leading-normal w-full"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none shrink-0 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end pt-0.5">
              <Link
                href="/auth/forgot-password"
                className="text-xs font-semibold text-gray-700 hover:text-gray-900 hover:underline cursor-pointer"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Button with Arrow */}
            <button
              type="button"
              onClick={(e) => void handleLogin(e)}
              disabled={loginMutation.isPending}
              className="w-full h-12 bg-[#ff5b21] hover:bg-[#e04f1a] active:bg-[#c54112] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#ff5b21]/15 transition-all duration-200 mt-6 cursor-pointer disabled:opacity-50"
            >
              {loginMutation.isPending ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Login</span>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
