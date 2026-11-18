"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { CalendarIcon } from "@/utils/svgicon";
import {
  getPaymentReferenceCopy,
  paymentModeRequiresReference,
} from "@/lib/paymentReference";

function CustomFormSelect({
  value,
  onChange,
  options,
  placeholder,
  error,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative min-w-0 select-none" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 rounded-xl bg-white border transition-all flex items-center justify-between cursor-pointer ${
          isOpen
            ? "border-[#ff5b21] ring-2 ring-[#ff5b21]/15"
            : error
              ? "border-red-400 focus:border-red-500"
              : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <span
          className={`text-sm ${value ? "text-gray-800 font-medium" : "text-gray-400"}`}
        >
          {selectedOption ? selectedOption.label : value || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#ff5b21]" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12)] max-h-56 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
          {options.map((option) => {
            const isSelected = value === option.value;
            return (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                  isSelected
                    ? "bg-[#fff7f4] text-[#ff5b21]"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#ff5b21]" />}
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function Step2ProgramFees({
  formData,
  updateFormData,
  onBack,
  onSubmit,
  submitLabel = "Add",
  isSubmitting = false,
  programs = [],
}) {
  const [errors, setErrors] = useState({});
  const regDateRef = useRef(null);
  const paymentDateRef = useRef(null);

  const clearError = (field) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  useEffect(() => {
    const payableNum = Number(formData.payableAmount) || 0;
    const regNum = Number(formData.regFeeAmount) || 0;

    setErrors((prev) => {
      const next = { ...prev };
      if (payableNum === 0 && regNum > 0) {
        next.regFeeAmount =
          "No registration fee can be charged when payable amount is ₹0.";
      } else if (regNum > payableNum) {
        next.regFeeAmount = `Registration fee cannot be greater than the payable amount (₹${payableNum.toLocaleString()}).`;
      } else if (
        next.regFeeAmount?.includes("Registration fee cannot be greater") ||
        next.regFeeAmount?.includes("No registration fee can be charged")
      ) {
        delete next.regFeeAmount;
      }
      return next;
    });
  }, [formData.payableAmount, formData.regFeeAmount]);

  const openDatePicker = (ref) => {
    const input = ref.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.focus();
    input.click();
  };

  const formatDateLabel = (dateValue, placeholder) => {
    if (!dateValue) return placeholder;
    const parsed = new Date(`${dateValue}T00:00:00`);
    if (isNaN(parsed.getTime())) return dateValue;
    return parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.program) newErrors.program = "Program selection is required";
    if (!formData.dateOfRegistration)
      newErrors.dateOfRegistration = "Registration date is required";

    if (!formData.totalFees) {
      newErrors.totalFees = "Total fees is required";
    } else if (
      isNaN(Number(formData.totalFees)) ||
      Number(formData.totalFees) < 0
    ) {
      newErrors.totalFees = "Total fees must be a positive number";
    }

    if (
      formData.discount &&
      (isNaN(Number(formData.discount)) || Number(formData.discount) < 0)
    ) {
      newErrors.discount = "Discount must be a positive number";
    } else if (Number(formData.discount) > Number(formData.totalFees)) {
      newErrors.discount = "Discount cannot exceed total fees";
    }

    const payableNum = Number(formData.payableAmount) || 0;
    const regNum = Number(formData.regFeeAmount) || 0;

    if (formData.payableAmount === "" || formData.payableAmount === undefined) {
      newErrors.payableAmount = "Payable amount is required";
    } else if (isNaN(payableNum) || payableNum < 0) {
      newErrors.payableAmount = "Payable amount must be a positive number";
    } else if (payableNum > Number(formData.totalFees)) {
      newErrors.payableAmount = "Payable amount cannot exceed total fees";
    }

    const isFree = payableNum === 0;
    const isRegFeePaid = regNum > 0;
    if (!isFree && !isRegFeePaid && !formData.installments) {
      newErrors.installments = "Installments count is required";
    }

    if (payableNum === 0) {
      if (regNum > 0) {
        newErrors.regFeeAmount =
          "Registration fee cannot be charged when payable amount is ₹0.";
      }
    } else {
      if (regNum > payableNum) {
        newErrors.regFeeAmount = `Registration fee cannot be greater than the payable amount (₹${payableNum.toLocaleString()}).`;
      }
      if (regNum > 0) {
        if (!formData.regFeeMode) {
          newErrors.regFeeMode = "Payment mode is required";
        }
        if (
          paymentModeRequiresReference(formData.regFeeMode) &&
          !formData.regFeeTransactionId.trim()
        ) {
          newErrors.regFeeTransactionId = `${getPaymentReferenceCopy(formData.regFeeMode).label} is required`;
        }
        if (!formData.regFeePaymentDate) {
          newErrors.regFeePaymentDate = "Payment date is required";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (validate()) {
      onSubmit();
    } else {
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        const element = document.getElementsByName(firstErrorKey)[0];
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const programFeeMap = React.useMemo(() => {
    const feeMap = {
      "Generative AI with LLM": "35000",
      "Python with AI": "35000",
      "Python with Data Science": "35000",
      "Full Stack Development": "35000",
      "Python with Django / Flask": "35000",
      "Data Analytics with Database": "35000",
    };
    programs.forEach((p) => {
      feeMap[p.title] = String(p.fees);
    });
    return feeMap;
  }, [programs]);

  const programOptions = React.useMemo(() => {
    if (programs && programs.length > 0) {
      return programs
        .filter((p) => p.status === "active" || p.title === formData.program)
        .map((p) => ({ value: p.title, label: p.title }));
    }
    return [
      { value: "Generative AI with LLM", label: "Generative AI with LLM" },
      { value: "Python with AI", label: "Python with AI" },
      { value: "Python with Data Science", label: "Python with Data Science" },
      { value: "Full Stack Development", label: "Full Stack Development" },
      {
        value: "Python with Django / Flask",
        label: "Python with Django / Flask",
      },
      {
        value: "Data Analytics with Database",
        label: "Data Analytics with Database",
      },
    ];
  }, [programs, formData.program]);

  const handleProgramSelect = (selectedProg) => {
    const fee = programFeeMap[selectedProg] || "35000";
    const discountVal = Number(formData.discount) || 0;
    const payable = Math.max(0, Number(fee) - discountVal).toString();
    const payableVal = Number(payable) || 0;

    const updates = {
      program: selectedProg,
      totalFees: fee,
      payableAmount: payable,
    };

    if (payableVal === 0) {
      updates.regFeeAmount = "0";
      updates.installments = "";
      updates.regFeeMode = "";
      updates.regFeePaymentDate = "";
      updates.regFeeTransactionId = "";
    } else if (Number(formData.regFeeAmount) > payableVal) {
      updates.regFeeAmount = payableVal.toString();
    }

    updateFormData(updates);
    clearError("program");
    clearError("totalFees");
    clearError("payableAmount");
    clearError("regFeeAmount");
    clearError("installments");
  };

  const handleDiscountChange = (discountStr) => {
    if (discountStr !== "" && !/^\d*\.?\d*$/.test(discountStr)) {
      return;
    }
    const total = Number(formData.totalFees) || 0;
    let discountVal = Number(discountStr) || 0;
    if (discountVal > total) {
      discountStr = total.toString();
      discountVal = total;
    }
    const payable =
      total > 0 ? Math.max(0, total - discountVal).toString() : "";
    const payableVal = Number(payable) || 0;

    const updates = {
      discount: discountStr,
      payableAmount: payable,
    };

    if (payableVal === 0) {
      updates.regFeeAmount = "0";
      updates.installments = "";
      updates.regFeeMode = "";
      updates.regFeePaymentDate = "";
      updates.regFeeTransactionId = "";
    } else if (Number(formData.regFeeAmount) > payableVal) {
      updates.regFeeAmount = payableVal.toString();
    }

    updateFormData(updates);
    clearError("discount");
    clearError("payableAmount");
    clearError("regFeeAmount");
    clearError("installments");
  };

  const handleTotalFeesChange = (totalStr) => {
    if (totalStr !== "" && !/^\d*\.?\d*$/.test(totalStr)) {
      return;
    }
    const total = Number(totalStr) || 0;
    let discountStr = formData.discount || "";
    let discountVal = Number(discountStr) || 0;
    if (discountVal > total) {
      discountStr = total > 0 ? total.toString() : "";
      discountVal = total > 0 ? total : 0;
    }
    const payable =
      total > 0 ? Math.max(0, total - discountVal).toString() : "";
    const payableVal = Number(payable) || 0;

    const updates = {
      totalFees: totalStr,
      discount: discountStr,
      payableAmount: payable,
    };

    if (payableVal === 0) {
      updates.regFeeAmount = "0";
      updates.installments = "";
      updates.regFeeMode = "";
      updates.regFeePaymentDate = "";
      updates.regFeeTransactionId = "";
    } else if (Number(formData.regFeeAmount) > payableVal) {
      updates.regFeeAmount = payableVal.toString();
    }

    updateFormData(updates);
    clearError("totalFees");
    clearError("payableAmount");
    clearError("discount");
    clearError("regFeeAmount");
    clearError("installments");
  };

  const handlePaymentModeChange = (paymentMode) => {
    updateFormData({
      regFeeMode: paymentMode,
      regFeeTransactionId:
        paymentMode === formData.regFeeMode ? formData.regFeeTransactionId : "",
    });

    setErrors((current) => {
      if (!current.regFeeMode && !current.regFeeTransactionId) return current;
      const nextErrors = { ...current };
      delete nextErrors.regFeeMode;
      delete nextErrors.regFeeTransactionId;
      return nextErrors;
    });
  };

  const showPaymentReference = paymentModeRequiresReference(
    formData.regFeeMode,
  );
  const paymentReferenceCopy = getPaymentReferenceCopy(formData.regFeeMode);

  const installmentOptions = [
    { value: "1", label: "1 Installment" },
    { value: "2", label: "2 Installment" },
    { value: "3", label: "3 Installment" },
    { value: "4", label: "4 Installment" },
  ];

  const paymentModeOptions = [
    { value: "Cash", label: "Cash" },
    { value: "Bank Transfer", label: "Bank Transfer" },
    { value: "UPI", label: "UPI" },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-[1000px] space-y-8 pb-5"
    >
      {/* 1. Program Details */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Program Details</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomFormSelect
            value={formData.program}
            onChange={handleProgramSelect}
            options={programOptions}
            placeholder="--Select Program--"
            error={errors.program}
          />

          <div>
            <div className="relative">
              <button
                type="button"
                onClick={() => openDatePicker(regDateRef)}
                className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm transition-all cursor-pointer ${
                  errors.dateOfRegistration
                    ? "border-red-400"
                    : formData.dateOfRegistration
                      ? "border-[#ff5b21]"
                      : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span
                  className={
                    formData.dateOfRegistration
                      ? "text-gray-800 font-medium"
                      : "text-gray-400"
                  }
                >
                  {formatDateLabel(
                    formData.dateOfRegistration,
                    "Date of Registration",
                  )}
                </span>
                <CalendarIcon className="h-5 w-5 text-gray-400 shrink-0" />
              </button>
              <input
                ref={regDateRef}
                type="date"
                max={todayStr}
                name="dateOfRegistration"
                value={formData.dateOfRegistration}
                onChange={(e) => {
                  if (e.target.value > todayStr) return;
                  updateFormData({ dateOfRegistration: e.target.value });
                  clearError("dateOfRegistration");
                }}
                className="pointer-events-none absolute h-0 w-0 opacity-0"
                tabIndex={-1}
                aria-hidden
              />
            </div>
            {errors.dateOfRegistration && (
              <p className="mt-1 text-xs text-red-500">
                {errors.dateOfRegistration}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 2. Fees Details */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Fees Details</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              name="totalFees"
              placeholder="Total Fees"
              value={formData.totalFees}
              onChange={(e) => handleTotalFeesChange(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl bg-[#F1F1F1] border transition-all text-gray-800 placeholder-gray-400 focus:outline-none ${
                errors.totalFees
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-200 focus:border-orange-500"
              }`}
            />
            {errors.totalFees && (
              <p className="mt-1 text-xs text-red-500">{errors.totalFees}</p>
            )}
          </div>

          <div>
            <input
              type="text"
              name="discount"
              placeholder="Scholarship Discount"
              value={formData.discount}
              onChange={(e) => handleDiscountChange(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl bg-white border transition-all text-gray-800 placeholder-gray-400 focus:outline-none ${
                errors.discount
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-200 focus:border-orange-500"
              }`}
            />
            {errors.discount && (
              <p className="mt-1 text-xs text-red-500">{errors.discount}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <input
              type="text"
              name="payableAmount"
              placeholder="Payable Amount"
              value={formData.payableAmount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d*\.?\d*$/.test(val)) {
                  updateFormData({ payableAmount: val });
                  clearError("payableAmount");
                }
              }}
              className={`w-full px-4 py-3 rounded-xl bg-[#F1F1F1] border transition-all text-gray-800 placeholder-gray-400 focus:outline-none ${
                errors.payableAmount
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-200 focus:border-orange-500"
              }`}
            />
            {errors.payableAmount && (
              <p className="mt-1 text-xs text-red-500">
                {errors.payableAmount}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            {Number(formData.payableAmount) === 0 ? (
              <div className="w-full px-4 py-3 rounded-xl bg-[#F1F1F1] border border-gray-200 text-sm text-gray-500 flex items-center justify-between select-none">
                <span>No Installments Needed (Payable amount is ₹0)</span>
              </div>
            ) : (
              <CustomFormSelect
                value={formData.installments}
                onChange={(val) => {
                  updateFormData({ installments: val });
                  clearError("installments");
                }}
                options={installmentOptions}
                placeholder={
                  Number(formData.regFeeAmount) > 0
                    ? "-- Select Number of Instalments (Optional) --"
                    : "-- Select Number of Instalments --"
                }
                error={errors.installments}
              />
            )}
          </div>
        </div>
      </section>

      {/* 3. Registration Fee */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Registration Fee</h2>
        </div>

        {Number(formData.payableAmount) === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-[#F9F9F9] p-4 text-xs font-medium text-gray-500">
            No registration fee required since payable amount is ₹0.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input
                type="number"
                min="1000"
                max={formData.payableAmount || "10000000"}
                name="regFeeAmount"
                placeholder={`Amount (₹)`}
                value={formData.regFeeAmount}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e" || e.key === "E")
                    e.preventDefault();
                }}
                onChange={(e) => {
                  const val = e.target.value.slice(0, 8);
                  const pNum = Number(formData.payableAmount) || 0;
                  if (val === "" || Number(val) >= 0) {
                    updateFormData({ regFeeAmount: val });
                    if (Number(val) > pNum) {
                      setErrors((prev) => ({
                        ...prev,
                        regFeeAmount: `Registration fee cannot be greater than the payable amount (₹${pNum.toLocaleString()}).`,
                      }));
                    } else {
                      clearError("regFeeAmount");
                    }
                  }
                }}
                className={`w-full px-4 py-3 rounded-xl bg-white border transition-all text-gray-800 placeholder-gray-400 focus:outline-none ${
                  errors.regFeeAmount
                    ? "border-red-400 focus:border-red-500"
                    : "border-gray-200 focus:border-orange-500"
                }`}
              />
              {errors.regFeeAmount && (
                <p className="mt-1 text-xs text-red-500">{errors.regFeeAmount}</p>
              )}
            </div>

            <CustomFormSelect
              value={formData.regFeeMode}
              onChange={handlePaymentModeChange}
              options={paymentModeOptions}
              placeholder="Mode of Payment"
              error={errors.regFeeMode}
            />

            {showPaymentReference && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                <label
                  htmlFor="registration-payment-reference"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400"
                >
                  {paymentReferenceCopy.label}
                </label>
                <input
                  id="registration-payment-reference"
                  type="text"
                  maxLength={30}
                  name="regFeeTransactionId"
                  placeholder={paymentReferenceCopy.placeholder}
                  value={formData.regFeeTransactionId}
                  onChange={(e) => {
                    updateFormData({
                      regFeeTransactionId: e.target.value.slice(0, 30),
                    });
                    clearError("regFeeTransactionId");
                  }}
                  className={`w-full px-4 py-3 rounded-xl bg-white border transition-all text-gray-800 placeholder-gray-400 focus:outline-none ${
                    errors.regFeeTransactionId
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-200 focus:border-orange-500"
                  }`}
                />
                {errors.regFeeTransactionId && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.regFeeTransactionId}
                  </p>
                )}
              </div>
            )}

            <div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => openDatePicker(paymentDateRef)}
                  className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm transition-all cursor-pointer ${
                    errors.regFeePaymentDate
                      ? "border-red-400"
                      : formData.regFeePaymentDate
                        ? "border-[#ff5b21]"
                        : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span
                    className={
                      formData.regFeePaymentDate
                        ? "text-gray-800 font-medium"
                        : "text-gray-400"
                    }
                  >
                    {formatDateLabel(formData.regFeePaymentDate, "Payment Date")}
                  </span>
                  <CalendarIcon className="h-5 w-5 text-gray-400 shrink-0" />
                </button>
                <input
                  ref={paymentDateRef}
                  type="date"
                  max={todayStr}
                  name="regFeePaymentDate"
                  value={formData.regFeePaymentDate}
                  onChange={(e) => {
                    if (e.target.value > todayStr) return;
                    updateFormData({ regFeePaymentDate: e.target.value });
                    clearError("regFeePaymentDate");
                  }}
                  className="pointer-events-none absolute h-0 w-0 opacity-0"
                  tabIndex={-1}
                  aria-hidden
                />
              </div>
              {errors.regFeePaymentDate && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.regFeePaymentDate}
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 4. Remark */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Remark</h2>
        </div>

        <div>
          <textarea
            rows={4}
            placeholder="Write a Note"
            value={formData.remark}
            onChange={(e) => updateFormData({ remark: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-orange-500 transition-all text-gray-800 placeholder-gray-400 focus:outline-none"
          />
        </div>
      </section>

      {/* Navigation Buttons */}
      <div className="flex justify-center items-center gap-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-8 py-3.5 bg-white border border-[#dddddd] hover:bg-gray-50 text-gray-700 rounded-xl font-bold shadow-sm transition-all duration-200 cursor-pointer w-36 text-center"
        >
          Back
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3.5 bg-[#FF5B21] text-white hover:bg-orange-600 rounded-xl font-bold shadow-md transition-all duration-200 w-36 text-center disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
