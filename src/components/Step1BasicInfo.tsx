"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, GripVertical, Plus, Trash2, Check, Loader2 } from "lucide-react";
import type { Qualification, TraineeFormData } from "./types";
import { AddQualificationModal, EditQualificationModal } from "./training/TraineeActions";
import { indiaStateOptions } from "./options/IndiaLocationOptions";
import { getTraineeByEmail } from "@/lib/api/get";
import { toast } from "react-toastify";

interface Step1Props {
  formData: TraineeFormData;
  updateFormData: (fields: Partial<TraineeFormData>) => void;
  onNext: () => void;
}

interface FloatingFieldProps {
  error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  maxLength?: number;
  name: string;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  value: string;
  loading?: boolean;
}

interface SelectFieldProps {
  error?: string;
  name: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  value: string;
}

const fieldBorder = (error?: string) =>
  error
    ? "border-red-400 focus-within:border-red-500"
    : "border-[#dedede] focus-within:border-[#ff5b21]";

function FloatingField({
  error,
  inputMode,
  label,
  maxLength,
  name,
  onBlur,
  onChange,
  type = "text",
  value,
  loading = false,
}: FloatingFieldProps) {
  return (
    <div className="min-w-0">
      <div
        className={`relative h-12 rounded-xl border bg-white transition-colors ${fieldBorder(error)}`}
      >
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder=" "
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`peer h-full w-full rounded-xl bg-transparent px-4 pb-1 pt-4 text-sm text-[#252525] outline-none ${loading ? "pr-10" : ""}`}
        />
        <label
          htmlFor={name}
          className="pointer-events-none absolute left-4 top-2 origin-left text-[10px] leading-none text-[#a3a3a3] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[10px]"
        >
          {label}
        </label>
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            <Loader2 className="h-4 w-4 animate-spin text-[#ff5b21]" />
          </div>
        )}
      </div>
      {error && (
        <p id={`${name}-error`} className="mt-1 text-[10px] leading-tight text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

function SelectField({
  error,
  name,
  onChange,
  options,
  placeholder,
  value,
}: SelectFieldProps) {
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

  return (
    <div className="min-w-0 relative select-none" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`relative h-12 rounded-xl border bg-white flex items-center justify-between px-4 cursor-pointer transition ${
          isOpen ? "border-[#ff5b21] ring-2 ring-[#ff5b21]/15" : fieldBorder(error)
        }`}
      >
        <span className={`text-sm ${value ? "text-[#252525] font-medium" : "text-[#9d9d9d]"}`}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[#8d8d8d] transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#ff5b21]" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12)] max-h-56 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
          {options.map((option) => {
            const isSelected = value === option;
            return (
              <div
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                  isSelected
                    ? "bg-[#fff7f4] text-[#ff5b21]"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span>{option}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#ff5b21]" />}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p id={`${name}-error`} className="mt-1 text-[10px] leading-tight text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-gray-800">{children}</h2>;
}

export default function Step1BasicInfo({ formData, updateFormData, onNext }: Step1Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAddQualModalOpen, setIsAddQualModalOpen] = useState(false);
  const [editingQualification, setEditingQualification] = useState<Qualification | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const lastFetchedEmailRef = useRef("");

  const handleEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const emailValue = e.target.value.trim();

    if (!emailValue) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      return;
    }

    if (emailValue.toLowerCase() === lastFetchedEmailRef.current.toLowerCase()) {
      return;
    }

    lastFetchedEmailRef.current = emailValue;
    setLoadingEmail(true);

    try {
      const response = await getTraineeByEmail(emailValue);
      if (response.success && response.data) {
        const t = response.data as any;

        // Auto populate all fields
        const updatedFields: Partial<TraineeFormData> = {
          firstName: t.first_name || "",
          lastName: t.last_name || "",
          phone: t.phone || "",
          gender: t.gender || "",
          addressFlat: t.flat_house_number || "",
          addressStreet: t.street_address || "",
          addressCity: t.city || "",
          addressState: t.state || "",
          addressPinCode: t.pin_code || "",
          emergencyFirstName: t.emergency_contact?.first_name || "",
          emergencyLastName: t.emergency_contact?.last_name || "",
          emergencyRelationship: t.emergency_contact?.relationship || "",
          emergencyPhone: t.emergency_contact?.phone || "",
          remark: t.remark || "",
        };

        if (t.qualifications && t.qualifications.length > 0) {
          updatedFields.qualifications = t.qualifications.map((q: any) => {
            const startFormatted = q.start_date ? (q.start_date.includes("-") ? new Date(q.start_date + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" }) : q.start_date) : "";
            const endFormatted = q.completion_date === "Present" ? "Present" : q.completion_date ? (q.completion_date.includes("-") ? new Date(q.completion_date + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" }) : q.completion_date) : "";
            const durationStr = startFormatted && endFormatted ? `${startFormatted} - ${endFormatted}` : (startFormatted || endFormatted || "");

            return {
              id: q.id || String(Math.random()),
              degree: q.qualification || q.degree || "",
              college: q.institution_name || q.college || "",
              duration: durationStr,
            };
          });
        }

        // Program & Fees fields if available
        if (t.program_id) {
          updatedFields.program = t.program?.title || t.program?.name || "";
          updatedFields.duration = t.program?.duration || "";
        }
        if (t.total_fees !== undefined && t.total_fees !== null) updatedFields.totalFees = String(t.total_fees);
        if (t.scholarship_discount !== undefined && t.scholarship_discount !== null) updatedFields.discount = String(t.scholarship_discount);
        if (t.payable_amount !== undefined && t.payable_amount !== null) updatedFields.payableAmount = String(t.payable_amount);
        if (t.number_of_instalments !== undefined && t.number_of_instalments !== null) updatedFields.installments = String(t.number_of_instalments);
        if (t.registration_fee_amount !== undefined && t.registration_fee_amount !== null) updatedFields.regFeeAmount = String(t.registration_fee_amount);
        if (t.payment_mode) updatedFields.regFeeMode = t.payment_mode;
        if (t.transaction_id) updatedFields.regFeeTransactionId = t.transaction_id;
        if (t.payment_date) updatedFields.regFeePaymentDate = t.payment_date;

        updateFormData(updatedFields);

        // Clear field validation errors for populated fields
        setErrors((prev) => {
          const next = { ...prev };
          Object.keys(updatedFields).forEach((key) => {
            delete next[key];
          });
          return next;
        });
      }
    } catch (err: any) {
      const status = err.response?.status;
      const errorMsg = err.response?.data?.message || err.message || "";
      const isNotFound = status === 404 || errorMsg.toLowerCase().includes("not found");
      if (!isNotFound) {
        console.error("Auto-fetch error:", err);
        toast.error(errorMsg || "Failed to fetch trainee details.");
      }
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleSaveEditQualification = (updated: { degree: string; college: string; sessionStart: string; sessionEnd: string }) => {
    if (editingQualification) {
      const startFormatted = updated.sessionStart ? (updated.sessionStart.includes("-") ? new Date(updated.sessionStart + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" }) : updated.sessionStart) : "";
      const endFormatted = updated.sessionEnd === "Present" ? "Present" : updated.sessionEnd ? (updated.sessionEnd.includes("-") ? new Date(updated.sessionEnd + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" }) : updated.sessionEnd) : "";
      const durationStr = startFormatted && endFormatted ? `${startFormatted} - ${endFormatted}` : (startFormatted || endFormatted || "");

      updateFormData({
        qualifications: formData.qualifications.map((q) =>
          q.id === editingQualification.id ? { ...q, degree: updated.degree, college: updated.college, duration: durationStr } : q
        )
      });
      setEditingQualification(null);
    }
  };

  const clearError = (field: string) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const updateField = <K extends keyof TraineeFormData>(field: K, value: TraineeFormData[K]) => {
    updateFormData({ [field]: value } as Pick<TraineeFormData, K>);
    clearError(field);
  };

  const getPhoneValidationError = (value: string, label: string) => {
    const normalized = value.trim();
    if (!normalized) return `${label} is required`;
    if (/^\+?91/.test(normalized)) return `${label} must be 10 digits without +91`;
    if (!/^\d+$/.test(normalized)) return "Only numbers are allowed";
    if (normalized.length !== 10) return `${label} must be exactly 10 digits`;
    if (normalized.startsWith("0")) return `${label} cannot start with 0`;
    if (!/^[6-9]/.test(normalized)) return `${label} must start with 6, 7, 8, or 9`;
    if (/^(\d)\1{9}$/.test(normalized)) return "Please enter a valid phone number";
    return "";
  };

  const handlePhoneInputChange = (field: "phone" | "emergencyPhone", rawValue: string) => {
    let digitsOnly = rawValue.replace(/\D/g, "");
    if (digitsOnly.startsWith("91") && digitsOnly.length > 10) {
      digitsOnly = digitsOnly.slice(2);
    }
    const val = digitsOnly.slice(0, 10);
    updateField(field, val);

    const label = field === "phone" ? "Phone number" : "Emergency phone number";
    if (val.startsWith("0")) {
      setErrors((prev) => ({ ...prev, [field]: `${label} cannot start with 0` }));
    } else if (val.length === 10) {
      const err = getPhoneValidationError(val, label);
      setErrors((prev) => {
        const next = { ...prev };
        if (err) next[field] = err;
        else delete next[field];
        return next;
      });
    }
  };

  const handlePhoneBlur = (field: "phone" | "emergencyPhone", label: string, value: string) => {
    const validationError = getPhoneValidationError(value, label);
    setErrors((current) => {
      const nextErrors = { ...current };
      if (validationError) nextErrors[field] = validationError;
      else delete nextErrors[field];
      return nextErrors;
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) {
      nextErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length > 30) {
      nextErrors.firstName = "First name cannot exceed 30 characters";
    }

    if (!formData.lastName.trim()) {
      nextErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length > 30) {
      nextErrors.lastName = "Last name cannot exceed 30 characters";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (formData.email.trim().length > 60) {
      nextErrors.email = "Email cannot exceed 60 characters";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = "Please enter a valid email address (e.g. name@domain.com)";
    }

    const phoneError = getPhoneValidationError(formData.phone, "Phone number");
    if (phoneError) nextErrors.phone = phoneError;
    if (!formData.gender) nextErrors.gender = "Gender selection is required";
    if (!formData.addressFlat.trim()) nextErrors.addressFlat = "Flat/House number is required";
    if (!formData.addressStreet.trim()) nextErrors.addressStreet = "Street address is required";
    if (!formData.addressCity.trim()) nextErrors.addressCity = "City is required";
    if (!formData.addressState) nextErrors.addressState = "State selection is required";
    if (!formData.addressPinCode) nextErrors.addressPinCode = "Pin code is required";
    else if (!/^\d{6}$/.test(formData.addressPinCode)) {
      nextErrors.addressPinCode = "Pin code must be exactly 6 digits";
    }
    if (!formData.emergencyFirstName.trim()) {
      nextErrors.emergencyFirstName = "First name is required";
    } else if (formData.emergencyFirstName.trim().length > 30) {
      nextErrors.emergencyFirstName = "First name cannot exceed 30 characters";
    }

    if (!formData.emergencyLastName.trim()) {
      nextErrors.emergencyLastName = "Last name is required";
    } else if (formData.emergencyLastName.trim().length > 30) {
      nextErrors.emergencyLastName = "Last name cannot exceed 30 characters";
    }

    if (!formData.emergencyRelationship) {
      nextErrors.emergencyRelationship = "Relationship is required";
    }
    const emergencyPhoneError = getPhoneValidationError(
      formData.emergencyPhone,
      "Emergency phone number",
    );
    if (emergencyPhoneError) nextErrors.emergencyPhone = emergencyPhoneError;

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleNext = (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validate();
    const firstErrorKey = Object.keys(validationErrors)[0];

    if (!firstErrorKey) {
      onNext();
      return;
    }

    document.getElementsByName(firstErrorKey)[0]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

  };

  const handleAddQualification = () => {
    const newId = String(Date.now());
    updateFormData({
      qualifications: [
        ...formData.qualifications.filter((q) => q.degree.trim() || q.college.trim()),
        { id: newId, degree: "", college: "", duration: "" },
      ],
    });
  };

  const handleRemoveQualification = (id: string) => {
    updateFormData({
      qualifications: formData.qualifications.filter((qualification) => qualification.id !== id),
    });
  };

  const handleQualificationChange = (id: string, field: keyof Qualification, value: string) => {
    updateFormData({
      qualifications: formData.qualifications.map((qualification) =>
        qualification.id === id ? { ...qualification, [field]: value } : qualification,
      ),
    });
  };

  return (
    <form onSubmit={handleNext} className="mx-auto w-full max-w-[1000px] space-y-5 pb-5">
      <section className="space-y-2.5">
        <SectionTitle>Trainees Information</SectionTitle>
        <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
          <FloatingField
            name="firstName"
            label="First Name"
            maxLength={30}
            value={formData.firstName}
            onChange={(value) => updateField("firstName", value.slice(0, 30))}
            error={errors.firstName}
          />
          <FloatingField
            name="lastName"
            label="Last Name"
            maxLength={30}
            value={formData.lastName}
            onChange={(value) => updateField("lastName", value.slice(0, 30))}
            error={errors.lastName}
          />
        </div>
        <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-3">
          <FloatingField
            type="email"
            name="email"
            label="Email Address"
            maxLength={60}
            value={formData.email}
            onChange={(value) => updateField("email", value.slice(0, 60))}
            onBlur={handleEmailBlur}
            loading={loadingEmail}
            error={errors.email}
          />
          <FloatingField
            name="phone"
            label="Phone Number"
            value={formData.phone}
            onChange={(value) => handlePhoneInputChange("phone", value)}
            onBlur={(event) => handlePhoneBlur("phone", "Phone number", event.target.value)}
            inputMode="numeric"
            maxLength={10}
            error={errors.phone}
          />
          <SelectField
            name="gender"
            placeholder="--Select Gender--"
            value={formData.gender}
            onChange={(value) => updateField("gender", value)}
            options={["Male", "Female", "Other"]}
            error={errors.gender}
          />
        </div>
      </section>

      <section className="space-y-2.5">
        <SectionTitle>Address</SectionTitle>
        <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
          <FloatingField
            name="addressFlat"
            label="Flat / House number"
            maxLength={40}
            value={formData.addressFlat}
            onChange={(value) => updateField("addressFlat", value.slice(0, 40))}
            error={errors.addressFlat}
          />
          <FloatingField
            name="addressStreet"
            label="Street Address"
            maxLength={60}
            value={formData.addressStreet}
            onChange={(value) => updateField("addressStreet", value.slice(0, 60))}
            error={errors.addressStreet}
          />
        </div>
        <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-3">
          <FloatingField
            name="addressCity"
            label="City"
            maxLength={30}
            value={formData.addressCity}
            onChange={(value) => updateField("addressCity", value.slice(0, 30))}
            error={errors.addressCity}
          />
          <SelectField
            name="addressState"
            placeholder="--Select State--"
            value={formData.addressState}
            onChange={(value) => updateField("addressState", value)}
            options={indiaStateOptions}
            error={errors.addressState}
          />
          <FloatingField
            name="addressPinCode"
            label="Pin Code"
            value={formData.addressPinCode}
            onChange={(value) => updateField("addressPinCode", value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            maxLength={6}
            error={errors.addressPinCode}
          />
        </div>
      </section>

      <section className="space-y-2.5">
        <SectionTitle>Emergency Contact</SectionTitle>
        <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
          <FloatingField
            name="emergencyFirstName"
            label="First Name"
            maxLength={30}
            value={formData.emergencyFirstName}
            onChange={(value) => updateField("emergencyFirstName", value.slice(0, 30))}
            error={errors.emergencyFirstName}
          />
          <FloatingField
            name="emergencyLastName"
            label="Last Name"
            maxLength={30}
            value={formData.emergencyLastName}
            onChange={(value) => updateField("emergencyLastName", value.slice(0, 30))}
            error={errors.emergencyLastName}
          />
        </div>
        <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
          <SelectField
            name="emergencyRelationship"
            placeholder="--Select Relationship--"
            value={formData.emergencyRelationship}
            onChange={(value) => updateField("emergencyRelationship", value)}
            options={["Father", "Mother", "Brother", "Sister", "Spouse", "Other"]}
            error={errors.emergencyRelationship}
          />
          <FloatingField
            name="emergencyPhone"
            label="Phone Number"
            value={formData.emergencyPhone}
            onChange={(value) => handlePhoneInputChange("emergencyPhone", value)}
            onBlur={(event) =>
              handlePhoneBlur("emergencyPhone", "Emergency phone number", event.target.value)
            }
            inputMode="numeric"
            maxLength={10}
            error={errors.emergencyPhone}
          />
        </div>
      </section>

      <section className="space-y-2.5">
        <SectionTitle>Education Qualification</SectionTitle>
        <div className="space-y-2">
          {formData.qualifications.map((qualification) => (
            <div key={qualification.id} className="flex items-center gap-1.5">
              <GripVertical className="h-4 w-4 shrink-0 text-[#555]" aria-hidden="true" />
              <div
                onClick={() => setEditingQualification(qualification)}
                className="min-w-0 flex-1 rounded-xl border border-[#dedede] bg-white px-4 py-3 transition hover:border-[#ff5b21] cursor-pointer"
              >
                <div className="text-sm font-bold text-gray-800">
                  {qualification.degree || "Degree / Qualification"}
                </div>
                <div className="flex min-w-0 items-center gap-1 text-xs text-[#727272]">
                  <span className="truncate">{qualification.college || "College Name"}</span>
                  {qualification.duration && qualification.duration !== "-" && (
                    <>
                      <span aria-hidden="true" className="text-gray-400 font-semibold">·</span>
                      <span className="truncate">{qualification.duration}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveQualification(qualification.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[#ff4d4f] transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-400 cursor-pointer"
                aria-label="Remove qualification"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setIsAddQualModalOpen(true)}
            className="flex h-10 w-full items-center justify-center gap-1 rounded-xl border border-[#ff5b21] text-xs font-bold text-[#ff5b21] bg-white transition hover:bg-orange-50/50 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Qualification
          </button>
        </div>
      </section>

      <div className="flex justify-center items-center pt-4">
        <button
          type="submit"
          className="px-8 py-3.5 bg-[#FF5B21] text-white hover:bg-orange-600 rounded-xl font-bold shadow-md transition-all duration-200 w-36 text-center cursor-pointer"
        >
          Next
        </button>
      </div>

      <AddQualificationModal
        isOpen={isAddQualModalOpen}
        onClose={() => setIsAddQualModalOpen(false)}
        onAdd={(qual) => {
          const uniqueId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
          const startFormatted = qual.sessionStart ? (qual.sessionStart.includes("-") ? new Date(qual.sessionStart + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" }) : qual.sessionStart) : "";
          const endFormatted = qual.sessionEnd === "Present" ? "Present" : qual.sessionEnd ? (qual.sessionEnd.includes("-") ? new Date(qual.sessionEnd + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" }) : qual.sessionEnd) : "";
          const durationStr = startFormatted && endFormatted ? `${startFormatted} - ${endFormatted}` : (startFormatted || endFormatted || "");

          const existingValid = formData.qualifications.filter(
            (q) => q.degree.trim() !== "" || q.college.trim() !== "" || q.duration.trim() !== ""
          );
          updateFormData({
            qualifications: [
              ...existingValid,
              {
                id: uniqueId,
                degree: qual.degree || "",
                college: qual.college || "",
                duration: durationStr,
              },
            ],
          });
          setIsAddQualModalOpen(false);
        }}
      />
      <EditQualificationModal
        isOpen={editingQualification !== null}
        qualification={editingQualification as any}
        onClose={() => setEditingQualification(null)}
        onSave={handleSaveEditQualification}
      />
    </form>
  );
}

