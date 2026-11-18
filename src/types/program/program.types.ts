export type ProgramStatus = "active" | "inactive";

export type ProgramAction = "view" | "delete" | "edit";

export type ProgramSortBy = "title" | "fees" | "duration" | "created_at";

export type ProgramDuration =
  | "15 Days"
  | "45 Days"
  | "1 Month"
  | "2 Months"
  | "3 Months"
  | "6 Months"
  | "12 Months";

export interface Program {
  id: string;
  title: string;
  duration: string;
  fees: number;
  description?: string;
  tags?: string[];
  attachment?: string;
  status: ProgramStatus;
  is_assigned?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProgramItem {
  id: string;
  title: string;
  tags: string[];
  fees: string; // e.g. "₹10,000"
  duration: string;
  status: boolean; // mapped from status === "active"
  description: string;
  attachments: Array<{
    name: string;
    size: string;
    date: string;
    url: string;
  }>;
  isAssigned: boolean;
}

export interface ProgramFormValues {
  title: string;
  duration: string;
  fees: string;
  description: string;
  tags: string[];
}

export interface ProgramFormErrors {
  title?: string;
  duration?: string;
  fees?: string;
  description?: string;
}

export interface CreateProgramInput {
  title: string;
  duration: string;
  fees: number;
  description?: string;
  tags?: string[];
  attachment?: string | null;
  status?: ProgramStatus;
}

export interface UpdateProgramInput {
  title?: string;
  duration?: string;
  fees?: number;
  description?: string;
  tags?: string[];
  attachment?: string | null;
  status?: ProgramStatus;
}

export interface ProgramSortConfig {
  key: ProgramSortBy;
  direction: "asc" | "desc";
}

export interface ProgramListParams {
  page: number;
  limit: number;
  sortBy?: ProgramSortBy;
  sortOrder?: "ASC" | "DESC";
  search?: string;
  status?: ProgramStatus;
  tag?: string;
}
