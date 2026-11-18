import { api } from "./axios";

const toApiResponse = (payload, fallbackMessage = "Request completed successfully") => {
  if (
    payload &&
    typeof payload === "object" &&
    ("success" in payload || "data" in payload)
  ) {
    const status = payload.status ?? payload.statusCode ?? 200;
    const isSuccess =
      payload.success !== undefined
        ? payload.success
        : status === 200 || status === 201 || payload.statusCode === 200 || payload.statusCode === 201 || true;

    return {
      success: isSuccess,
      status,
      message: payload.message ?? fallbackMessage,
      pagination: payload.pagination,
      data: payload.data,
      statusCode: payload.statusCode,
    };
  }

  return {
    success: true,
    status: 200,
    message: fallbackMessage,
    data: payload,
  };
};

// 1. Delete Trainee User (DELETE)
export const deleteUserApi = async (id) => {
  const res = await api.delete(`/trainees/users/${id}`);
  return toApiResponse(res.data, "User deleted successfully");
};
export const deleteTraineeUser = deleteUserApi;

// 2. Delete Trainee (DELETE)
export const deleteTraineeApi = async (id) => {
  const res = await api.delete(`/trainees/trainees/${id}`);
  return toApiResponse(res.data, "Trainee deleted successfully");
};
export const deleteTrainee = deleteTraineeApi;

// 3. Delete Program (DELETE)
export const deleteProgramApi = async (id) => {
  const res = await api.delete(`/programs/${id}`);
  return toApiResponse(res.data, "Program deleted successfully");
};
export const deleteProgram = deleteProgramApi;

// 4. Delete Transaction (DELETE)
export const deleteTransactionApi = async (id) => {
  const res = await api.delete(`/fee-ledger/${id}`);
  return toApiResponse(res.data, "Transaction deleted successfully");
};
export const deleteTransaction = deleteTransactionApi;

// 5. Delete Project (DELETE)
export const deleteProjectApi = async (id) => {
  const res = await api.delete(`/trainees/projects/${id}`);
  return toApiResponse(res.data, "Project deleted successfully");
};
export const deleteProject = deleteProjectApi;

// 6. Delete Placement interview record (DELETE)
export const deletePlacementApi = async (id) => {
  const res = await api.delete(`/trainees/placements/${id}`);
  return toApiResponse(res.data, "Interview record deleted successfully");
};
export const deletePlacement = deletePlacementApi;

// 7. Delete Trainee Note (DELETE)
export const deleteNoteApi = async (id) => {
  const res = await api.delete(`/trainees/notes/${id}`);
  return toApiResponse(res.data, "Note deleted successfully");
};
export const deleteNote = deleteNoteApi;
