export interface Qualification {
  id: string;
  degree: string;
  college: string;
  duration: string;
}

export interface TraineeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  addressFlat: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressPinCode: string;
  emergencyFirstName: string;
  emergencyLastName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  qualifications: Qualification[];
  program: string;
  duration: string;
  dateOfRegistration: string;
  totalFees: string;
  discount: string;
  payableAmount: string;
  installments: string;
  regFeeAmount: string;
  regFeeMode: string;
  regFeeTransactionId: string;
  regFeePaymentDate: string;
  remark: string;
}
