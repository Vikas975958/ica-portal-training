import type {
  CreateProgramInput,
  Program,
  ProgramDuration,
  ProgramFormErrors,
  ProgramFormValues,
  ProgramItem,
} from "@/types/program/program.types";

export const PROGRAM_ITEMS_PER_PAGE = 10;
export const PROGRAM_MAX_TAGS = 3;
export const PROGRAM_PDF_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const PROGRAM_DURATIONS: ProgramDuration[] = [
  "15 Days",
  "45 Days",
  "1 Month",
  "2 Months",
  "3 Months",
  "6 Months",
  "12 Months",
];

export const DEFAULT_PROGRAM_TAGS = ["AI", "LLM", "Python"];

export function normalizeProgramDuration(duration: string): string {
  const normalized = duration.trim().toLowerCase();
  const exactMatch = PROGRAM_DURATIONS.find(
    (option) => option.toLowerCase() === normalized,
  );
  if (exactMatch) return exactMatch;

  const amount = normalized.match(/\d+/)?.[0];
  const unit = normalized.includes("day")
    ? "day"
    : normalized.includes("month")
      ? "month"
      : null;

  return (
    PROGRAM_DURATIONS.find((option) => {
      const normalizedOption = option.toLowerCase();
      return Boolean(
        amount &&
          unit &&
          normalizedOption.startsWith(`${amount} `) &&
          normalizedOption.includes(unit),
      );
    }) ?? duration.trim()
  );
}

export function formatProgramFees(fees: number): string {
  return `₹${Number(fees).toLocaleString("en-IN")}`;
}

export function mapProgramToItem(program: Program): ProgramItem {
  const attachmentName = program.attachment
    ? decodeURIComponent(program.attachment.split(/[\\/]/).pop() || "attachment.pdf")
    : "";

  return {
    id: program.id,
    title: program.title,
    tags: program.tags ?? [],
    fees: formatProgramFees(program.fees),
    duration: program.duration,
    status: program.status === "active",
    description: program.description || "",
    attachments: program.attachment
      ? [
          {
            name: attachmentName,
            size: "PDF",
            date: "Available",
            url: program.attachment,
          },
        ]
      : [],
    isAssigned: program.is_assigned ?? false,
  };
}

export function validateProgramForm(values: ProgramFormValues): ProgramFormErrors {
  const errors: ProgramFormErrors = {};
  const title = values.title.trim();
  const fees = Number(values.fees);

  if (!title) {
    errors.title = "Program Title is required.";
  } else if (title.length > 50) {
    errors.title = "Program Title cannot exceed 50 characters.";
  }

  if (!values.duration) {
    errors.duration = "Program Duration is required.";
  }

  if (!values.fees.trim() || Number.isNaN(fees) || fees <= 0) {
    errors.fees = "Please enter a valid positive program fee.";
  } else if (fees > 10_000_000) {
    errors.fees = "Program fee cannot exceed ₹1,00,00,000.";
  }

  if (values.description.trim().length > 500) {
    errors.description = "Description cannot exceed 500 characters.";
  }

  return errors;
}

export function toCreateProgramInput(
  values: ProgramFormValues,
  attachmentUrl?: string,
): CreateProgramInput {
  return {
    title: values.title.trim(),
    duration: normalizeProgramDuration(values.duration),
    fees: Number(values.fees),
    description: values.description.trim(),
    tags: values.tags,
    attachment: attachmentUrl || null,
    status: "active",
  };
}

export function validateProgramPdf(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (file.type !== "application/pdf" || extension !== "pdf") {
    return "Only PDF files are allowed.";
  }

  if (file.size > PROGRAM_PDF_MAX_SIZE_BYTES) {
    return "File size exceeds the maximum limit of 5 MB.";
  }

  if (file.size === 0) {
    return "The selected PDF is empty.";
  }

  return null;
}

export function getProgramErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const response = "response" in error
      ? (error as { response?: { data?: { message?: unknown } } }).response
      : undefined;
    const responseMessage = response?.data?.message;
    if (typeof responseMessage === "string" && responseMessage) {
      return responseMessage;
    }
  }

  return error instanceof Error && error.message ? error.message : fallback;
}

export function isCanceledProgramRequest(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "ERR_CANCELED",
  );
}

export function getProgramPageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) return [1, 2, 3, "…", totalPages] as const;
  if (currentPage >= totalPages - 2) {
    return [1, "…", totalPages - 2, totalPages - 1, totalPages] as const;
  }

  return [1, "…", currentPage, "…", totalPages] as const;
}
