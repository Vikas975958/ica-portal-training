"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { Eye, EyeOff, Lock, ShieldAlert, KeyRound, CheckCircle2, ArrowLeft } from "lucide-react";
import { resetPasswordUser } from "@/api/post";
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("accessToken");
      if (storedToken && !token) {
        router.replace("/dashboard");
      }
    }
  }, [router, token]);
  const validate = () => {
    if (!token) {
      setError("Reset token is missing or invalid. Please request a new reset link.");
      return false;
    }
    if (!password) {
      setError("New password is required");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    setError("");
    return true;
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await resetPasswordUser(token, password);
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || "Failed to reset password. The link may have expired.");
      }
    } catch (err) {
      const apiError = err;
      const errorMessage = apiError.response?.data?.message || apiError.message || "Failed to connect to the authentication server.";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  if (!token) {
    return <div className="w-full max-w-[372px] flex flex-col items-center">
        <div className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-gray-100/80 mb-6 text-red-500">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-sans text-center">
          Invalid Link
        </h2>
        <p className="text-xs text-gray-500 leading-relaxed text-center mt-2.5 mb-8 max-w-[320px]">
          The password reset link is invalid or missing the security token. Please request a new one.
        </p>
        <Link href="/auth/forgot-password" className="w-full h-12 bg-[#ff5b21] hover:bg-[#e04f1a] active:bg-[#c54112] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#ff5b21]/15 transition-all duration-200 cursor-pointer">
          <span>Request New Link</span>
        </Link>
      </div>;
  }
  if (success) {
    return <div className="w-full max-w-[372px] flex flex-col items-center">
        <div className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-gray-100/80 mb-6 text-green-500">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-sans text-center">
          Password Reset
        </h2>
        <p className="text-xs text-gray-500 leading-relaxed text-center mt-2.5 mb-8 max-w-[320px]">
          Your password has been successfully reset. You can now log in using your new password.
        </p>
        <Link href="/" className="w-full h-12 bg-[#ff5b21] hover:bg-[#e04f1a] active:bg-[#c54112] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#ff5b21]/15 transition-all duration-200 cursor-pointer">
          <span>Go to Login</span>
        </Link>
      </div>;
  }
  return <div className="w-full max-w-[372px] flex flex-col items-center">
      <div className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-gray-100/80 mb-6 text-gray-700">
        <KeyRound className="h-5 w-5" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-sans text-center">
        Reset Password
      </h2>
      <p className="text-xs text-gray-500 leading-relaxed text-center mt-2.5 mb-8 max-w-[320px]">
        Please choose a strong password that is at least 6 characters long.
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
            <span className="flex-1">{error}</span>
          </div>}

        {/* New Password Field */}
        <div>
          <div className={`relative h-[45px] border rounded-xl px-4 py-1.5 flex items-center gap-3 bg-white transition-all duration-200 ${error && !password ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500/10" : "border-gray-200 focus-within:border-[#ff5b21] focus-within:ring-2 focus-within:ring-[#ff5b21]/15"}`}>
            <Lock className="h-5 w-5 text-[#ff5b21] shrink-0" />
            <div className="flex flex-col flex-1 min-w-0">
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => {
              setPassword(e.target.value);
              if (error) setError("");
            }} className="h-full text-sm text-gray-900 bg-transparent border-none p-0 focus:ring-0 focus:outline-none placeholder-gray-300 h-5 leading-normal w-full" placeholder="New Password" />
            </div>
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 focus:outline-none shrink-0 cursor-pointer">
              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        {/* Confirm New Password Field */}
        <div>
          <div className={`relative h-[45px] border rounded-xl px-4 py-1.5 flex items-center gap-3 bg-white transition-all duration-200 ${error && password !== confirmPassword ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500/10" : "border-gray-200 focus-within:border-[#ff5b21] focus-within:ring-2 focus-within:ring-[#ff5b21]/15"}`}>
            <Lock className="h-5 w-5 text-[#ff5b21] shrink-0" />
            <div className="flex flex-col flex-1 min-w-0">
              <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => {
              setConfirmPassword(e.target.value);
              if (error) setError("");
            }} className="h-full text-sm text-gray-900 bg-transparent border-none p-0 focus:ring-0 focus:outline-none placeholder-gray-300 h-5 leading-normal w-full" placeholder="Confirm Password" />
            </div>
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-gray-400 hover:text-gray-600 focus:outline-none shrink-0 cursor-pointer">
              {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" disabled={submitting} className="w-full h-12 bg-[#ff5b21] hover:bg-[#e04f1a] active:bg-[#c54112] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#ff5b21]/15 transition-all duration-200 mt-6 cursor-pointer disabled:opacity-50">
          {submitting ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <>
              <span>Reset Password</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>}
        </button>

        {/* Back to Login Link */}
        <div className="flex justify-center pt-2">
          <Link href="/" className="text-xs font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-1.5 hover:underline cursor-pointer">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Login
          </Link>
        </div>
      </form>
    </div>;
}
export default function ResetPasswordPage() {
  return <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-[#decfc7] via-[#fff] to-[#e9e1d8] flex p-2 gap-8 xl:gap-16">
      <Script id="check-auth-reset" dangerouslySetInnerHTML={{
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
          `
    }} />
      
      {/* Left Side: Orange Card containing loginImg.png */}
      <div className="hidden lg:block relative w-[38%] max-w-[580px] shrink-0 select-none rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <img src="/images/loginImg.png" alt="Ignited Code Art Learning Platform" className="w-full h-full object-fill rounded-[24px]" />
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-0">
        <Suspense fallback={<div className="flex flex-col items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff5b21] border-t-transparent" />
            <p className="text-xs text-gray-500 mt-2">Loading...</p>
          </div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>

    </div>;
}