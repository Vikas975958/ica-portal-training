"use client";

import React, { useState } from "react";
import { Mail, ShieldAlert, KeyRound, CheckCircle2, ArrowLeft } from "lucide-react";

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export default function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (!email) {
      setError("Email address is required");
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError("");

    // Simulate sending email
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
    }, 1200);
  };

  if (success) {
    return (
      <div className="w-full max-w-[372px] flex flex-col items-center">
        {/* Top Success Icon box */}
        <div className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-gray-100/80 mb-6 text-green-500">
          <CheckCircle2 className="h-6 w-6" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-sans text-center">
          Check your email
        </h2>
        <p className="text-xs text-gray-500 leading-relaxed text-center mt-2.5 mb-8 max-w-[320px]">
          We have sent a password reset link to <strong className="text-gray-700">{email}</strong>. Please check your inbox.
        </p>

        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full h-12 bg-[#ff5b21] hover:bg-[#e04f1a] active:bg-[#c54112] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#ff5b21]/15 transition-all duration-200 cursor-pointer"
        >
          <span>Back to Login</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[372px] flex flex-col items-center">
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
          <div className={`relative border rounded-xl px-4 py-1.5 flex items-center gap-3 bg-white transition-all duration-200 ${
            error ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500/10" : "border-gray-200 focus-within:border-[#ff5b21] focus-within:ring-2 focus-within:ring-[#ff5b21]/15"
          }`}>
            <Mail className="h-5 w-5 text-[#ff5b21] shrink-0" />
            <div className="flex flex-col flex-1 min-w-0">
              <label className="text-[10px] text-gray-400 font-semibold leading-tight">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                className="text-sm text-gray-900 bg-transparent border-none p-0 focus:ring-0 focus:outline-none placeholder-gray-300 h-5 leading-normal w-full"
                placeholder="debbie.baker@example.com"
              />
            </div>
          </div>
          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1.5 pl-1">
              <ShieldAlert className="h-3.5 w-3.5" />
              {error}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 bg-[#ff5b21] hover:bg-[#e04f1a] active:bg-[#c54112] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#ff5b21]/15 transition-all duration-200 mt-6 cursor-pointer disabled:opacity-50"
        >
          {submitting ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <span>Send Reset Link</span>
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

        {/* Back to Login Link */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-xs font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Login
          </button>
        </div>
      </form>
    </div>
  );
}
