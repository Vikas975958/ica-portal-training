import {
  getAllPrograms as getProgramsApi,
  getAllProgramTags as getProgramTagsApi,
} from "@/api/get";
import { createProgram as createProgramApi } from "@/api/post";
import {
  updateProgram as updateProgramApi,
  toggleProgramStatus as toggleProgramStatusApi,
} from "@/api/put";
import { deleteProgram as deleteProgramApi } from "@/api/delete";

export const getAllPrograms = getProgramsApi;
export const getAllProgramTags = getProgramTagsApi;
export const createProgram = createProgramApi;
export const updateProgram = updateProgramApi;
export const deleteProgram = deleteProgramApi;
export const toggleProgramStatus = toggleProgramStatusApi;
