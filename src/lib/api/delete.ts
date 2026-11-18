import { api } from './axios';
import { ApiResponse } from './types';

const toApiResponse = <T>(
  payload: unknown,
  fallbackMessage = 'Request completed successfully'
): ApiResponse<T> => {
  if (
    payload &&
    typeof payload === 'object' &&
    ('success' in payload || 'data' in payload)
  ) {
    const parsed = payload as {
      success?: boolean;
      status?: number;
      statusCode?: number;
      message?: string;
      pagination?: ApiResponse<T>['pagination'];
      data: T;
    };

    const isSuccess = parsed.success !== undefined
      ? parsed.success
      : (parsed.status === 200 || parsed.status === 201 || parsed.statusCode === 200 || parsed.statusCode === 201 || true);

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

// 1. Delete Trainee User (DELETE)
export const deleteTraineeUser = async (id: string): Promise<ApiResponse<void>> => {
  const res = await api.delete(`/trainees/users/${id}`);
  return toApiResponse<void>(res.data, 'User deleted successfully');
};

// 2. Delete Trainee (DELETE)
export const deleteTrainee = async (id: string): Promise<ApiResponse<void>> => {
  const res = await api.delete(`/trainees/trainees/${id}`);
  return toApiResponse<void>(res.data, 'Trainee deleted successfully');
};

// Delete Transaction (DELETE)
export const deleteTransaction = async (id: string): Promise<ApiResponse<void>> => {
  const res = await api.delete(`/fee-ledger/${id}`);
  return toApiResponse<void>(res.data, 'Transaction deleted successfully');
};

// 5. Delete Project (DELETE)
export const deleteProject = async (id: string): Promise<ApiResponse<void>> => {
  const res = await api.delete(`/trainees/projects/${id}`);
  return toApiResponse<void>(res.data, 'Project deleted successfully');
};

// 6. Delete Placement interview record (DELETE)
export const deletePlacement = async (id: string): Promise<ApiResponse<void>> => {
  const res = await api.delete(`/trainees/placements/${id}`);
  return toApiResponse<void>(res.data, 'Interview record deleted successfully');
};

// 7. Delete Trainee Note (DELETE)
export const deleteNote = async (id: string): Promise<ApiResponse<void>> => {
  const res = await api.delete(`/trainees/notes/${id}`);
  return toApiResponse<void>(res.data, 'Note deleted successfully');
};

