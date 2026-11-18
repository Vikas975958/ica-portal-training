"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { availablePermissions, tailwindAvatarBgs } from "./UserTypes";
export default function UserFormView({
  mode,
  user,
  onBack,
  onSubmit
}) {
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formConfirmPassword, setFormConfirmPassword] = useState("");
  const [formRole, setFormRole] = useState("Admin");
  const [formPermissions, setFormPermissions] = useState([]);
  const [formStatus, setFormStatus] = useState("Active");
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  useEffect(() => {
    if (mode === "edit" && user) {
      setFormFirstName(user.firstName);
      setFormLastName(user.lastName);
      setFormEmail(user.email);
      setFormPassword(user.password || "");
      setFormConfirmPassword(user.password || "");
      setFormRole(user.role || "Admin");
      setFormPermissions(user.permissions || []);
      setFormStatus(user.status || "Active");
    } else {
      setFormFirstName("");
      setFormLastName("");
      setFormEmail("");
      setFormPassword("");
      setFormConfirmPassword("");
      setFormRole("Admin");
      setFormPermissions([]);
      setFormStatus("Active");
    }
    setFormErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [mode, user]);
  const handlePermissionCheckboxChange = perm => {
    setFormPermissions(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
  };
  const handleFormSubmit = e => {
    e.preventDefault();
    const errors = {};
    if (!formFirstName.trim()) errors.firstName = "First Name is required";
    if (!formLastName.trim()) errors.lastName = "Last Name is required";
    if (!formEmail.trim()) {
      errors.email = "Email Address is required";
    } else if (!/\S+@\S+\.\S+/.test(formEmail)) {
      errors.email = "Please enter a valid email address";
    }
    if (!formPassword) {
      errors.password = "Password is required";
    } else if (formPassword.length < 6) {
      errors.password = "Password must be at least 6 characters";
    } else if (formPassword.length > 20) {
      errors.password = "Password cannot exceed 20 characters";
    }
    if (!formConfirmPassword) {
      errors.confirmPassword = "Confirm Password is required";
    } else if (formConfirmPassword !== formPassword) {
      errors.confirmPassword = "Passwords do not match";
    } else if (formConfirmPassword.length > 20) {
      errors.confirmPassword = "Confirm Password cannot exceed 20 characters";
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    const randBg = user?.avatarBg || tailwindAvatarBgs[Math.floor(Math.random() * tailwindAvatarBgs.length)];
    const userData = {
      id: user ? user.id : String(Date.now()),
      firstName: formFirstName.trim(),
      lastName: formLastName.trim(),
      email: formEmail.trim(),
      password: formPassword,
      role: formRole,
      permissions: formPermissions,
      status: formStatus,
      avatarBg: randBg,
      initial: formFirstName.trim().charAt(0).toUpperCase()
    };
    onSubmit(userData);
  };
  return <form onSubmit={handleFormSubmit} className=" rounded-3xl mx-auto ">
      {/* Top Breadcrumbs */}
      <Breadcrumb backText="User Management" onBack={onBack} currentText={mode === "add" ? "Add User" : "Edit User"} />

      {/* Centered Page Titles */}
      <div className="mb-8 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-[#111827]">
          {mode === "add" ? "Add User" : "Edit User"}
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          {mode === "add" ? "Add the user details and permission" : "Update the user details and permission"}
        </p>
      </div>

      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Section 1: User Information */}
        <div>
          <h3 className="text-sm font-bold text-[#1f1f1f] mb-4">
            User Information
          </h3>

          <div className="space-y-4">
            {/* First Name & Last Name Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name Input */}
              <div className="flex flex-col">
                <div className={`flex flex-col border bg-white rounded-xl px-3.5 py-1.5 focus-within:border-[#ff5b21] transition h-[52px] justify-center ${formErrors.firstName ? "border-red-500 focus-within:border-red-500" : "border-gray-200"}`}>
                  {formFirstName !== "" && <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5 animate-in fade-in slide-in-from-top-1 duration-100">
                      First Name
                    </span>}
                  <input type="text" placeholder={formFirstName === "" ? "First Name" : ""} value={formFirstName} onChange={e => {
                  setFormFirstName(e.target.value);
                  if (formErrors.firstName) setFormErrors({
                    ...formErrors,
                    firstName: ""
                  });
                }} className="text-xs text-gray-800 bg-transparent border-none p-0 focus:ring-0 focus:outline-none w-full" />
                </div>
                {formErrors.firstName && <span className="text-[10px] text-red-500 mt-1 font-semibold pl-1">
                    {formErrors.firstName}
                  </span>}
              </div>

              {/* Last Name Input */}
              <div className="flex flex-col">
                <div className={`flex flex-col border bg-white rounded-xl px-3.5 py-1.5 focus-within:border-[#ff5b21] transition h-[52px] justify-center ${formErrors.lastName ? "border-red-500 focus-within:border-red-500" : "border-gray-200"}`}>
                  {formLastName !== "" && <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5 animate-in fade-in slide-in-from-top-1 duration-100">
                      Last Name
                    </span>}
                  <input type="text" placeholder={formLastName === "" ? "Last Name" : ""} value={formLastName} onChange={e => {
                  setFormLastName(e.target.value);
                  if (formErrors.lastName) setFormErrors({
                    ...formErrors,
                    lastName: ""
                  });
                }} className="text-xs text-gray-800 bg-transparent border-none p-0 focus:ring-0 focus:outline-none w-full" />
                </div>
                {formErrors.lastName && <span className="text-[10px] text-red-500 mt-1 font-semibold pl-1">
                    {formErrors.lastName}
                  </span>}
              </div>
            </div>

            {/* Email Address Input */}
            <div className="flex flex-col">
              <div className={`flex flex-col border bg-white rounded-xl px-3.5 py-1.5 focus-within:border-[#ff5b21] transition h-[52px] justify-center ${formErrors.email ? "border-red-500 focus-within:border-red-500" : "border-gray-200"}`}>
                {formEmail !== "" && <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5 animate-in fade-in slide-in-from-top-1 duration-100">
                    Email Address
                  </span>}
                <input type="email" placeholder={formEmail === "" ? "Email Address" : ""} value={formEmail} onChange={e => {
                setFormEmail(e.target.value);
                if (formErrors.email) setFormErrors({
                  ...formErrors,
                  email: ""
                });
              }} className="text-xs text-gray-800 bg-transparent border-none p-0 focus:ring-0 focus:outline-none w-full" />
              </div>
              {formErrors.email && <span className="text-[10px] text-red-500 mt-1 font-semibold pl-1">
                  {formErrors.email}
                </span>}
            </div>

            {/* Password & Confirm Password Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <div className="flex flex-col">
                <div className={`flex flex-col border bg-white rounded-xl pl-3.5 pr-10 py-1.5 focus-within:border-[#ff5b21] transition h-[52px] justify-center relative ${formErrors.password ? "border-red-500 focus-within:border-red-500" : "border-gray-200"}`}>
                  {formPassword !== "" && <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5 animate-in fade-in slide-in-from-top-1 duration-100">
                      Password
                    </span>}
                  <input type={showPassword ? "text" : "password"} placeholder={formPassword === "" ? "Password" : ""} value={formPassword} maxLength={20} onChange={e => {
                  const val = e.target.value.slice(0, 20);
                  setFormPassword(val);
                  if (formErrors.password) setFormErrors({
                    ...formErrors,
                    password: ""
                  });
                }} className="text-xs text-gray-800 bg-transparent border-none p-0 focus:ring-0 focus:outline-none w-full" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition cursor-pointer z-10">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.password && <span className="text-[10px] text-red-500 mt-1 font-semibold pl-1">
                    {formErrors.password}
                  </span>}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col">
                <div className={`flex flex-col border bg-white rounded-xl pl-3.5 pr-10 py-1.5 focus-within:border-[#ff5b21] transition h-[52px] justify-center relative ${formErrors.confirmPassword ? "border-red-500 focus-within:border-red-500" : "border-gray-200"}`}>
                  {formConfirmPassword !== "" && <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5 animate-in fade-in slide-in-from-top-1 duration-100">
                      Confirm Password
                    </span>}
                  <input type={showConfirmPassword ? "text" : "password"} placeholder={formConfirmPassword === "" ? "Confirm Password" : ""} value={formConfirmPassword} maxLength={20} onChange={e => {
                  const val = e.target.value.slice(0, 20);
                  setFormConfirmPassword(val);
                  if (formErrors.confirmPassword) setFormErrors({
                    ...formErrors,
                    confirmPassword: ""
                  });
                }} className="text-xs text-gray-800 bg-transparent border-none p-0 focus:ring-0 focus:outline-none w-full" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition cursor-pointer z-10">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.confirmPassword && <span className="text-[10px] text-red-500 mt-1 font-semibold pl-1">
                    {formErrors.confirmPassword}
                  </span>}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Permission */}
        <div className="pt-2">
          <h3 className="text-sm font-bold text-[#1f1f1f] mb-3">
            Permission
          </h3>

          <div className="flex flex-col gap-3.5 select-none">
            {availablePermissions.map(perm => {
            const isChecked = formPermissions.includes(perm);
            return <label key={perm} className="flex items-center gap-3 text-xs font-medium text-gray-700 cursor-pointer select-none">
                  <div className={`h-4 w-4 rounded flex items-center justify-center border transition-all cursor-pointer shrink-0 ${isChecked ? "bg-[#ff5b21] border-[#ff5b21] text-white" : "bg-white border-gray-300 hover:border-gray-400"}`}>
                    <input type="checkbox" checked={isChecked} onChange={() => handlePermissionCheckboxChange(perm)} className="sr-only" />
                    {isChecked && <svg className="w-2.5 h-2.5 fill-current text-white" viewBox="0 0 20 20">
                        <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                      </svg>}
                  </div>
                  <span>{perm}</span>
                </label>;
          })}
          </div>
        </div>

        {/* Centered Submit Button */}
        <div className="flex justify-center pt-6 pb-2">
          <button type="submit" className="w-full md:w-auto min-w-[140px] bg-[#ff5b21] hover:bg-[#e04f1a] px-8 py-3 text-xs font-bold text-white transition rounded-xl shadow-sm text-center cursor-pointer select-none">
            {mode === "add" ? "Add User" : "Update User"}
          </button>
        </div>
      </div>
    </form>;
}