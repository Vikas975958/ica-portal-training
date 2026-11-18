export interface TraineeUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  role?: 'Superadmin' | 'Admin';
  status?: 'active' | 'inactive';
  perm_dashboard: boolean;
  perm_trainees: boolean;
  perm_transaction: boolean;
  perm_program: boolean;
  perm_user: boolean;
}

export interface AuthData {
  access_token: string;
  user: TraineeUser;
}

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  statusCode?: number;
  pagination?: {
    limit: number;
    totalRecords: number;
    currentPage: number;
    total: number;
    totalPages?: number;
  };
  data: T;
}

export interface Trainee {
  id: string;
  trainee_code?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other';
  flat_house_number?: string;
  street_address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  program_id?: string;
  date_of_registration?: string;
  total_fees?: number;
  scholarship_discount?: number;
  payable_amount?: number;
  number_of_instalments?: number;
  registration_fee_amount?: number;
  payment_mode?: 'Cash' | 'Online' | 'Cheque' | 'Bank Transfer' | 'UPI';
  transaction_id?: string;
  payment_date?: string;
  remark?: string;
  status: 'Enrolled' | 'Active' | 'On Hold' | 'Dropped' | 'Inactive' | 'Completed';
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentTransaction {
  id?: string;
  traineeId?: string;
  trainee_id?: string;
  title: string;
  amount: number | string;
  mode: string;
  date: string;
  payment_mode?: string;
  payment_date?: string;
  transactionId: string;
  status: 'Paid' | 'Pending';
  createdAt?: string;
  updatedAt?: string;
}

export interface TraineeTransactionsResponse {
  summary: {
    total_fees: number;
    discount: number;
    payable_amount: number;
    balance_due: number;
    payment_status: string;
    progress_percent: number;
    total_paid: number;
    transaction_count: number;
    isOverpaid?: boolean;
    overpaidAmount?: number;
  };
  transactions: PaymentTransaction[];
  registration_fee_amount?: number;
  payment_mode?: string;
  transaction_id?: string;
  date_of_registration?: string;
}

export interface ProjectTask {
  id?: string;
  traineeId?: string;
  trainee_id?: string;
  title: string;
  type: string;
  repo: string;
  live: string;
  result: 'Approved' | 'Under Review' | 'Rejected';
  code_link?: string;
  website_link?: string;
  tech_stack?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlacementRound {
  id?: string;
  traineeId?: string;
  trainee_id?: string;
  company: string;
  role: string;
  round: string;
  date: string;
  interview_date?: string;
  result: 'Selected' | 'Rejected' | 'On Hold';
  createdAt?: string;
  updatedAt?: string;
}

export interface TraineeNote {
  id?: string;
  traineeId?: string;
  trainee_id?: string;
  author: string;
  date: string;
  text: string;
  note?: string;
  author_name?: string;
  created_at?: string;
  initial?: string;
  createdAt?: string;
  updatedAt?: string;
}
