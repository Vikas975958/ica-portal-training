"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, X } from "lucide-react";
import { toast } from "react-toastify";
import Breadcrumb from "@/components/Breadcrumb";
import {
  DEFAULT_PROGRAM_TAGS,
  getProgramErrorMessage,
  PROGRAM_DURATIONS,
  PROGRAM_MAX_TAGS,
  toCreateProgramInput,
  validateProgramForm,
  validateProgramPdf,
} from "@/utils/program/program.utils";
import { DocumentuploadIcon } from "@/utils/svgicon";
import { createProgram } from "@/services/program/program.service";
import type { ProgramFormErrors, ProgramFormValues } from "@/types/program/program.types";
import uploadFileToS3 from "@/utils/uploadFileToS3";
import { buildS3Path } from "@/utils/s3-path-builder";

function DurationSelect({
  value,
  hasError,
  onChange,
}: {
  value: string;
  hasError: boolean;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative select-none" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className={`flex h-[52px] w-full cursor-pointer items-center justify-between rounded-xl border bg-white px-3.5 text-xs transition ${hasError ? "border-red-500" : isOpen ? "border-[#ff5b21] text-gray-900 ring-1 ring-[#ff5b21]/15" : "border-gray-200 text-gray-700 hover:border-gray-300"}`}
      >
        <span className={value ? "text-xs font-medium text-gray-900" : "text-xs text-gray-400"}>{value || "--Select Duration--"}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#ff5b21]" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 left-0 z-50 mt-1.5 animate-in rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl duration-150 fade-in slide-in-from-top-2">
          {PROGRAM_DURATIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition ${value === option ? "bg-[#fff7f4] text-[#ff5b21]" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"}`}
            >
              <span>{option}</span>
              {value === option && <Check className="h-3.5 w-3.5 text-[#ff5b21]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type SubmissionPhase = "idle" | "uploading" | "saving";

export default function ProgramForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [fees, setFees] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([...DEFAULT_PROGRAM_TAGS]);
  const [tagInput, setTagInput] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [id] = useState(() => Math.random().toString(36).substring(2, 9));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [imageVersion, setImageVersion] = useState<number>(() => Date.now());
  const [fieldErrors, setFieldErrors] = useState<ProgramFormErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submissionPhase, setSubmissionPhase] = useState<SubmissionPhase>("idle");
  const isSubmitting = submissionPhase !== "idle";

  const getTextNameUpload = () => {
    // Stub function as requested
  };

  useEffect(
    () => () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    },
    [],
  );

  function clearFieldError(field: keyof ProgramFormErrors) {
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  function handleFeesKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (["-", "e", "E", "+"].includes(event.key)) event.preventDefault();
  }

  function handleFeesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value.slice(0, 8);
    if (value === "" || Number(value) >= 0) {
      setFees(value);
      clearFieldError("fees");
    }
  }

  function addTag(value: string) {
    const tag = value.trim().replace(/,/g, "");
    if (!tag) return;
    if (tags.length >= PROGRAM_MAX_TAGS) {
      setErrorMessage(`Maximum ${PROGRAM_MAX_TAGS} tags allowed.`);
      return;
    }
    if (!tags.includes(tag)) setTags((current) => [...current, tag]);
    setTagInput("");
    setErrorMessage("");
  }

  function handleTagKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(tagInput);
    }
  }

const handlePdfChange = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  if (submissionPhase === "uploading") {
    return;
  }

  const file = event.target.files?.[0];

  if (!file) {
    setAttachment(null);
    setUploadedUrl("");
    setErrorMessage("");
    return;
  }

  // Validate PDF
  const validationError = validateProgramPdf(file);
  if (validationError) {
    setAttachment(null) ;
    setUploadedUrl("");
    setErrorMessage(validationError);
    event.target.value = "";
    return;
  }

  const fileKey = buildS3Path({
    type: "program",
    fileName: file.name,
  });

  try {
    setSubmissionPhase("uploading");
    setErrorMessage("");

    // Upload directly from frontend → S3
    await uploadFileToS3(file, fileKey);

    // Build S3 object URL after successful upload
    const baseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL;

    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_S3_BASE_URL is not configured");
    }

    const fileUrl = `${baseUrl.replace(/\/$/, "")}/${fileKey}`;

    // Update state only after successful S3 upload
    setAttachment(file);
    setUploadedUrl(fileUrl);
    setErrorMessage("");

    toast.success("PDF uploaded successfully");

    // Refresh related data
    getTextNameUpload();
    setImageVersion(Date.now());
  } catch (error) {
    console.error("PDF upload error:", error);

    setAttachment(null);
    setUploadedUrl("");
    setErrorMessage("Failed to upload PDF. Please try again.");

    toast.error("Failed to upload PDF. Please try again.");

    // Reset file input
    event.target.value = "";
  } finally {
    setSubmissionPhase("idle");
  }
};

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const values: ProgramFormValues = { title, duration, fees, description, tags };
    const errors = validateProgramForm(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setErrorMessage("");
    setSuccessMessage("");

    const attachmentUrl = uploadedUrl || undefined;

    setSubmissionPhase("saving");
    try {
      const response = await createProgram(toCreateProgramInput(values, attachmentUrl));
      if (!response.success) {
        const message = response.message || "Failed to create program.";
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      setSuccessMessage("Program added successfully!");
      toast.success("Program added successfully!");
      redirectTimeoutRef.current = setTimeout(() => {
        router.push("/dashboard/program-management");
      }, 1200);
    } catch (error: unknown) {
      console.error("Failed to create program:", error);
      const message = getProgramErrorMessage(
        error,
        "A network error occurred while creating the program.",
      );
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSubmissionPhase("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto rounded-3xl">
      <Breadcrumb backText="Program Management" onBack={() => router.push("/dashboard/program-management")} currentText="Add Program" />

      <div className="mb-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-[#111827]">Add Program</h1>
        <p className="mt-1 text-xs text-gray-400">Add the program details here</p>
      </div>

      <div className="mx-auto max-w-3xl space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col">
            <div className={`flex h-[52px] flex-col justify-center rounded-xl border bg-white px-3.5 py-1.5 transition focus-within:border-[#ff5b21] ${fieldErrors.title ? "border-red-500 focus-within:border-red-500" : "border-gray-200"}`}>
              {title && <span className="mb-0.5 animate-in text-[9px] leading-none font-bold tracking-wider text-gray-400 uppercase duration-100 fade-in slide-in-from-top-1">Program Title</span>}
              <input type="text" maxLength={50} placeholder={title ? "" : "Program Title"} value={title} onChange={(event) => { setTitle(event.target.value.slice(0, 50)); clearFieldError("title"); }} className="w-full border-none bg-transparent p-0 text-xs text-gray-800 focus:ring-0 focus:outline-none" />
            </div>
            {fieldErrors.title && <span className="mt-1 pl-1 text-[10px] font-semibold text-red-500">{fieldErrors.title}</span>}
          </div>
          <div className="flex flex-col">
            <DurationSelect value={duration} hasError={Boolean(fieldErrors.duration)} onChange={(value) => { setDuration(value); clearFieldError("duration"); }} />
            {fieldErrors.duration && <span className="mt-1 pl-1 text-[10px] font-semibold text-red-500">{fieldErrors.duration}</span>}
          </div>
        </div>

        <div className="flex flex-col">
          <div className={`flex h-[52px] flex-col justify-center rounded-xl border bg-white px-3.5 py-1.5 transition focus-within:border-[#ff5b21] ${fieldErrors.fees ? "border-red-500 focus-within:border-red-500" : "border-gray-200"}`}>
            {fees && <span className="mb-0.5 animate-in text-[9px] leading-none font-bold tracking-wider text-gray-400 uppercase duration-100 fade-in slide-in-from-top-1">Program Fees</span>}
            <input type="number" min="0" max="10000000" placeholder={fees ? "" : "Program Fees"} value={fees} onKeyDown={handleFeesKeyDown} onChange={handleFeesChange} className="w-full border-none bg-transparent p-0 text-xs text-gray-800 focus:ring-0 focus:outline-none" />
          </div>
          {fieldErrors.fees && <span className="mt-1 pl-1 text-[10px] font-semibold text-red-500">{fieldErrors.fees}</span>}
        </div>

        <div className="flex flex-col">
          <textarea maxLength={500} rows={4} placeholder="Write a Description" value={description} onChange={(event) => { setDescription(event.target.value.slice(0, 500)); clearFieldError("description"); }} className="min-h-[120px] w-full resize-none rounded-xl border border-gray-200 bg-white p-3.5 text-xs text-gray-800 placeholder-gray-400 transition focus:border-[#ff5b21] focus:ring-0 focus:outline-none" />
          {fieldErrors.description && <span className="mt-1 pl-1 text-[10px] font-semibold text-red-500">{fieldErrors.description}</span>}
        </div>

        <div className="flex min-h-[52px] flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 transition focus-within:border-[#ff5b21]">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex select-none items-center gap-1.5 rounded-full bg-[#111111] px-3.5 py-1 text-xs font-semibold text-white">
              {tag}
              <button type="button" onClick={() => { setTags((current) => current.filter((item) => item !== tag)); setErrorMessage(""); }} className="ml-0.5 cursor-pointer hover:opacity-75" title={`Remove ${tag}`}><X className="h-3 w-3 stroke-[3px] text-white" /></button>
            </span>
          ))}
          {tags.length < PROGRAM_MAX_TAGS && (
            <input type="text" placeholder={tags.length === 0 ? `Tags(max ${PROGRAM_MAX_TAGS})` : "Add tag..."} value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={handleTagKeyDown} onBlur={() => { if (tagInput.trim()) addTag(tagInput); }} className="min-w-[100px] flex-1 border-none bg-transparent p-1 text-xs text-gray-800 outline-none placeholder-gray-400" />
          )}
        </div>

        <div className="pt-2">
          <label className="mb-2 block text-sm font-bold text-[#1f1f1f]">Attachment</label>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="group flex w-full cursor-pointer select-none flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e2e2e2] bg-white p-6 text-center transition hover:border-[#ff5b21]">
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 shadow-2xs transition group-hover:text-[#ff5b21]"><DocumentuploadIcon className="h-10 w-10" /></span>
            {attachment ? (
              <span><span className="block text-xs font-bold text-[#1f1f1f]">{attachment.name}</span><span className="mt-0.5 block text-[10px] text-gray-500">{attachment.size < 1024 * 1024 ? `${(attachment.size / 1024).toFixed(1)} KB` : `${(attachment.size / (1024 * 1024)).toFixed(2)} MB`}</span></span>
            ) : (
              <span><span className="block text-xs font-bold text-[#1f1f1f]">Program Attachment</span><span className="mt-1 block text-[10px] text-[#8c8c8c]">(PDF only · Max. file size: 5 MB)</span></span>
            )}
          </button>
          <input ref={fileInputRef} type="file" onChange={handlePdfChange} accept=".pdf,application/pdf" className="hidden" />
        </div>

        <div aria-live="polite">
          {errorMessage && <p className="text-center text-xs font-semibold text-red-500">{errorMessage}</p>}
          {successMessage && <p className="text-center text-xs font-semibold text-green-600">{successMessage}</p>}
        </div>

        <div className="flex justify-center pt-6 pb-2">
          <button type="submit" disabled={isSubmitting} className="flex w-full min-w-[140px] cursor-pointer select-none items-center justify-center gap-2 rounded-xl bg-[#ff5b21] px-8 py-3 text-center text-xs font-bold text-white shadow-sm transition hover:bg-[#e04f1a] disabled:cursor-wait disabled:opacity-60 md:w-auto">
            {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {submissionPhase === "uploading" ? "Uploading PDF..." : submissionPhase === "saving" ? "Adding Program..." : "Add Program"}
          </button>
        </div>
      </div>
    </form>
  );
}


