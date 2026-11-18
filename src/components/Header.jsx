"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  UserCircle2,
  X,
} from "lucide-react";
import { MobilemenuIcon } from "@/utils/svgicon";
import { updateTraineeUser, changePasswordUser } from "@/api/put";
import { toast } from "react-toastify";

const getErrorMessage = (error, fallback) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

function ModalShell({
  children,
  maxWidthClass = "max-w-[360px]",
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
      <div
        className={`relative w-full ${maxWidthClass} rounded-2xl bg-white p-4 shadow-2xl md:p-5`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#0c101d] text-white hover:opacity-90 cursor-pointer transition z-10"
          aria-label="Close modal"
        >
          <X className="h-4 w-4 stroke-[3.2px]" />
        </button>
        {children}
      </div>
    </div>
  );
}

function PasswordInput({ placeholder, value, onChange, required }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={isVisible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="h-9 w-full rounded-md border border-[#e4e4e4] px-3 pr-8 text-xs outline-none transition focus:border-[#ff5b21]"
      />
      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9b9b9b] cursor-pointer"
        aria-label={`Toggle ${placeholder}`}
      >
        {isVisible ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

export default function Header({ onMenuToggle }) {
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const userMenuRef = useRef(null);

  const capitalize = (str = "") =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  const [profile, setProfile] = useState({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "",
  });

  const [formProfile, setFormProfile] = useState(profile);

  // Change password states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const loadUser = () => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            setProfile({
              id: user.id || "",
              firstName: user.first_name || "",
              lastName: user.last_name || "",
              email: user.email || "",
              role: user.perm_user ? "Admin" : "User",
            });
          } catch (e) {
            console.error(e);
          }
        } else {
          setProfile({
            id: "",
            firstName: "debbie",
            lastName: "walkar",
            email: "debbie.baker@example.com",
            role: "Admin",
          });
        }
      };

      loadUser();

      window.addEventListener("auth_login", loadUser);
      return () => {
        window.removeEventListener("auth_login", loadUser);
      };
    }
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
        setActiveModal(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    const handlePointerDownOutside = (event) => {
      const target = event.target;
      if (!userMenuRef.current?.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleScroll = (event) => {
      if (userMenuRef.current && userMenuRef.current.contains(event.target)) {
        return;
      }
      setIsUserMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDownOutside);
    document.addEventListener("touchstart", handlePointerDownOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside);
      document.removeEventListener("touchstart", handlePointerDownOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isUserMenuOpen]);

  const openModal = (modal) => {
    setIsUserMenuOpen(false);
    if (modal === "profile") {
      setFormProfile({ ...profile });
    } else if (modal === "password") {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setActiveModal(modal);
  };

  const toggleUserMenu = (event) => {
    event.stopPropagation();
    setIsUserMenuOpen((current) => !current);
  };

  const handleMenuItemClick = (modal) => {
    openModal(modal);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profile.id) {
      toast.error("User ID is missing.");
      return;
    }
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    try {
      const user = JSON.parse(storedUser);
      const updatedData = {
        ...user,
        first_name: formProfile.firstName,
        last_name: formProfile.lastName,
        email: formProfile.email,
      };

      const response = await updateTraineeUser(profile.id, {
        first_name: formProfile.firstName,
        last_name: formProfile.lastName,
        email: formProfile.email,
        role: user.role,
        status: user.status,
        perm_dashboard: user.perm_dashboard,
        perm_trainees: user.perm_trainees,
        perm_transaction: user.perm_transaction,
        perm_program: user.perm_program,
        perm_user: user.perm_user,
      });

      if (response.success) {
        toast.success("Profile updated successfully!");
        setProfile({
          ...profile,
          firstName: formProfile.firstName,
          lastName: formProfile.lastName,
          email: formProfile.email,
        });
        localStorage.setItem("user", JSON.stringify(updatedData));
        window.dispatchEvent(new Event("auth_login"));
        setActiveModal(null);
      } else {
        toast.error(response.message || "Failed to update profile.");
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "An error occurred while updating profile."));
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword) {
      toast.error("Old password is required");
      return;
    }
    if (!newPassword) {
      toast.error("New password is required");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await changePasswordUser({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (response.success) {
        toast.success("Password changed successfully!");
        setActiveModal(null);
      } else {
        toast.error(response.message || "Failed to change password.");
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "An error occurred while changing password."));
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      setActiveModal(null);
      window.dispatchEvent(new Event("auth_logout"));
      router.replace("/");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-zinc-800 bg-[#08090c] px-4 text-white md:px-6 select-none">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111214] border border-zinc-800 text-zinc-300 hover:bg-zinc-800 focus:outline-none md:hidden cursor-pointer"
            aria-label="Open sidebar"
          >
            <MobilemenuIcon className="h-5 w-5" />
          </button>

          <span className="block text-[15px] font-bold tracking-wide text-white md:text-[18px]">
            Ignited code art
          </span>
        </div>

        <div ref={userMenuRef} className="relative z-50">
          <button
            type="button"
            onClick={toggleUserMenu}
            className="flex items-center gap-1.5 rounded-lg p-1.5 transition hover:bg-zinc-800 cursor-pointer"
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-indigo-400 text-[10px] font-semibold text-white">
              {profile.firstName
                ? profile.firstName.charAt(0).toUpperCase()
                : "A"}
            </div>
            <div className="hidden tracking-[0.03em] md:flex flex-col text-left leading-tight">
              <span className="text-[11px] font-medium text-zinc-100">
                {capitalize(profile.firstName)} {capitalize(profile.lastName)}
              </span>
              <span className="text-[9px] font-medium tracking-wide text-white">
                {profile.role}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-white mb-[5px]" />
          </button>

          {isUserMenuOpen && (
            <div
              className="absolute right-0 top-[calc(100%+8px)] z-[100] w-[230px] max-w-[calc(100vw-16px)] origin-top-right rounded-2xl border border-gray-100 bg-white p-2 text-[#1a1a1a] shadow-[0_10px_35px_rgba(0,0,0,0.14)] animate-in fade-in slide-in-from-top-2 duration-150"
              role="menu"
            >
              <button
                type="button"
                onClick={() => handleMenuItemClick("profile")}
                className="flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-[#1f1f1f] transition hover:bg-[#ff5b21] hover:text-white focus-visible:bg-[#ff5b21] focus-visible:text-white cursor-pointer"
              >
                <UserCircle2 className="h-4.5 w-4.5" />
                Profile
              </button>

              <button
                type="button"
                onClick={() => handleMenuItemClick("password")}
                className="mt-0.5 flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-[#1f1f1f] transition hover:bg-[#ff5b21] hover:text-white focus-visible:bg-[#ff5b21] focus-visible:text-white cursor-pointer"
              >
                <Lock className="h-4.5 w-4.5" />
                Change Password
              </button>

              <div className="my-1.5 h-px bg-gray-100" />

              <button
                type="button"
                onClick={() => handleMenuItemClick("logout")}
                className="flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-[#ff4b4b] transition hover:bg-[#ff5b21] hover:text-white focus-visible:bg-[#ff5b21] focus-visible:text-white cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {activeModal === "profile" && (
        <ModalShell
          onClose={() => setActiveModal(null)}
          maxWidthClass="max-w-[380px]"
        >
          <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-[#262626]">Profile</h2>
              <p className="mt-1 text-sm text-[#9b9b9b]">
                Update your profile details
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="text"
                value={formProfile.firstName}
                onChange={(e) =>
                  setFormProfile((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                placeholder="First Name"
                className="h-10 rounded-lg border border-[#e3e3e3] px-3 text-sm outline-none transition focus:border-[#ff5b21]"
              />
              <input
                type="text"
                value={formProfile.lastName}
                onChange={(e) =>
                  setFormProfile((prev) => ({
                    ...prev,
                    lastName: e.target.value,
                  }))
                }
                placeholder="Last Name"
                className="h-10 rounded-lg border border-[#e3e3e3] px-3 text-sm outline-none transition focus:border-[#ff5b21]"
              />
            </div>

            <input
              type="email"
              value={formProfile.email}
              onChange={(e) =>
                setFormProfile((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="Email Address"
              className="h-10 w-full rounded-lg border border-[#e3e3e3] px-3 text-sm outline-none transition focus:border-[#ff5b21]"
            />

            <input
              type="text"
              value={formProfile.role}
              readOnly
              placeholder="Role"
              className="h-10 w-full rounded-lg border border-[#e3e3e3] bg-[#fafafa] px-3 text-sm outline-none cursor-not-allowed"
            />

            <button
              type="submit"
              className="h-11 w-full rounded-xl bg-[#ff5b21] text-sm font-medium text-white transition hover:bg-[#ec4f16] cursor-pointer"
            >
              Update
            </button>
          </form>
        </ModalShell>
      )}

      {activeModal === "password" && (
        <ModalShell
          onClose={() => setActiveModal(null)}
          maxWidthClass="max-w-[300px]"
        >
          <form onSubmit={handleUpdatePassword} className="space-y-3.5 pt-2">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-[#252525]">
                Change Password
              </h2>
              <p className="mt-1 text-[11px] text-[#9a9a9a]">
                Enter a new password, not less than 8 characters.
              </p>
            </div>

            <div className="space-y-2">
              <PasswordInput
                placeholder="Old Password"
                value={oldPassword}
                onChange={setOldPassword}
                required
              />
              <PasswordInput
                placeholder="New Password"
                value={newPassword}
                onChange={setNewPassword}
                required
              />
              <PasswordInput
                placeholder="Re-enter New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                required
              />
            </div>

            <button
              type="submit"
              className="h-9 w-full rounded-md bg-[#ff5b21] text-xs font-medium text-white transition hover:bg-[#ec4f16] cursor-pointer"
            >
              Update
            </button>
          </form>
        </ModalShell>
      )}

      {activeModal === "logout" && (
        <ModalShell
          onClose={() => setActiveModal(null)}
          maxWidthClass="max-w-[300px]"
        >
          <div className="space-y-4 pt-4 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#ff4b4b] text-white">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[#262626]">Logout</h2>
              <p className="mt-1 text-xs text-[#8e8e8e]">
                Are you sure you want to logout this account?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="h-9 rounded-md border border-[#cbcbcb] text-xs font-medium text-[#333] transition hover:bg-[#f5f5f5] cursor-pointer"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="h-9 rounded-md bg-[#ff4b4b] text-xs font-medium text-white transition hover:bg-[#f03e3e] cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </>
  );
}
