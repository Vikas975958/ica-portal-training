import { notFound } from "next/navigation";
import AddTraineeView from "@/components/AddTraineeView";
import { fetchServerTrainee } from "@/api/serverActions";
const monthLookup = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12"
};
const padTwo = value => value.padStart(2, "0");
const toInputDate = value => {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  // Date inputs require YYYY-MM-DD. The API commonly returns either this
  // format or a full ISO timestamp, so preserve its date portion directly.
  const isoDate = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) {
    return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
  }
  const monthFirst = normalized.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (monthFirst) {
    const [, monthRaw, day, year] = monthFirst;
    const month = monthLookup[monthRaw.toLowerCase()];
    if (month) {
      return `${year}-${month}-${padTwo(day)}`;
    }
  }
  const dayFirst = normalized.match(/^(\d{1,2})\s+([A-Za-z]+),?\s*(\d{4})$/);
  if (dayFirst) {
    const [, day, monthRaw, year] = dayFirst;
    const month = monthLookup[monthRaw.toLowerCase()];
    if (month) {
      return `${year}-${month}-${padTwo(day)}`;
    }
  }
  const parsedDate = new Date(normalized);
  if (!Number.isNaN(parsedDate.getTime())) {
    return [parsedDate.getUTCFullYear(), padTwo(String(parsedDate.getUTCMonth() + 1)), padTwo(String(parsedDate.getUTCDate()))].join("-");
  }
  return "";
};
const normalizeMoney = value => value.replace(/[^0-9.]/g, "");
const normalizePhone = value => {
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
};
const mapPaymentMode = value => {
  const normalized = value.toLowerCase();
  if (normalized.includes("cash")) {
    return "Cash";
  }
  if (normalized.includes("bank")) {
    return "Bank Transfer";
  }
  if (normalized.includes("upi")) {
    return "UPI";
  }
  return value;
};
export default async function EditTraineePage({
  params
}) {
  const {
    id
  } = await params;
  const trainee = await fetchServerTrainee(id);
  if (!trainee) {
    notFound();
  }
  const [firstName, ...lastNameParts] = trainee.name.split(" ");
  const emergencyNameParts = trainee.emergencyName.split(" ");
  const emergencyFirstName = emergencyNameParts[0] || "";
  const registrationTransaction = trainee.fees.transactions[0];
  const editFormData = {
    id: trainee.id,
    firstName: firstName || "",
    lastName: lastNameParts.join(" "),
    email: trainee.email,
    phone: normalizePhone(trainee.phone),
    gender: trainee.gender,
    addressFlat: trainee.addressLine,
    addressStreet: trainee.addressStreet ?? trainee.addressDetail,
    addressCity: trainee.addressCity || "",
    addressState: trainee.addressState || "",
    addressPinCode: trainee.addressPinCode || "",
    emergencyFirstName,
    emergencyLastName: emergencyNameParts.slice(1).join(" "),
    emergencyRelationship: trainee.emergencyRelationship,
    emergencyPhone: normalizePhone(trainee.emergencyPhone),
    qualifications: trainee.qualifications.map((qualification, index) => ({
      id: `${trainee.id}-q-${index + 1}`,
      degree: qualification.degree,
      college: qualification.college,
      duration: `${qualification.sessionStart} - ${qualification.sessionEnd}`
    })),
    program: trainee.programName.trim(),
    duration: trainee.programDuration,
    dateOfRegistration: toInputDate(trainee.registrationDate),
    totalFees: normalizeMoney(trainee.fees.total),
    discount: normalizeMoney(trainee.fees.discount),
    payableAmount: normalizeMoney(trainee.fees.payable),
    installments: String(Math.max(1, trainee.numberOfInstallments || trainee.fees.transactions.length)),
    regFeeAmount: normalizeMoney(registrationTransaction?.amount || ""),
    regFeeMode: mapPaymentMode(registrationTransaction?.mode || trainee.paymentMode),
    regFeeTransactionId: registrationTransaction?.transactionId || "",
    regFeePaymentDate: toInputDate(registrationTransaction?.date || ""),
    remark: trainee.fees.remarks
  };
  return <AddTraineeView mode="edit" initialData={editFormData} backHref={`/dashboard/trainees/${id}/details`} />;
}