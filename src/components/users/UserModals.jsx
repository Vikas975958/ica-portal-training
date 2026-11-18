"use client";

import React from "react";
import { Trash2 } from "lucide-react";
export function DeleteUserModal({
  isOpen,
  onClose,
  onConfirm,
  userName
}) {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop with blur */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal content */}
      <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200 z-10 border border-gray-100 flex flex-col items-center">
        {/* Red circle with trash can icon */}
        <div className="h-16 w-16 rounded-full bg-[#fef2f2] flex items-center justify-center text-[#ef4444] mb-5 border border-[#fee2e2] shadow-sm">
          <div className="h-12 w-12 rounded-full bg-[#ef4444] flex items-center justify-center text-white">
            <Trash2 className="h-5 w-5" />
          </div>
        </div>

        {/* Text Details */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">Delete User?</h3>
        <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[280px] mb-6">
          Are you sure you want to delete <span className="font-bold text-gray-800">{userName || "this user"}</span>? They will lose access to the Trainee Management System and will no longer be able to sign in.
        </p>

        {/* Buttons Action Group */}
        <div className="flex items-center gap-3 w-full">
          <button type="button" onClick={onClose} className="flex-1 py-3 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:border-gray-300 rounded-xl transition shadow-sm cursor-pointer hover:bg-gray-50 select-none text-center">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="flex-1 py-3 text-xs font-bold text-white bg-[#ef4444] hover:bg-[#dc2626] rounded-xl transition shadow-sm cursor-pointer select-none text-center">
            Delete
          </button>
        </div>
      </div>
    </div>;
}