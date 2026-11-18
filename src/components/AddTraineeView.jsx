"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { getAllPrograms } from "@/api/get";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import StepIndicator from "@/components/StepIndicator";
import Step1BasicInfo from "@/components/Step1BasicInfo";
import Step2ProgramFees from "@/components/Step2ProgramFees";
import { createTrainee, createTransaction } from "@/api/post";
import { updateTrainee } from "@/api/put";
import { paymentModeRequiresReference } from "@/lib/paymentReference";
import { toast } from "react-toastify";

const baseInitialFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  gender: "",
  addressFlat: "",
  addressStreet: "",
  addressCity: "",
  addressState: "",
  addressPinCode: "",
  emergencyFirstName: "",
  emergencyLastName: "",
  emergencyRelationship: "",
  emergencyPhone: "",
  qualifications: [],
  program: "",
  duration: "",
  dateOfRegistration: "",
  totalFees: "",
  discount: "",
  payableAmount: "",
  installments: "",
  regFeeAmount: "",
  regFeeMode: "",
  regFeeTransactionId: "",
  regFeePaymentDate: "",
  remark: "",
};

const mergeInitialData = (initialData) => {
  if (!initialData) {
    return baseInitialFormData;
  }

  const mergedQualifications =
    initialData.qualifications && initialData.qualifications.length > 0
      ? initialData.qualifications
      : baseInitialFormData.qualifications;

  return {
    ...baseInitialFormData,
    ...initialData,
    qualifications: mergedQualifications,
  };
};

const mapFormDataToDto = (formData, programMap) => {
  const requiresPaymentReference = paymentModeRequiresReference(
    formData.regFeeMode,
  );
  const transactionId = (formData.regFeeTransactionId || "").trim();
  const payableAmount = Number(formData.payableAmount) || 0;
  const regFeeAmount = payableAmount === 0 ? 0 : (Number(formData.regFeeAmount) || 0);
  const installments = Number(formData.installments) || (payableAmount === 0 ? 0 : 1);

  return {
    first_name: formData.firstName,
    last_name: formData.lastName,
    email: formData.email,
    phone: formData.phone,
    gender: formData.gender || "Other",
    flat_house_number: formData.addressFlat,
    street_address: formData.addressStreet,
    city: formData.addressCity,
    state: formData.addressState,
    pin_code: formData.addressPinCode,
    emergency_contact: {
      first_name: formData.emergencyFirstName || "Emergency",
      last_name: formData.emergencyLastName || "Contact",
      relationship: formData.emergencyRelationship || "Parent",
      phone: formData.emergencyPhone || formData.phone,
    },
    qualifications: (formData.qualifications || []).map((q) => {
      const parts = (q.duration || "").split(" - ");
      return {
        qualification: q.degree,
        institution_name: q.college,
        start_date: parts[0] || "",
        completion_date: parts[1] || "",
        status: "Completed",
      };
    }),
    program_id: programMap[formData.program] || "d9b0a1d4-8d96-4a47-a8a5-8c7c9a9d7b12",
    date_of_registration: formData.dateOfRegistration || new Date().toISOString().split("T")[0],
    total_fees: Number(formData.totalFees) || 0,
    scholarship_discount: Number(formData.discount) || 0,
    payable_amount: payableAmount,
    number_of_instalments: installments,
    number_of_installments: installments,
    registration_fee: regFeeAmount,
    registration_fee_amount: regFeeAmount,
    payment_mode: formData.regFeeMode || "Cash",
    ...(requiresPaymentReference
      ? { transaction_id: transactionId, transactionId }
      : {}),
    payment_date: formData.regFeePaymentDate || new Date().toISOString().split("T")[0],
    remark: formData.remark || "",
    status: "Enrolled",
  };
};

export default function AddTraineeView({
  onBackToStudents,
  backHref = "/dashboard/trainees",
  mode = "add",
  initialData,
}) {
  const router = useRouter();
  const submissionLockRef = useRef(false);
  const startingFormData = mergeInitialData(initialData);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(startingFormData);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [dbPrograms, setDbPrograms] = useState([]);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await getAllPrograms();
        if (res.success && res.data) {
          setDbPrograms(res.data);
        }
      } catch (err) {
        console.error("Failed to load programs for dropdown:", err);
      }
    };
    fetchPrograms();
  }, []);

  const dynamicProgramMap = React.useMemo(() => {
    const defaultMap = {
      "Python with AI": "d9b0a1d4-8d96-4a47-a8a5-8c7c9a9d7b10",
      "Generative AI with LLM": "d9b0a1d4-8d96-4a47-a8a5-8c7c9a9d7b11",
      "UI/UX Design": "d9b0a1d4-8d96-4a47-a8a5-8c7c9a9d7b12",
      "Full Stack Development": "d9b0a1d4-8d96-4a47-a8a5-8c7c9a9d7b13",
      "UI/UX Design Masterclass": "d9b0a1d4-8d96-4a47-a8a5-8c7c9a9d7b12",
      "Full Stack Web Development": "d9b0a1d4-8d96-4a47-a8a5-8c7c9a9d7b13",
      "Data Science & AI": "d9b0a1d4-8d96-4a47-a8a5-8c7c9a9d7b10",
    };
    dbPrograms.forEach((p) => {
      defaultMap[p.title] = p.id;
    });
    return defaultMap;
  }, [dbPrograms]);

  const isEditMode = mode === "edit";
  const actionText = isEditMode ? "Update" : "Add";
  const headerActionText = isEditMode ? "Edit Trainee" : "Add Trainees";

  const handleBackNavigation = () => {
    if (onBackToStudents) {
      onBackToStudents();
      return;
    }

    router.push(backHref);
  };

  const updateFormData = (fields) => {
    setFormData((previous) => ({
      ...previous,
      ...fields,
    }));
  };

  const handleSubmit = async () => {
    if (submissionLockRef.current) return;
    submissionLockRef.current = true;
    setSubmitting(true);
    setErrorMsg("");

    try {
      const dto = mapFormDataToDto(formData, dynamicProgramMap);
      let response;
      if (isEditMode && initialData?.id) {
        response = await updateTrainee(initialData.id, dto);
      } else {
        response = await createTrainee(dto);
      }

      if (response.success) {
        const traineeId = response.data?.id || initialData?.id;
        const regFeeAmount = Number(formData.regFeeAmount) || 0;
        const requiresPaymentReference = paymentModeRequiresReference(
          formData.regFeeMode,
        );
        const regFeeTxId = (formData.regFeeTransactionId || "").trim();
        const hasValidPaymentReference =
          !requiresPaymentReference || Boolean(regFeeTxId);

        const hasNewRegFee =
          !isEditMode &&
          traineeId &&
          regFeeAmount > 0 &&
          hasValidPaymentReference;

        if (hasNewRegFee) {
          try {
            await createTransaction({
              traineeId,
              title: "Registration Fee",
              amount: String(regFeeAmount),
              mode: formData.regFeeMode || "Cash",
              date: formData.regFeePaymentDate || new Date().toISOString().split("T")[0],
              ...(requiresPaymentReference
                ? { transactionId: regFeeTxId }
                : {}),
              status: "Paid",
            });
          } catch {
            toast.error(
              "Trainee was created, but the registration fee record could not be added.",
            );
          }
        }
        toast.success(`Trainee profile ${isEditMode ? "updated" : "created"} successfully!`);
        router.replace(backHref);
      } else {
        const errorText = response.message || `Failed to ${isEditMode ? "update" : "create"} trainee.`;
        setErrorMsg(errorText);
        toast.error(errorText);
      }
    } catch (err) {
      const rawMessage =
        err?.response?.data?.message ||
        err?.message ||
        "An unexpected network error occurred.";
      const msg = rawMessage.includes("UQ_351065dbdcad302ad92d7417a84")
        ? "A trainee with this generated ID already exists. Please check the Trainees list before trying again."
        : rawMessage;
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      submissionLockRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full animate-fade-in">
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-xl">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff5b21]" />
            <p className="text-xs text-gray-500 font-bold mt-2">Saving trainee profile...</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mx-auto max-w-[1000px] mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2">
          <span>{errorMsg}</span>
        </div>
      )}

      <Breadcrumb
        backText="Trainees Management"
        currentText={headerActionText}
        onBack={handleBackNavigation}
        separator="|"
        withBottomMargin={false}
      />
      <div className="mt-2.5">
        <StepIndicator currentStep={currentStep} />
      </div>

      <div className="flex items-center justify-center py-5">
        <div>
          <h1 className="text-[18px] font-semibold leading-tight text-[#202020]">
            {currentStep === 1 ? "Trainee Info" : "Program & Fees Info"}
          </h1>
          <p className="mt-0.5 text-[10px] text-[#999999]">
            {currentStep === 1
              ? "Fill basic details of trainee"
              : "Fill program and fees details of trainee"}
          </p>
        </div>
      </div>

      <div>
        {currentStep === 1 ? (
          <Step1BasicInfo
            formData={formData}
            updateFormData={updateFormData}
            onNext={() => setCurrentStep(2)}
          />
        ) : (
          <Step2ProgramFees
            formData={formData}
            updateFormData={updateFormData}
            onBack={() => setCurrentStep(1)}
            onSubmit={handleSubmit}
            submitLabel={actionText}
            isSubmitting={submitting}
            programs={dbPrograms}
          />
        )}
      </div>
    </div>
  );
}
