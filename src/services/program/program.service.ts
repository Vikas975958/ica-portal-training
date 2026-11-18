import { api } from "@/lib/api/axios";
import { ApiResponse } from "@/lib/api/types";
import type {
  CreateProgramInput,
  Program,
  ProgramListParams,
  UpdateProgramInput,
} from "@/types/program/program.types";

const toApiResponse = <T>(
  payload: unknown,
  fallbackMessage = "Request completed successfully",
): ApiResponse<T> => {
  if (
    payload &&
    typeof payload === "object" &&
    ("success" in payload || "data" in payload)
  ) {
    const parsed = payload as {
      success?: boolean;
      status?: number;
      statusCode?: number;
      message?: string;
      pagination?: ApiResponse<T>["pagination"];
      data: T;
    };

    const isSuccess =
      parsed.success !== undefined
        ? parsed.success
        : parsed.status === 200 ||
          parsed.status === 201 ||
          parsed.statusCode === 200 ||
          parsed.statusCode === 201 ||
          true;

    return {
      success: isSuccess,
      status: parsed.status ?? parsed.statusCode ?? 200,
      message: parsed.message ?? fallbackMessage,
      pagination: parsed.pagination,
      data: parsed.data,
      statusCode: parsed.statusCode,
    };
  }

  return {
    success: true,
    status: 200,
    message: fallbackMessage,
    data: payload as T,
  };
};

export const getAllPrograms = async (
  params?: ProgramListParams,
  signal?: AbortSignal,
): Promise<ApiResponse<Program[]>> => {
  const res = await api.get("/programs", { params, signal });
  const apiResponse = toApiResponse<any>(res.data, "Programs list retrieved successfully");
  
  let programs: Program[] = [];
  let pagination = apiResponse.pagination;
  
  if (apiResponse.success && apiResponse.data) {
    if (Array.isArray(apiResponse.data)) {
      programs = apiResponse.data;
    } else if (typeof apiResponse.data === "object") {
      if (Array.isArray(apiResponse.data.programs)) {
        programs = apiResponse.data.programs;
      }
      if (apiResponse.data.pagination) {
        pagination = {
          ...pagination,
          ...apiResponse.data.pagination,
        };
      }
    }
  }
  
  return {
    ...apiResponse,
    data: programs,
    pagination,
  };
};

export const getAllProgramTags = async (
  signal?: AbortSignal,
): Promise<ApiResponse<string[]>> => {
  const res = await api.get("/programs/tags", { signal });
  const apiResponse = toApiResponse<any>(res.data, "Program tags retrieved successfully");
  
  let tags: string[] = [];
  if (apiResponse.success && apiResponse.data) {
    if (Array.isArray(apiResponse.data)) {
      tags = apiResponse.data;
    } else if (typeof apiResponse.data === "object" && Array.isArray(apiResponse.data.tags)) {
      tags = apiResponse.data.tags;
    }
  }
  
  return {
    ...apiResponse,
    data: tags,
  };
};

export const createProgram = async (
  input: CreateProgramInput,
): Promise<ApiResponse<Program>> => {
  const res = await api.post("/programs", input);
  const apiResponse = toApiResponse<any>(res.data, "Program created successfully");
  
  let program = apiResponse.data;
  if (apiResponse.success && apiResponse.data && typeof apiResponse.data === "object") {
    program = apiResponse.data.program ?? apiResponse.data;
  }
  
  return {
    ...apiResponse,
    data: program,
  };
};

export const updateProgram = async (
  id: string,
  input: UpdateProgramInput,
): Promise<ApiResponse<Program>> => {
  const res = await api.put(`/programs/${id}`, input);
  const apiResponse = toApiResponse<any>(res.data, "Program updated successfully");
  
  let program = apiResponse.data;
  if (apiResponse.success && apiResponse.data && typeof apiResponse.data === "object") {
    program = apiResponse.data.program ?? apiResponse.data;
  }
  
  return {
    ...apiResponse,
    data: program,
  };
};

export const deleteProgram = async (
  id: string,
): Promise<ApiResponse<void>> => {
  const res = await api.delete(`/programs/${id}`);
  return toApiResponse<void>(res.data, "Program deleted successfully");
};

export const toggleProgramStatus = async (
  id: string,
): Promise<ApiResponse<Program>> => {
  const res = await api.put(`/programs/${id}/toggle-status`);
  const apiResponse = toApiResponse<any>(res.data, "Program status toggled successfully");
  
  let program = apiResponse.data;
  if (apiResponse.success && apiResponse.data && typeof apiResponse.data === "object") {
    program = apiResponse.data.program ?? apiResponse.data;
  }
  
  return {
    ...apiResponse,
    data: program,
  };
};

