import axios from 'axios';
import { api } from './axios';
import {
  ApiResponse,
  AuthData,
  Trainee,
  TraineeUser,
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

// 1. Login
export const loginUser = async (email: string, password: string): Promise<ApiResponse<AuthData>> => {
  const res = await api.post('/trainees/auth/login', { email, password });
  return toApiResponse<AuthData>(res.data, 'Login successful');
};

// 2. Request forgot password link
export const forgotPasswordUser = async (email: string): Promise<ApiResponse<{ message: string }>> => {
  const res = await api.post('/trainees/auth/forgot-password', { email });
  return toApiResponse<{ message: string }>(res.data, 'Password reset link sent');
};

// 3. Reset password using email token
export const resetPasswordUser = async (token: string, new_password: string): Promise<ApiResponse<{ message: string }>> => {
  const res = await api.post('/trainees/auth/reset-password', { token, new_password });
  return toApiResponse<{ message: string }>(res.data, 'Password reset successful');
};

// 4. Create Trainee
export const createTrainee = async (
  traineeData: Record<string, unknown>,
): Promise<ApiResponse<Trainee>> => {
  try {
    const res = await api.post('/trainees/trainees', traineeData);
    return toApiResponse<Trainee>(res.data, 'Trainee created successfully');
  } catch (error: unknown) {
    if (!axios.isAxiosError<{ message?: string; statusCode?: number }>(error) || !error.response) {
      throw error;
    }

    const status = error.response.status;
    const rawMessage =
      error.response.data?.message || 'Failed to create trainee.';
    const message = rawMessage.includes('UQ_351065dbdcad302ad92d7417a84')
      ? 'A trainee with this generated ID already exists. Please check the Trainees list before trying again.'
      : rawMessage;

    return {
      success: false,
      status,
      statusCode: error.response.data?.statusCode || status,
      message,
      data: undefined as unknown as Trainee,
    };
  }
};

// Import Trainees from CSV or XLSX (POST)
export const importTrainees = async (file: File): Promise<ApiResponse<any>> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/trainees/trainees/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return toApiResponse<any>(res.data, 'Trainees imported successfully');
};

// Import Transactions from CSV or XLSX (POST)
export const importTransactions = async (file: File): Promise<ApiResponse<any>> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/fee-ledger/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return toApiResponse<any>(res.data, 'Transactions imported successfully');
};

// 5. Create Trainee System User
export const createTraineeUser = async (userData: any): Promise<ApiResponse<TraineeUser>> => {
  const res = await api.post('/trainees/users', userData);
  return toApiResponse<TraineeUser>(res.data, 'User created successfully');
};

// Record a new payment transaction
export const createTransaction = async (data: Partial<PaymentTransaction>): Promise<ApiResponse<PaymentTransaction>> => {
  const { traineeId, ...rest } = data;
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
    const lowerType = rawTitle.toLowerCase().replace(/[_-]+/g, ' ');
    if (
      lowerType === 'registration fee' ||
      lowerType === 'registration_fee' ||
      lowerType === 'reg fee' ||
      lowerType === 'reg_fee' ||
      lowerType === 'registration'
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
  } else {
    type = 'Instalment';
  }

  const txId = data.transactionId || (data as any).transaction_id || '';
  const paymentMode = data.payment_mode || data.mode || '';
  const payload: any = {
    title: rawTitle || data.title,
    type,
    instalment_number,
    amount: parsedAmount !== undefined && isNaN(Number(parsedAmount)) ? 0 : Number(parsedAmount),
    payment_mode: paymentMode,
    payment_date,
    status: data.status || 'Paid',
    trainee_id: data.trainee_id || traineeId,
  };

  if (paymentModeRequiresReference(paymentMode)) {
    payload.transactionId = txId;
    payload.transaction_id = txId;
  }

  const res = await api.post('/fee-ledger', payload);
  return toApiResponse<PaymentTransaction>(res.data, 'Payment transaction recorded successfully');
};

// 8. Submit a new project for a trainee
export const createProject = async (data: Partial<ProjectTask>): Promise<ApiResponse<ProjectTask>> => {
  const { traineeId, trainee_id, title, repo, live, type, result } = data;
  const payload = {
    trainee_id: trainee_id || traineeId,
    title,
    code_link: repo,
    website_link: live,
    tech_stack: type,
    status: result,
  };
  const res = await api.post('/trainees/projects', payload);
  const response = toApiResponse<ProjectTask>(res.data, 'Project submitted successfully');
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

export const createPlacement = async (data: Partial<PlacementRound>): Promise<ApiResponse<PlacementRound>> => {
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
  const res = await api.post('/trainees/placements', payload);
  const response = toApiResponse<PlacementRound>(res.data, 'Interview record added successfully');
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

export const createNote = async (data: Partial<TraineeNote>): Promise<ApiResponse<TraineeNote>> => {
  const { traineeId, trainee_id, text, author, initial } = data;
  const payload = {
    trainee_id: trainee_id || traineeId,
    note: text,
    author_name: author,
    initial,
  };
  const res = await api.post('/trainees/notes', payload);
  const response = toApiResponse<TraineeNote>(res.data, 'Note added successfully');
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

