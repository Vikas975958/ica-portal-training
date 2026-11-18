"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Mail, KeyRound, CheckCircle2, ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import { forgotPasswordUser, resetPasswordUser } from "@/api/post";
import { toast } from "react-toastify";
const getErrorMessage = err => {
  const error = err;
  return error.response?.data?.message || error.message || "Failed to connect to the authentication server.";
};
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const tokenVal = localStorage.getItem("accessToken");
      if (tokenVal) {
        router.replace("/dashboard");
        return;
      }
      // Redirect to /auth/reset-password if token is present in the URL
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get("token");
      if (tokenParam) {
        router.replace(`/auth/reset-password?token=${tokenParam}`);
      }
    }
  }, [router]);

  // Reset password states (for manual entry screen after sending reset link)
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const validate = () => {
    if (!email) {
      toast.error("Email address is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    return true;
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const response = await forgotPasswordUser(email);
      if (response.success) {
        toast.success(response.message || "Password reset link sent successfully.");
        setSuccess(true);
      } else {
        toast.error(response.message || "Failed to request password reset. Please try again.");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };
  const handleResetSubmit = async e => {
    e.preventDefault();
    if (!token) {
      toast.error("Reset token is required");
      return;
    }
    if (!newPassword) {
      toast.error("New password is required");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setResetSubmitting(true);
    try {
      const response = await resetPasswordUser(token, newPassword);
      if (response.success) {
        toast.success(response.message || "Password reset successfully.");
        setResetSuccess(true);
      } else {
        toast.error(response.message || "Failed to reset password. The token may be invalid or expired.");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResetSubmitting(false);
    }
  };
  return <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-[#decfc7] via-[#fff] to-[#e9e1d8] flex p-2 gap-8 xl:gap-16">
      <Script id="check-auth-forgot-password" dangerouslySetInnerHTML={{
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
        {success ? <div className="w-full max-w-[372px] flex flex-col items-center animate-fade-in">
            {/* Top Mail Icon box */}
            <div className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-gray-100/80 mb-6 text-[#ff5b21]">
              <Mail className="h-6 w-6" />
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-sans text-center">
              Check your email
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed text-center mt-2.5 mb-8 max-w-[320px]">
              We have sent a password reset link to <strong className="text-gray-700">{email}</strong>. Please check your inbox and follow the instructions to reset your password.
            </p>

            <Link href="/" className="w-full h-12 bg-[#ff5b21] hover:bg-[#e04f1a] active:bg-[#c54112] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#ff5b21]/15 transition-all duration-200 cursor-pointer">
              <span>Back to Login</span>
            </Link>

            <button type="button" onClick={() => {
          setSuccess(false);
          setEmail("");
        }} className="mt-4 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:underline cursor-pointer">
              Request New Link
            </button>
          </div> : <div className="w-full max-w-[372px] flex flex-col items-center">
            {/* Top Key Icon box */}
            <div className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-gray-100/80 mb-6 text-gray-700">
              <KeyRound className="h-5 w-5" />
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-sans text-center">
              Forgot password?
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed text-center mt-2.5 mb-8 max-w-[320px]">
              No worries! Enter your email below and we will send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              {/* Email Field with inline label and Mail Icon */}
              <div>
                <div className="relative border border-gray-200 focus-within:border-[#ff5b21] focus-within:ring-2 focus-within:ring-[#ff5b21]/15 rounded-xl px-4 py-1.5 flex items-center gap-3 bg-white transition-all duration-200">
                  <Mail className="h-5 w-5 text-[#ff5b21] shrink-0" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <label className="text-[10px] text-gray-400 font-semibold leading-tight">
                      Email address
                    </label>
                    <input type="email" value={email} onChange={e => {
                  setEmail(e.target.value);
                }} className="text-sm text-gray-900 bg-transparent border-none p-0 focus:ring-0 focus:outline-none placeholder-gray-300 h-5 leading-normal w-full" placeholder="debbie.baker@example.com" />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button type="submit" disabled={submitting} className="w-full h-12 bg-[#ff5b21] hover:bg-[#e04f1a] active:bg-[#c54112] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#ff5b21]/15 transition-all duration-200 mt-6 cursor-pointer disabled:opacity-50">
                {submitting ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <>
                    <span>Send Reset Link</span>
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
          </div>}
      </div>
    </div>;
}