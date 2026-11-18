"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { CalendarIcon } from "@/utils/svgicon";
import { PaymentTransaction } from "@/lib/api/types";
import {
  getPaymentReferenceCopy,
  paymentModeRequiresReference,
} from "@/lib/paymentReference";
import {
  getNextPendingPaymentSlot,
  getPaymentSlots,
  normalizePaymentSlotTitle,
  type PaymentSlotTitle,
} from "@/lib/paymentSchedule";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: {
    amount: string;
    mode: string;
    transactionId: string;
    date: string;
    title?: string;
  }) => Promise<boolean>;
  initialData?: PaymentTransaction | null;
  maxAllowedAmount?: number;
  paymentTitle?: PaymentSlotTitle | null;
  paidPaymentSlots?: PaymentSlotTitle[];
  numberOfInstallments?: number;
  hasBalance?: boolean;
}

const toYMD = (dateStr?: string | null): string => {
  if (!dateStr) return "";
  const trimmed = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (trimmed.includes("T")) return trimmed.split("T")[0];
  const cleaned = trimmed.replace(/\bSept\b/i, "Sep");
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return trimmed;
};

export function RecordPaymentModal({
  ...props
}: RecordPaymentModalProps) {
  if (!props.isOpen) return null;

  const modalKey = props.initialData
    ? `${props.initialData.id || props.initialData.title}-${props.initialData.date}-${props.initialData.transactionId}`
    : `new-${props.paymentTitle || "none"}`;

  return <RecordPaymentDialog key={modalKey} {...props} />;
}

function RecordPaymentDialog({
  onClose,
  onSave,
  initialData = null,
  maxAllowedAmount = 100000,
  paymentTitle = null,
  paidPaymentSlots = [],
  numberOfInstallments = 4,
  hasBalance = false,
}: RecordPaymentModalProps) {
  const nextPaymentTitle =
    paymentTitle ??
    getNextPendingPaymentSlot(paidPaymentSlots, numberOfInstallments, hasBalance);
  const initialMode = initialData?.mode || "";
  const [amount, setAmount] = useState(
    initialData ? String(initialData.amount ?? "").replace(/,/g, "") : "",
  );
  const [mode, setMode] = useState(initialMode);
  const [transactionId, setTransactionId] = useState(
    initialData && paymentModeRequiresReference(initialMode)
      ? initialData.transactionId || ""
      : "",
  );
  const initialDateYMD = toYMD(initialData?.date);
  const [paymentDate, setPaymentDate] = useState(initialDateYMD);
  const normalizedInitialTitle = initialData?.title
    ? (normalizePaymentSlotTitle(initialData.title) || initialData.title)
    : "";
  const [selectedPaymentTitle, setSelectedPaymentTitle] = useState<
    PaymentSlotTitle | string
  >(initialData ? normalizedInitialTitle : nextPaymentTitle || "");

  const effectiveTitle = selectedPaymentTitle || initialData?.title || "";
  const hasChanges =
    !initialData ||
    amount !== String(initialData.amount ?? "").replace(/,/g, "") ||
    mode !== (initialData.mode || "") ||
    transactionId !== (initialData.transactionId || "") ||
    toYMD(paymentDate) !== initialDateYMD ||
    (Boolean(initialData) && effectiveTitle !== (initialData?.title || ""));
  const [errorMessage, setErrorMessage] = useState("");
  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const paymentDropdownRef = useRef<HTMLDivElement | null>(null);
  const modeDropdownRef = useRef<HTMLDivElement | null>(null);

  const paymentModes = ["Cash", "Bank Transfer", "UPI"];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modeDropdownRef.current &&
        !modeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsModeDropdownOpen(false);
      }
      if (
        paymentDropdownRef.current &&
        !paymentDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPaymentDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDateLabel = (dateValue: string) => {
    if (!dateValue) return "Payment Date";
    const ymd = toYMD(dateValue);
    if (!ymd) return dateValue;
    const parts = ymd.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    }
    return dateValue;
  };

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
    if (typeof pickerInput.showPicker === "function") {
      pickerInput.showPicker();
      return;
    }
    input.focus();
    input.click();
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const paidSlots = new Set(paidPaymentSlots);
  if (initialData?.title) {
    const currentSlot = normalizePaymentSlotTitle(initialData.title);
    if (currentSlot) {
      paidSlots.delete(currentSlot);
    }
  }

  let paymentOptions = getPaymentSlots(numberOfInstallments).map((title) => ({
    title,
    label: paidSlots.has(title)
      ? `${title} (Paid)`
      : title === nextPaymentTitle
        ? `${title} (Next)`
        : `${title} (Upcoming)`,
    disabled: paidSlots.has(title),
  }));

  if (nextPaymentTitle === "Additional Payment") {
    paymentOptions = [
      ...paymentOptions,
      {
        title: "Additional Payment",
        label: "Additional Payment (Next)",
        disabled: false,
      },
    ];
  }

  if (
    selectedPaymentTitle &&
    !paymentOptions.some((o) => o.title === selectedPaymentTitle)
  ) {
    paymentOptions = [
      ...paymentOptions,
      {
        title: selectedPaymentTitle as any,
        label: `${selectedPaymentTitle}`,
        disabled: false,
      },
    ];
  }

  const selectedPaymentOption = paymentOptions.find(
    (option) => option.title === selectedPaymentTitle,
  );

  const handleSubmit = async () => {
    if (!initialData && !nextPaymentTitle) {
      setErrorMessage("No pending payment is available.");
      return;
    }

    if (!initialData && selectedPaymentTitle && paidSlots.has(selectedPaymentTitle as any)) {
      setErrorMessage(`${selectedPaymentTitle} is already paid.`);
      return;
    }

    const numAmount = Number(amount);
    if (!amount.trim() || Number.isNaN(numAmount) || numAmount < 1000) {
      setErrorMessage("Amount must be at least ₹1,000.");
      return;
    }

    if (maxAllowedAmount > 0 && numAmount > maxAllowedAmount) {
      setErrorMessage(
        `Amount cannot exceed ₹${maxAllowedAmount.toLocaleString("en-IN")}.`,
      );
      return;
    }

    if (!mode) {
      setErrorMessage("Please select mode of payment.");
      return;
    }

    const trimmedTxId = transactionId.trim();
    if (paymentModeRequiresReference(mode)) {
      if (!trimmedTxId) {
        setErrorMessage(`Please enter ${getPaymentReferenceCopy(mode).label}.`);
        return;
      }
      if (mode === "UPI") {
        if (!/^\d{12}$/.test(trimmedTxId)) {
          setErrorMessage("UPI Reference ID must be exactly 12 digits.");
          return;
        }
      } else if (mode === "Bank Transfer") {
        if (trimmedTxId.length < 6 || trimmedTxId.length > 25) {
          setErrorMessage("Bank Transaction Reference No. must be between 6 and 25 characters.");
          return;
        }
        if (!/^[A-Za-z0-9/-]+$/.test(trimmedTxId)) {
          setErrorMessage("Bank Transaction Reference No. can only contain letters, numbers, hyphens, and slashes.");
          return;
        }
        if (!/[A-Za-z0-9]/.test(trimmedTxId)) {
          setErrorMessage("Please enter a valid Bank Transaction Reference No.");
          return;
        }
      }
    }

    if (!paymentDate.trim()) {
      setErrorMessage("Please select Payment Date.");
      return;
    }

    if (paymentDate > todayStr) {
      setErrorMessage("Future dates cannot be selected for payment records.");
      return;
    }

    setIsSubmitting(true);
    const resolvedTitle = selectedPaymentTitle || (initialData ? initialData.title : nextPaymentTitle || undefined);

    const accepted = await onSave({
      amount: numAmount.toLocaleString(),
      mode,
      transactionId: paymentModeRequiresReference(mode)
        ? (mode === "Bank Transfer" ? trimmedTxId.toUpperCase() : trimmedTxId)
        : "",
      date: toYMD(paymentDate),
      title: resolvedTitle,
    });
    setIsSubmitting(false);
    if (accepted) onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <div className="relative w-full max-w-[420px] rounded-[24px] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#0c101d] text-white hover:opacity-90 cursor-pointer transition z-10"
          aria-label="Close record payment modal"
        >
          <X className="h-4 w-4 stroke-[3.2px]" />
        </button>

        <div className="text-center">
          <h3 className="text-2xl font-extrabold text-[#1f1f1f]">
            {initialData ? "Edit Payment" : "Record Payment"}
          </h3>
          <p className="mt-1 text-xs text-[#8c8c8c]">
            {initialData ? "Update the payment details" : "Add the payment Record"}
          </p>
        </div>

        <div className="mt-5 space-y-3.5">
          <div className="relative select-none" ref={paymentDropdownRef}>
            <button
              type="button"
              disabled={!nextPaymentTitle && !initialData}
              onClick={() => {
                setIsPaymentDropdownOpen((isOpen) => !isOpen);
                setIsModeDropdownOpen(false);
              }}
              aria-haspopup="listbox"
              aria-expanded={isPaymentDropdownOpen}
              className={`flex min-h-16 w-full items-center justify-between rounded-2xl border bg-white px-4 py-3 text-left transition ${
                isPaymentDropdownOpen
                  ? "border-[#ff5b21] ring-2 ring-[#ff5b21]/15"
                  : "border-[#dedede] hover:border-gray-400"
              } disabled:cursor-not-allowed disabled:bg-gray-50`}
            >
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#999999]">
                  Payment For
                </span>
                <span className="mt-0.5 block truncate text-sm font-bold text-[#1f1f1f]">
                  {selectedPaymentOption?.label || selectedPaymentTitle || "Select Payment"}
                </span>
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[#8c8c8c] transition-transform duration-200 ${
                  isPaymentDropdownOpen ? "rotate-180 text-[#ff5b21]" : ""
                }`}
              />
            </button>

            {isPaymentDropdownOpen && (
              <div
                role="listbox"
                aria-label="Payment for"
                className="absolute left-0 right-0 top-full z-[120] mt-1.5 max-h-52 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.16)] animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {paymentOptions.map((option) => {
                  const isSelected = option.title === selectedPaymentTitle;
                  return (
                    <button
                      key={option.title}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      onClick={() => {
                        setSelectedPaymentTitle(option.title);
                        setIsPaymentDropdownOpen(false);
                        setErrorMessage("");
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${
                        option.disabled
                          ? "cursor-not-allowed bg-gray-50 text-gray-400 opacity-70"
                          : isSelected
                            ? "cursor-pointer bg-[#fff7f4] text-[#ff5b21]"
                            : "cursor-pointer text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span>{option.label}</span>
                      {isSelected && !option.disabled && (
                        <Check className="h-3.5 w-3.5 text-[#ff5b21]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Amount (₹) */}
          <input
            type="number"
            min="1000"
            max={maxAllowedAmount}
            placeholder="Amount (₹)"
            value={amount}
            onKeyDown={(e) => {
              if (
                e.key === "." ||
                e.key === "-" ||
                e.key === "e" ||
                e.key === "E" ||
                e.key === "+"
              ) {
                e.preventDefault();
              }
            }}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 8);
              if (val === "") {
                setAmount("");
                setErrorMessage("");
                return;
              }
              const numVal = Number(val);
              if (!Number.isNaN(numVal)) {
                if (maxAllowedAmount > 0 && numVal > maxAllowedAmount) {
                  setErrorMessage(
                    `Amount cannot exceed ₹${maxAllowedAmount.toLocaleString("en-IN")}.`
                  );
                  return;
                }
                setAmount(val);
                setErrorMessage("");
              }
            }}
            className="h-12 w-full rounded-2xl border border-[#dedede] bg-white px-4 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff5b21] focus:ring-2 focus:ring-[#ff5b21]/15 placeholder:text-[#999999]"
          />

          {/* Mode of Payment Dropdown */}
          <div className="relative select-none" ref={modeDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsModeDropdownOpen(!isModeDropdownOpen);
                setIsPaymentDropdownOpen(false);
              }}
              className={`h-12 w-full flex items-center justify-between rounded-2xl border bg-white px-4 text-sm transition cursor-pointer ${
                isModeDropdownOpen
                  ? "border-[#ff5b21] ring-2 ring-[#ff5b21]/15 text-[#1f1f1f]"
                  : "border-[#dedede] text-gray-700 hover:border-gray-400"
              }`}
            >
              <span className={mode ? "text-[#1f1f1f] font-medium" : "text-[#999999]"}>
                {mode || "--Select mode of payment--"}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-[#8c8c8c] transition-transform duration-200 ${
                  isModeDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isModeDropdownOpen && (
              <div className="absolute left-0 right-0 top-[52px] z-50 rounded-2xl border border-[#dedede] bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                {paymentModes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      if (m !== mode) setTransactionId("");
                      setMode(m);
                      setIsModeDropdownOpen(false);
                      setErrorMessage("");
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      mode === m
                        ? "bg-[#ff5b21] text-white"
                        : "text-[#333333] hover:bg-[#f5f5f5]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Payment reference */}
          {paymentModeRequiresReference(mode) && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-150">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {getPaymentReferenceCopy(mode).label}
              </label>
              <input
                type="text"
                maxLength={mode === "UPI" ? 12 : 25}
                placeholder={
                  mode === "UPI"
                    ? "Enter 12-digit UPI Reference ID"
                    : getPaymentReferenceCopy(mode).placeholder
                }
                value={transactionId}
                onChange={(e) => {
                  let val = e.target.value;
                  if (mode === "UPI") {
                    val = val.replace(/\D/g, "").slice(0, 12);
                  } else if (mode === "Bank Transfer") {
                    val = val.toUpperCase().replace(/[^A-Z0-9/-]/g, "").slice(0, 25);
                  } else {
                    val = val.slice(0, 30);
                  }
                  setTransactionId(val);
                  setErrorMessage("");
                }}
                className="h-12 w-full rounded-2xl border border-[#dedede] bg-white px-4 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff5b21] focus:ring-2 focus:ring-[#ff5b21]/15 placeholder:text-[#999999]"
              />
            </div>
          )}

          {/* Payment Date */}
          <div className="relative">
            <button
              type="button"
              onClick={openDatePicker}
              className="flex h-12 w-full items-center justify-between rounded-2xl border border-[#dedede] bg-white px-4 text-left text-sm text-gray-700 outline-none transition hover:border-[#ff5b21] cursor-pointer"
            >
              <span className={paymentDate ? "text-[#1f1f1f] font-medium" : "text-[#999999]"}>
                {formatDateLabel(paymentDate)}
              </span>
              <CalendarIcon className="h-5 w-5 text-[#ff5b21]" />
            </button>
            <input
              ref={dateInputRef}
              type="date"
              max={todayStr}
              value={toYMD(paymentDate)}
              onChange={(e) => {
                const val = e.target.value;
                if (val > todayStr) {
                  setErrorMessage("Future dates cannot be selected for payment records.");
                  setPaymentDate("");
                  return;
                }
                setPaymentDate(val);
                setErrorMessage("");
              }}
              className="pointer-events-none absolute h-0 w-0 opacity-0"
              tabIndex={-1}
              aria-hidden
            />
          </div>

          {errorMessage && (
            <p className="text-xs font-semibold text-[#f43f5e] text-center pt-0.5">
              {errorMessage}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (!initialData && !nextPaymentTitle && !selectedPaymentTitle) ||
              (!!initialData && !hasChanges)
            }
            className="h-12 w-full rounded-2xl bg-[#ff5b21] text-sm font-bold text-white transition hover:bg-[#e04f1a] cursor-pointer shadow-sm mt-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:opacity-50"
          >
            {isSubmitting
              ? "Checking Payment..."
              : initialData
                ? "Save Changes"
                : "Add Record"}
          </button>
        </div>
      </div>
    </div>
  );
}

