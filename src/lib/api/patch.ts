import { api } from './axios';
import {
  ApiResponse,
  TraineeUser,
  Trainee,
  PaymentTransaction,
  ProjectTask,
  PlacementRound,
  TraineeNote,
} from './types';
import { paymentModeRequiresReference } from '../paymentReference';

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

// 1. Update Trainee User details (PUT)
export const updateTraineeUser = async (id: string, userData: any): Promise<ApiResponse<TraineeUser>> => {
  const res = await api.put(`/trainees/users/${id}`, userData);
  return toApiResponse<TraineeUser>(res.data, 'User updated successfully');
};

// Update own password (PUT)
export const changePasswordUser = async (passwordData: any): Promise<ApiResponse<any>> => {
  const res = await api.put('/trainees/users/change-password', passwordData);
  return toApiResponse<any>(res.data, 'Password changed successfully');
};

// 2. Update Trainee details (PUT)
export const updateTrainee = async (id: string, traineeData: any): Promise<ApiResponse<Trainee>> => {
  const res = await api.put(`/trainees/trainees/${id}`, traineeData);
  return toApiResponse<Trainee>(res.data, 'Trainee updated successfully');
};

// 3. Update Trainee status (PUT)
export const updateTraineeStatus = async (id: string, status: string): Promise<ApiResponse<void>> => {
  const res = await api.put(`/trainees/trainees/${id}/status`, {}, { params: { status } });
  return toApiResponse<void>(res.data, 'Trainee status updated successfully');
};

// Update payment transaction details (PUT)
export const updateTransaction = async (id: string, data: Partial<PaymentTransaction>): Promise<ApiResponse<PaymentTransaction>> => {
  const parsedAmount = typeof data.amount === 'string'
    ? Number(data.amount.replace(/,/g, ''))
    : data.amount;

  let payment_date = data.payment_date || data.date;
  if (payment_date) {
    const trimmed = String(payment_date).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      payment_date = `${trimmed}T00:00:00.000Z`;
    } else {
      const cleaned = trimmed.replace(/\bSept\b/i, 'Sep');
      const parsedDate = new Date(cleaned);
      if (!isNaN(parsedDate.getTime())) {
        const y = parsedDate.getFullYear();
        const m = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const d = String(parsedDate.getDate()).padStart(2, '0');
        payment_date = `${y}-${m}-${d}T00:00:00.000Z`;
      }
    }
  }

  const rawTitle = (data.title || (data as any).type || '').trim();
  let type = (data as any).type;
  let instalment_number = (data as any).instalment_number || (data as any).instalmentNumber || null;

  if (rawTitle) {
    const lowerTitle = rawTitle.toLowerCase().replace(/[_-]+/g, ' ');
    if (
      lowerTitle === 'registration fee' ||
      lowerTitle === 'registration_fee' ||
      lowerTitle === 'reg fee' ||
      lowerTitle === 'reg_fee' ||
      lowerTitle === 'registration'
    ) {
      type = 'Registration Fee';
      instalment_number = null;
    } else {
      type = 'Instalment';
      if (!instalment_number) {
        const match = rawTitle.match(/(?:installment|instalment|inst)\s*(\d+)/i);
        if (match) {
          instalment_number = Number(match[1]);
        }
      }
    }
  }

  const txId = data.transactionId || (data as any).transaction_id || '';
  const paymentMode = data.payment_mode || data.mode || '';
  const payload: any = {
    amount: parsedAmount !== undefined && isNaN(Number(parsedAmount)) ? 0 : Number(parsedAmount),
    payment_mode: paymentMode,
    payment_date,
    status: data.status || 'Paid',
  };

  if (rawTitle) {
    payload.title = rawTitle;
  }
  if (type) {
    payload.type = type;
  }
  if (instalment_number !== null) {
    payload.instalment_number = instalment_number;
  }
  if (paymentModeRequiresReference(paymentMode)) {
    payload.transactionId = txId;
    payload.transaction_id = txId;
  }

  const res = await api.put(`/fee-ledger/${id}`, payload);
  return toApiResponse<PaymentTransaction>(res.data, 'Transaction updated successfully');
};

export const updateProject = async (id: string, data: Partial<ProjectTask>): Promise<ApiResponse<ProjectTask>> => {
  const { traineeId, trainee_id, title, repo, live, type, result } = data;
  const payload = {
    trainee_id: trainee_id || traineeId,
    title,
    code_link: repo,
    website_link: live,
    tech_stack: type,
    status: result,
  };
  const res = await api.put(`/trainees/projects/${id}`, payload);
  const response = toApiResponse<ProjectTask>(res.data, 'Project updated successfully');
  if (response.success && response.data) {
    const p = response.data as any;
    response.data = {
      ...p,
      repo: p.repo || p.code_link || '',
      live: p.live || p.website_link || '',
      type: p.type || p.tech_stack || '',
      result: p.result || p.status || 'Under Review',
    };
  }
  return response;
};

// 8. Update placement interview record (PUT)
export const updatePlacement = async (id: string, data: Partial<PlacementRound>): Promise<ApiResponse<PlacementRound>> => {
  const { traineeId, trainee_id, company, role, round, date, result } = data;
  
  let interview_date = date;
  if (interview_date) {
    const parsedDate = new Date(interview_date);
    if (!isNaN(parsedDate.getTime())) {
      interview_date = parsedDate.toISOString();
    }
  }

  const payload = {
    trainee_id: trainee_id || traineeId,
    company,
    role,
    round,
    interview_date,
    result,
  };
  const res = await api.put(`/trainees/placements/${id}`, payload);
  const response = toApiResponse<PlacementRound>(res.data, 'Interview record updated successfully');
  if (response.success && response.data) {
    const p = response.data as any;
    let formattedDate = p.date || p.interview_date || '';
    if (formattedDate) {
      const d = new Date(formattedDate);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    }
    response.data = {
      ...p,
      date: formattedDate,
    };
  }
  return response;
};

export const updateNote = async (id: string, data: Partial<TraineeNote>): Promise<ApiResponse<TraineeNote>> => {
  const { traineeId, trainee_id, text, author, initial } = data;
  const payload = {
    trainee_id: trainee_id || traineeId,
    note: text,
    author_name: author,
    initial,
  };
  const res = await api.put(`/trainees/notes/${id}`, payload);
  const response = toApiResponse<TraineeNote>(res.data, 'Note edited successfully');
  if (response.success && response.data) {
    const n = response.data as any;
    let noteDate = n.date || n.created_at || n.createdAt || '';
    if (noteDate && noteDate.includes('T')) {
      const d = new Date(noteDate);
      if (!isNaN(d.getTime())) {
        noteDate = d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    }
    response.data = {
      ...n,
      text: n.text || n.note || '',
      author: n.author || n.author_name || '',
      date: noteDate,
      initial: n.initial || (n.author || n.author_name || 'A').charAt(0).toUpperCase(),
    };
  }
  return response;
};

