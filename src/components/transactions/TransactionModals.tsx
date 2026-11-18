"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, ChevronDown, Check, MoveRight } from "lucide-react";
import { CalendarIcon } from "@/utils/svgicon";
import {
  getPaymentReferenceCopy,
  paymentModeRequiresReference,
} from "@/lib/paymentReference";
import {
  getNextPendingPaymentSlot,
  getPaymentSlots,
  type PaymentSlotTitle,
} from "@/lib/paymentSchedule";

export interface TraineeDropdownItem {
  id: string;
  name: string;
  balance: number;
  paidPaymentSlots: PaymentSlotTitle[];
  maxInstallments: number;
  traineeCode?: string;
}

interface ModalSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ModalCustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: ModalSelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

function renderOptionLabel(label: string) {
  const isFullyPaid = label.endsWith(" (Fully Paid)");
  const labelWithoutFullyPaid = isFullyPaid ? label.slice(0, -13) : label;

  const statusMatch = labelWithoutFullyPaid.match(/^(.*?)\s+\((Paid|Next|Upcoming)\)$/);
  if (statusMatch) {
    const title = statusMatch[1];
    const status = statusMatch[2];
    
    const statusColors = {
      Paid: "bg-green-50 text-green-700 border-green-100/50",
      Next: "bg-blue-50 text-blue-700 border-blue-100/50",
      Upcoming: "bg-gray-50 text-gray-500 border-gray-100",
    }[status] || "bg-gray-50 text-gray-500";

    return (
      <div className="flex items-center gap-1.5 text-[11px]">
        <span className="font-semibold text-[#252525]">{title}</span>
        <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-md border uppercase tracking-wide ${statusColors}`}>
          {status}
        </span>
        {isFullyPaid && (
          <span className="px-1.5 py-0.5 text-[8px] font-bold rounded-md bg-[#fff2ed] text-[#ff5b21] border border-[#ff5b21]/10">
            Fully Paid
          </span>
        )}
      </div>
    );
  }

  const codeMatch = labelWithoutFullyPaid.match(/^(.*?)\s+([A-Za-z0-9]+)$/);
  if (codeMatch) {
    const name = codeMatch[1];
    const code = codeMatch[2];
    return (
      <div className="flex items-center gap-1.5 text-[11px]">
        <span className="font-semibold text-[#252525]">{name}</span>
        <span className="px-1.5 py-0.5 text-[8px] font-bold rounded-md bg-[#fff2ed] text-[#ff5b21] border border-[#ff5b21]/10 uppercase tracking-wide">
          {code}
        </span>
        {isFullyPaid && (
          <span className="px-1.5 py-0.5 text-[8px] font-bold rounded-md bg-green-50 text-green-700 border border-green-100/50">
            Fully Paid
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      <span className="font-semibold text-[#252525]">{label}</span>
    </div>
  );
}

function ModalCustomSelect({
  value,
  onChange,
  options,
  placeholder = "-- Select --",
  disabled = false,
}: ModalCustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative min-w-0 select-none" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border rounded-xl pl-3.5 pr-3 py-2.5 text-xs bg-white transition ${
          disabled ? "cursor-not-allowed bg-gray-50" : "cursor-pointer"
        } ${
          isOpen
            ? "border-[#ff5b21] ring-2 ring-[#ff5b21]/15 text-gray-900"
            : "border-gray-200 text-gray-700 hover:border-gray-300"
        }`}
      >
        <span className={value ? "text-gray-900 font-medium" : "text-gray-400"}>
          {selectedOption ? renderOptionLabel(selectedOption.label) : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#ff5b21]" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12)] max-h-48 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
          {options.map((option) => {
            const isSelected = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => {
                  if (option.disabled) return;
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl transition ${
                  option.disabled
                    ? "cursor-not-allowed bg-gray-50 text-gray-400 opacity-70"
                    : isSelected
                      ? "cursor-pointer bg-[#fff7f4] text-[#ff5b21]"
                      : "cursor-pointer text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {renderOptionLabel(option.label)}
                {isSelected && !option.disabled && (
                  <Check className="h-3.5 w-3.5 text-[#ff5b21] shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (entry: {
    traineeId: string;
    traineeName: string;
    installment: string;
    amount: number;
    mode: string;
    transactionId: string;
    date: string;
  }) => Promise<boolean>;
  trainees: TraineeDropdownItem[];
}

export function AddEntryModal({ isOpen, onClose, onAdd, trainees }: AddEntryModalProps) {
  const [traineeId, setTraineeId] = useState("");
  const [installment, setInstallment] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("Cash");
  const [transactionId, setTransactionId] = useState("");
  const [date, setDate] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTraineeId("");
      setInstallment("");
      setAmount("");
      setMode("Cash");
      setTransactionId("");
      setDate("");
      setFieldErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split("T")[0];
  const selectedTrainee = trainees.find((trainee) => trainee.id === traineeId);
  const nextPaymentSlot = selectedTrainee
    ? getNextPendingPaymentSlot(
        selectedTrainee.paidPaymentSlots,
        selectedTrainee.maxInstallments,
        selectedTrainee.balance > 0,
      )
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!traineeId) {
      errors.traineeId = "Please select a trainee.";
    } else if (!selectedTrainee || selectedTrainee.balance <= 0) {
      errors.traineeId = "This trainee has already paid all fees.";
    }

    if (!installment) {
      errors.installment = "Please select an installment.";
    } else if (paidPaymentSlots.has(installment as any)) {
      errors.installment = `${installment} has already been paid.`;
    }

    const numAmount = Number(amount);
    if (!amount.trim() || Number.isNaN(numAmount) || numAmount < 1000) {
      errors.amount = "Amount must be at least ₹1,000.";
    } else if (numAmount > 10000000) {
      errors.amount = "Amount cannot exceed ₹1,00,00,000.";
    }

    if (
      !errors.amount &&
      selectedTrainee &&
      numAmount > selectedTrainee.balance
    ) {
      errors.amount = `Amount cannot exceed the remaining balance of Rs ${selectedTrainee.balance.toLocaleString("en-IN")}.`;
    }

    const trimmedTxId = transactionId.trim();
    if (paymentModeRequiresReference(mode)) {
      if (!trimmedTxId) {
        errors.transactionId = `${getPaymentReferenceCopy(mode).label} is required.`;
      } else if (mode === "UPI") {
        if (!/^\d{12}$/.test(trimmedTxId)) {
          errors.transactionId = "UPI Reference ID must be exactly 12 digits.";
        }
      } else if (mode === "Bank Transfer") {
        if (trimmedTxId.length < 6 || trimmedTxId.length > 25) {
          errors.transactionId = "Bank Transaction Reference No. must be between 6 and 25 characters.";
        } else if (!/^[A-Za-z0-9/-]+$/.test(trimmedTxId)) {
          errors.transactionId = "Bank Transaction Reference No. can only contain letters, numbers, hyphens, and slashes.";
        } else if (!/[A-Za-z0-9]/.test(trimmedTxId)) {
          errors.transactionId = "Please enter a valid Bank Transaction Reference No.";
        }
      }
    }

    if (!date) {
      errors.date = "Please select a payment date.";
    } else if (date > todayStr) {
      errors.date = "Future dates cannot be selected for payment records.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (!selectedTrainee) return;

    setFieldErrors({});
    setIsSubmitting(true);
    const accepted = await onAdd({
      traineeId,
      traineeName: selectedTrainee.name,
      installment,
      amount: numAmount,
      mode,
      transactionId: mode === "Bank Transfer" ? trimmedTxId.toUpperCase() : trimmedTxId,
      date,
    });
    setIsSubmitting(false);
    if (!accepted) return;

    // Reset Form
    setTraineeId("");
    setInstallment("");
    setAmount("");
    setMode("Cash");
    setTransactionId("");
    setDate("");
    onClose();
  };

  const traineeOptions = trainees.map((trainee) => {
    const displayName = trainee.traineeCode
      ? `${trainee.name} ${trainee.traineeCode}`
      : trainee.name;
    return {
      value: trainee.id,
      label:
        trainee.balance <= 0
          ? `${displayName} (Fully Paid)`
          : displayName,
      disabled: trainee.balance <= 0,
    };
  });

  const paidPaymentSlots = new Set(selectedTrainee?.paidPaymentSlots || []);
  let installmentOptions = selectedTrainee
    ? getPaymentSlots(selectedTrainee.maxInstallments).map((title) => ({
        value: title,
        label: paidPaymentSlots.has(title)
          ? `${title} (Paid)`
          : title === nextPaymentSlot
            ? `${title} (Next)`
            : `${title} (Upcoming)`,
        disabled: paidPaymentSlots.has(title),
      }))
    : [];

  if (selectedTrainee && nextPaymentSlot === "Additional Payment") {
    installmentOptions = [
      ...installmentOptions,
      {
        value: "Additional Payment",
        label: "Additional Payment (Next)",
        disabled: false,
      },
    ];
  }

  const paymentModeOptions = [
    { value: "Cash", label: "Cash" },
    { value: "Bank Transfer", label: "Bank Transfer" },
    { value: "UPI", label: "UPI" },
  ];

  const handlePaymentModeChange = (paymentMode: string) => {
    if (paymentMode !== mode) setTransactionId("");
    setMode(paymentMode);
    setFieldErrors((current) => {
      if (!current.transactionId) return current;
      const nextErrors = { ...current };
      delete nextErrors.transactionId;
      return nextErrors;
    });
  };

  const showPaymentReference = paymentModeRequiresReference(mode);
  const paymentReferenceCopy = getPaymentReferenceCopy(mode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.1)] w-full max-w-md animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#0c101d] text-white hover:opacity-90 cursor-pointer transition z-20"
        >
          <X className="h-4 w-4 stroke-[3.2px]" />
        </button>

        <div className="text-center mb-4 shrink-0 pr-6">
          <h3 className="text-lg font-bold text-gray-900">Add Entry</h3>
          <p className="text-xs text-gray-400 mt-0.5">Add the payment record</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto pr-1 no-scrollbar flex-1">
          {/* Trainee Selection */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Select Trainee
            </label>
            <ModalCustomSelect
              value={traineeId}
              onChange={(val) => {
                setTraineeId(val);
                const trainee = trainees.find((item) => item.id === val);
                setInstallment(
                  trainee
                    ? getNextPendingPaymentSlot(
                        trainee.paidPaymentSlots,
                        trainee.maxInstallments,
                        trainee.balance > 0,
                      ) || ""
                    : "",
                );
                if (fieldErrors.traineeId) setFieldErrors((prev) => ({ ...prev, traineeId: "" }));
              }}
              options={traineeOptions}
              placeholder="-- Select Trainee --"
            />
            {fieldErrors.traineeId && <p className="text-[10px] text-red-500 mt-1">{fieldErrors.traineeId}</p>}
          </div>

          {/* Installment selection */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Installment
            </label>
            <ModalCustomSelect
              value={installment}
              onChange={setInstallment}
              options={installmentOptions}
              placeholder="-- Select Installment --"
              disabled={!selectedTrainee || installmentOptions.length === 0}
            />
            {fieldErrors.installment && <p className="text-[10px] text-red-500 mt-1">{fieldErrors.installment}</p>}
          </div>

          {/* Amount and Payment Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                min="1000"
                max="10000000"
                placeholder="Amount"
                value={amount}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "." || e.key === "+") e.preventDefault();
                }}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                  if (val === "" || Number(val) >= 0) {
                    setAmount(val);
                    if (fieldErrors.amount) setFieldErrors((prev) => ({ ...prev, amount: "" }));
                  }
                }}
                className={`w-full border bg-white rounded-xl px-3.5 py-2.5 text-xs text-gray-700 outline-none transition ${
                  fieldErrors.amount ? "border-red-500 ring-1 ring-red-200" : "border-gray-200 focus:border-[#ff5b21]"
                }`}
              />
              {fieldErrors.amount && <p className="text-[10px] text-red-500 mt-1">{fieldErrors.amount}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Mode of Payment
              </label>
              <ModalCustomSelect
                value={mode}
                onChange={handlePaymentModeChange}
                options={paymentModeOptions}
                placeholder="Mode"
              />
            </div>
          </div>

          {/* Payment reference */}
          {showPaymentReference && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-150">
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                {paymentReferenceCopy.label}
              </label>
              <input
                type="text"
                maxLength={mode === "UPI" ? 12 : 25}
                placeholder={
                  mode === "UPI"
                    ? "Enter 12-digit UPI Reference ID"
                    : paymentReferenceCopy.placeholder
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
                  if (fieldErrors.transactionId) {
                    setFieldErrors((prev) => ({ ...prev, transactionId: "" }));
                  }
                }}
                className={`w-full border bg-white rounded-xl px-3.5 py-2.5 text-xs text-gray-700 outline-none transition ${
                  fieldErrors.transactionId ? "border-red-500 ring-1 ring-red-200" : "border-gray-200 focus:border-[#ff5b21]"
                }`}
              />
              {fieldErrors.transactionId && (
                <p className="text-[10px] text-red-500 mt-1">
                  {fieldErrors.transactionId}
                </p>
              )}
            </div>
          )}

          {/* Payment Date */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Payment Date
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("addentry-date-input") as HTMLInputElement & { showPicker?: () => void };
                  if (el) {
                    if (typeof el.showPicker === "function") { el.showPicker(); }
                    else { el.focus(); el.click(); }
                  }
                }}
                className={`w-full flex items-center justify-between border bg-white rounded-xl pl-3.5 pr-3 py-2.5 text-xs text-gray-700 cursor-pointer transition ${
                  fieldErrors.date ? "border-red-500 ring-1 ring-red-200" : "border-gray-200 hover:border-[#ff5b21]"
                }`}
              >
                <span className={date ? "text-gray-800 font-medium" : "text-gray-400"}>
                  {date
                    ? new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                    : "Payment Date"}
                </span>
                <CalendarIcon className="h-4 w-4 text-gray-400" />
              </button>
              <input
                id="addentry-date-input"
                type="date"
                max={todayStr}
                value={date}
                onChange={(e) => {
                  const val = e.target.value;
                  setDate(val);
                  if (fieldErrors.date) setFieldErrors((prev) => ({ ...prev, date: "" }));
                }}
                className="pointer-events-none absolute h-0 w-0 opacity-0"
                tabIndex={-1}
                aria-hidden
              />
            </div>
            {fieldErrors.date && <p className="text-[10px] text-red-500 mt-1">{fieldErrors.date}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#ff5b21] hover:bg-[#e04f1a] text-white font-bold py-2.5 rounded-xl cursor-pointer transition text-xs mt-4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Checking Payment..." : "Add Entry"}
          </button>
        </form>
      </div>
    </div>
  );
}

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  setStartDate: (s: string) => void;
  endDate: string;
  setEndDate: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  resultsCount: number;
  onClear: () => void;
}

export function MobileFilterDrawer({
  isOpen,
  onClose,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  statusFilter,
  setStatusFilter,
  resultsCount,
  onClear,
}: MobileFilterDrawerProps) {
  const startDateRef = React.useRef<HTMLInputElement | null>(null);
  const endDateRef = React.useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const el = ref.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!el) return;
    if (typeof el.showPicker === "function") { el.showPicker(); }
    else { el.focus(); el.click(); }
  };

  const fmtDate = (d: string) => {
    if (!d) return "";
    const p = new Date(`${d}T00:00:00`);
    return isNaN(p.getTime()) ? d : p.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="fixed inset-0 z-55 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/55 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative z-10 w-80 bg-white h-full flex flex-col p-6 shadow-2xl animate-in slide-in-from-right duration-300 select-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Filters</h3>
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-[#ff5b21] hover:text-[#e04f1a] font-semibold underline cursor-pointer transition"
          >
            Clear Filters
          </button>
        </div>

        {/* Scrollable Filters container */}
        <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar">
          {/* Section 1: Date of Registration */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 mb-2">
              Filters By Date of Registration
            </h4>
            <div className="flex items-center justify-between border border-[#e3e3e3] bg-white rounded-xl px-3.5 py-2.5 h-11 select-none">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <CalendarIcon className="h-4 w-4 text-[#ff5b21] shrink-0" />
                <button
                  type="button"
                  onClick={() => openPicker(startDateRef)}
                  className="text-xs text-left bg-transparent border-none p-0 focus:outline-none w-full cursor-pointer truncate"
                >
                  <span className={startDate ? "text-gray-900 font-medium" : "text-gray-400"}>
                    {fmtDate(startDate) || "Start Date"}
                  </span>
                </button>
                <input
                  ref={startDateRef}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pointer-events-none absolute h-0 w-0 opacity-0"
                  tabIndex={-1}
                  aria-hidden
                />
              </div>

              <MoveRight className="w-6 h-4 text-[#ff5b21] stroke-[2.5px] shrink-0 mx-1" />

              <div className="flex items-center justify-end flex-1 min-w-0 relative">
                <button
                  type="button"
                  onClick={() => openPicker(endDateRef)}
                  className="text-xs text-right bg-transparent border-none p-0 focus:outline-none w-full cursor-pointer truncate"
                >
                  <span className={endDate ? "text-gray-900 font-medium" : "text-gray-400"}>
                    {fmtDate(endDate) || "End Date"}
                  </span>
                </button>
                <input
                  ref={endDateRef}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pointer-events-none absolute h-0 w-0 opacity-0"
                  tabIndex={-1}
                  aria-hidden
                />
              </div>
            </div>
          </div>

          {/* Section 2: Status */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 mb-3">
              Status
            </h4>
            <div className="space-y-3.5">
              {[
                { label: "All", value: "" },
                { label: "Paid", value: "Paid" },
                { label: "Partially Paid", value: "Partially Paid" },
                { label: "Pending", value: "Pending" },
              ].map((item) => (
                <div
                  key={item.label}
                  onClick={() => setStatusFilter(item.value)}
                  className="flex items-center justify-between text-xs font-medium text-gray-800 cursor-pointer select-none py-0.5"
                >
                  <span>{item.label}</span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                      statusFilter === item.value
                        ? "border-[#ff5b21]"
                        : "border-gray-300"
                    }`}
                  >
                    {statusFilter === item.value && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5b21]" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA Actions */}
        <div className="border-t border-gray-100 pt-4 mt-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#ff5b21] hover:bg-[#e04f1a] text-white text-xs font-bold py-3 rounded-xl transition text-center cursor-pointer"
          >
            {resultsCount} results
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-xs text-gray-500 font-semibold hover:text-gray-900 cursor-pointer block mt-3.5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

