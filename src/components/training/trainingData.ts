export type TraineeCardStatus = "Completed" | "Active" | "On Hold" | "Enrolled" | "Dropped" | "Inactive";

export interface TraineeListItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  program: string;
  duration?: string;
  dor: string;
  status: TraineeCardStatus;
  initial: string;
  avatarClass: string;
  traineeCode?: string;
}

export interface EducationQualification {
  degree: string;
  college: string;
  sessionStart: string;
  sessionEnd: string;
}

export interface ProjectTask {
  title: string;
  type: string;
  repo: string;
  live: string;
  result: "Approved" | "Under Review";
}

export interface PaymentTransaction {
  id?: string;
  title: string;
  amount: string;
  mode: string;
  date: string;
  transactionId: string;
  status: "Paid" | "Pending";
}

export interface PlacementRound {
  company: string;
  role: string;
  round: string;
  date: string;
  result: "Selected" | "Rejected" | "On Hold";
}

export interface TraineeNote {
  author: string;
  date: string;
  text: string;
  initial: string;
}

export interface TraineeProfile {
  id: string;
  traineeCode?: string;
  remark?: string;
  name: string;
  email: string;
  phone: string;
  registrationDate: string;
  gender: string;
  addressLine: string;
  addressDetail: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressPinCode?: string;
  status: TraineeCardStatus;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  programName: string;
  programId?: string;
  programDuration: string;
  numberOfInstallments?: number;
  paymentMode: string;
  qualifications: EducationQualification[];
  projects: ProjectTask[];
  fees: {
    total: string;
    discount: string;
    payable: string;
    balanceDue: string;
    paidAmount: string;
    completionPercent: number;
    transactions: PaymentTransaction[];
    remarks: string;
  };
  placement: {
    currentCompany: string;
    currentRole: string;
    currentStatus: "Selected" | "On Hold";
    rounds: PlacementRound[];
  };
  notes: TraineeNote[];
}
