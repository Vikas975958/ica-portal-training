"use client";

import { useState } from "react";
import { Plus, AlertCircle, Download } from "lucide-react";
import { DeleteIconsvg, EditIconsvg } from "@/utils/svgicon";
import type { PaymentTransaction } from "@/lib/api/types";
import type { PaymentSlotTitle } from "@/lib/paymentSchedule";

interface TransactionCardListProps {
  transactions: PaymentTransaction[];
  traineeName: string;
  onRecordPaymentClick: () => void;
  onEditTransaction: (transaction: PaymentTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onImportClick?: () => void;
  canRecordPayment: boolean;
  nextPaymentTitle: PaymentSlotTitle | null;
}

export function TransactionCardList({
  transactions,
  traineeName,
  onRecordPaymentClick,
  onEditTransaction,
  onDeleteTransaction,
  onImportClick,
  canRecordPayment,
  nextPaymentTitle,
}: TransactionCardListProps) {
  const [deleteConfirmTx, setDeleteConfirmTx] = useState<PaymentTransaction | null>(null);

  const handleConfirmDelete = () => {
    if (deleteConfirmTx) {
      onDeleteTransaction(deleteConfirmTx.id || "");
      setDeleteConfirmTx(null);
    }
  };
  const displayTransactions = transactions;

  return (
    <div className="space-y-4 select-none">
      {/* Header section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-[22px] font-extrabold text-[#1f1f1f]">
            Transaction History
          </h2>
          <p className="text-xs text-[#8c8c8c] mt-0.5">
            {transactions.length} payment(s) recorded for {traineeName}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
          <button
            type="button"
            onClick={onRecordPaymentClick}
            disabled={!canRecordPayment}
            title={
              canRecordPayment && nextPaymentTitle
                ? `Record ${nextPaymentTitle}`
                : "All fees are fully paid"
            }
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#ff5b21] px-4 text-xs font-semibold text-white transition hover:bg-[#e04f1a] cursor-pointer shadow-xs sm:w-auto disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
          >
            <Plus className="h-4 w-4" />
            {canRecordPayment ? "Record Payment" : "Fully Paid"}
          </button>
          <button
            type="button"
            onClick={onImportClick}
            disabled={!canRecordPayment}
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-[#dedede] bg-white px-4 text-xs font-semibold text-gray-800 transition hover:bg-gray-50 cursor-pointer shadow-xs sm:w-auto disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
          >
            <Download className="h-4 w-4 text-gray-800" />
            Import 
          </button>
        </div>
      </div>
      {/* Grid of Transaction Cards (3 per row) */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {displayTransactions.map((tx, idx) => (
          <div
            key={`${tx.transactionId}-${idx}`}
            className="rounded-2xl border border-[#eeeeee] bg-white p-4 shadow-2xs transition hover:border-[#dedede]"
          >
            {/* Card Top Row: Title + Action Icons */}
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-[#1f1f1f] truncate">
                {tx.title}
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onEditTransaction(tx)}
                  className="cursor-pointer border-0 bg-transparent p-0 outline-none transition hover:opacity-80"
                  title="Edit Transaction"
                >
                  <EditIconsvg className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTx(tx)}
                  className="cursor-pointer border-0 bg-transparent p-0 outline-none transition hover:opacity-80"
                  title="Delete Transaction"
                >
                  <DeleteIconsvg className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Card Amount */}
            <p className="mt-1 text-2xl font-extrabold text-[#1f1f1f]">
              ₹{Number.isFinite(Number(String(tx.amount).replace(/,/g, "")))
                ? Number(String(tx.amount).replace(/,/g, "")).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                : tx.amount}
            </p>

            {/* Divider */}
            <div className="my-3 border-t border-[#eeeeee]" />

            {/* 2-column Grid: Mode & Date */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="pr-2 border-r border-[#eeeeee]">
                <p className="text-xs text-[#8c8c8c]">Mode</p>
                <p className="font-bold text-[#1f1f1f] mt-0.5 truncate">{tx.mode}</p>
              </div>
              <div className="pl-1">
                <p className="text-xs text-[#8c8c8c]">Date</p>
                <p className="font-bold text-[#1f1f1f] mt-0.5 truncate">{tx.date}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="my-3 border-t border-[#eeeeee]" />

            {/* Full Width Row: Transaction ID */}
            <div>
              <p className="text-xs text-[#8c8c8c]">Transaction ID</p>
              <p className="font-bold text-[#1f1f1f] mt-0.5 truncate">{tx.transactionId}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[340px] rounded-[24px] bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 mb-4 animate-bounce">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Payment Record?</h3>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed px-1">
                Are you sure you want to delete <span className="font-bold text-gray-800">{deleteConfirmTx.title}</span> ({deleteConfirmTx.transactionId})? This action cannot be undone.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmTx(null)}
                className="h-10 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="h-10 rounded-xl bg-[#f43f5e] hover:bg-rose-600 text-xs font-semibold text-white cursor-pointer transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
