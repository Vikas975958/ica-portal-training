import { api } from './axios';
import {
  ApiResponse,
  TraineeUser,
  Trainee,
  PaymentTransaction,
  TraineeTransactionsResponse,
  ProjectTask,
  PlacementRound,
  TraineeNote,
} from './types';


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

    const status = parsed.status ?? parsed.statusCode ?? 200;
    const isSuccess = parsed.success ?? (status >= 200 && status < 300);

    return {
      success: isSuccess,
      status,
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

// 1. Get Trainee User by ID
export const getUserById = async (id: string): Promise<ApiResponse<TraineeUser>> => {
  const res = await api.get(`/trainees/users/${id}`);
  return toApiResponse<TraineeUser>(res.data, 'User details retrieved successfully');
};

// 2. Get All Trainee Users
export const getAllUsers = async (params?: Record<string, string>): Promise<ApiResponse<TraineeUser[]>> => {
  const res = await api.get('/trainees/users', { params });
  return toApiResponse<TraineeUser[]>(res.data, 'Users list retrieved successfully');
};

// 3. Get All Trainees
export const getAllTrainees = async (params?: Record<string, string>): Promise<ApiResponse<Trainee[]>> => {
  const res = await api.get('/trainees/trainees', { params });
  return toApiResponse<Trainee[]>(res.data, 'Trainees list retrieved successfully');
};

// 4. Get Trainee by ID
export const getTraineeById = async (id: string): Promise<ApiResponse<Trainee>> => {
  const res = await api.get(`/trainees/trainees/${id}`);
  return toApiResponse<Trainee>(res.data, 'Trainee details retrieved successfully');
};

// Get Trainee by Email
export const getTraineeByEmail = async (email: string): Promise<ApiResponse<Trainee>> => {
  const res = await api.get('/trainees/trainees/by-email', { params: { email } });
  return toApiResponse<Trainee>(res.data, 'Trainee details retrieved successfully');
};

// Get Fee Ledgers (All trainees summary + transactions)
export const getFeeLedgers = async (params?: Record<string, string>): Promise<ApiResponse<any[]>> => {
  const res = await api.get('/fee-ledger', { params });
  return toApiResponse<any[]>(res.data, 'Fee ledgers retrieved successfully');
};
type RawPaymentTransaction = Partial<PaymentTransaction> & {
  type?: string;
  instalment_number?: number | string | null;
  installment_number?: number | string | null;
  payment_mode?: string;
  payment_date?: string;
  transaction_id?: string;
};

const normalizeDateString = (val: unknown): string => {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (str.includes('T')) return str.split('T')[0];
  const cleaned = str.replace(/\bSept\b/i, 'Sep');
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return str;
};
const normalizePaymentTransaction = (
  transaction: RawPaymentTransaction,
): PaymentTransaction => {
  const rawStatus = String(transaction.status || 'Paid').trim().toLowerCase();
  const status: PaymentTransaction['status'] =
    rawStatus === 'pending' || rawStatus === 'unpaid' ? 'Pending' : 'Paid';

  const sourceTitle = String(transaction.title || transaction.type || '').trim();
  const lowerTitle = sourceTitle.toLowerCase().replace(/[_-]+/g, ' ');
  const instalmentNumber = Number(
    transaction.instalment_number ?? transaction.installment_number,
  );
  let title = sourceTitle;
  if (
    lowerTitle === 'registration fee' ||
    lowerTitle === 'reg fee' ||
    lowerTitle === 'registration'
  ) {
    title = 'Registration Fee';
  } else if (Number.isInteger(instalmentNumber) && instalmentNumber > 0) {
    title = `Installment ${instalmentNumber}`;
  } else {
    const match = lowerTitle.match(/(?:installment|instalment|inst)\s*(\d+)/i);
    if (match) title = `Installment ${match[1]}`;
  }
  const rawDate = transaction.date || transaction.payment_date || '';
  return {
    ...transaction,
    title: title || 'Transaction',
    amount: transaction.amount ?? 0,
    mode: transaction.mode || transaction.payment_mode || '',
    date: normalizeDateString(rawDate),
    transactionId:
      transaction.transactionId || transaction.transaction_id || '',
    status,
  };
};
// 8.5. Get Transactions by Trainee ID
export const getTransactionsByTrainee = async (traineeId: string): Promise<ApiResponse<TraineeTransactionsResponse>> => {
  const res = await api.get(`/fee-ledger/by-trainee/${traineeId}`);
  const response = toApiResponse<TraineeTransactionsResponse>(res.data, 'Transactions retrieved successfully');
  if (response.success && response.data) {
    const raw = response.data as unknown as {
      summary?: TraineeTransactionsResponse['summary'];
      transactions?: RawPaymentTransaction[];
      trainee?: {
        registration_fee_amount?: number | string;
        payment_mode?: string;
        transaction_id?: string;
        date_of_registration?: string;
      };
    };
    if (!raw.summary) {
      throw new Error('Fee ledger response is missing summary data');
    }

    const list = Array.isArray(raw.transactions) ? raw.transactions : [];
    response.data = {
      summary: raw.summary,
      transactions: list.map(normalizePaymentTransaction),
      registration_fee_amount: raw.trainee?.registration_fee_amount !== undefined ? Number(raw.trainee.registration_fee_amount) : undefined,
      payment_mode: raw.trainee?.payment_mode,
      transaction_id: raw.trainee?.transaction_id,
      date_of_registration: raw.trainee?.date_of_registration,
    };
  }
  return response;
};
// 9. Get Single Transaction by ID
export const getTransactionById = async (id: string): Promise<ApiResponse<PaymentTransaction>> => {
  const res = await api.get(`/fee-ledger/${id}`);
  const response = toApiResponse<PaymentTransaction>(res.data, 'Transaction details retrieved successfully');
  if (response.success && response.data) {
    response.data = normalizePaymentTransaction(
      response.data as RawPaymentTransaction,
    );
  }
  return response;
};

// 10. Get Projects by Trainee ID
export const getProjectsByTrainee = async (traineeId: string): Promise<ApiResponse<ProjectTask[]>> => {
  const res = await api.get(`/trainees/projects/by-trainee/${traineeId}`);
  const response = toApiResponse<ProjectTask[]>(res.data, 'Projects retrieved successfully');
  if (response.success && response.data) {
    const raw = response.data;
    const list = Array.isArray(raw)
      ? raw
      : (raw as any).projects || Object.values(raw).find(Array.isArray) || [];
    response.data = list.map((p: any) => ({
      ...p,
      repo: p.repo || p.code_link || '',
      live: p.live || p.website_link || '',
      type: p.type || p.tech_stack || '',
      result: p.result || p.status || 'Under Review',
    }));
  }
  return response;
};

// 11. Get Single Project by ID
export const getProjectById = async (id: string): Promise<ApiResponse<ProjectTask>> => {
  const res = await api.get(`/trainees/projects/${id}`);
  const response = toApiResponse<ProjectTask>(res.data, 'Project details retrieved successfully');
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

// 12. Get Placements by Trainee ID
export const getPlacementsByTrainee = async (traineeId: string): Promise<ApiResponse<PlacementRound[]>> => {
  const res = await api.get(`/trainees/placements/by-trainee/${traineeId}`);
  const response = toApiResponse<PlacementRound[]>(res.data, 'Placements retrieved successfully');
  if (response.success && response.data) {
    const raw = response.data;
    const list = Array.isArray(raw)
      ? raw
      : (raw as any).rounds || Object.values(raw).find(Array.isArray) || [];
    response.data = list.map((p: any) => {
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
      return {
        ...p,
        date: formattedDate,
      };
    });
  }
  return response;
};

// 13. Get Single Interview Record by ID
export const getPlacementById = async (id: string): Promise<ApiResponse<PlacementRound>> => {
  const res = await api.get(`/trainees/placements/${id}`);
  const response = toApiResponse<PlacementRound>(res.data, 'Placement details retrieved successfully');
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

// 14. Get Notes by Trainee ID
export const getNotesByTrainee = async (traineeId: string): Promise<ApiResponse<TraineeNote[]>> => {
  const res = await api.get(`/trainees/notes/by-trainee/${traineeId}`);
  const response = toApiResponse<TraineeNote[]>(res.data, 'Notes retrieved successfully');
  if (response.success && response.data) {
    const raw = response.data;
    const list = Array.isArray(raw)
      ? raw
      : (raw as any).notes || Object.values(raw).find(Array.isArray) || [];
    response.data = list.map((n: any) => {
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
      return {
        ...n,
        text: n.text || n.note || '',
        author: n.author || n.author_name || '',
        date: noteDate,
        initial: n.initial || (n.author || n.author_name || 'A').charAt(0).toUpperCase(),
      };
    });
  }
  return response;
};

// 15. Get Single Note by ID
export const getNoteById = async (id: string): Promise<ApiResponse<TraineeNote>> => {
  const res = await api.get(`/trainees/notes/${id}`);
  const response = toApiResponse<TraineeNote>(res.data, 'Note details retrieved successfully');
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

// Download the Excel import template for trainees
export const downloadTraineeTemplate = async (): Promise<Blob> => {
  const res = await api.get('/trainees/trainees/import/template', {
    responseType: 'blob',
  });
  return res.data;
};

// Download the Excel import template for transactions
export const downloadTransactionsTemplate = async (): Promise<Blob> => {
  const res = await api.get('/fee-ledger/import/template', {
    responseType: 'blob',
  });
  return res.data;
};

