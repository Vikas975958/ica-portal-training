import type { PaymentTransaction } from "@/lib/api/types";

export const PAYMENT_SLOT_TITLES = [
  "Registration Fee",
  "Installment 1",
  "Installment 2",
  "Installment 3",
  "Installment 4",
  "Installment 5",
  "Installment 6",
  "Additional Payment",
] as const;

export type PaymentSlotTitle = (typeof PAYMENT_SLOT_TITLES)[number];

type PaymentRecord = Pick<PaymentTransaction, "title" | "status">;

export const normalizePaymentSlotTitle = (
  value: string | undefined,
): PaymentSlotTitle | null => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (
    normalized === "registration fee" ||
    normalized === "reg fee" ||
    normalized === "registration"
  ) {
    return "Registration Fee";
  }

  if (
    normalized === "additional payment" ||
    normalized === "additional" ||
    normalized === "extra payment" ||
    normalized === "extra"
  ) {
    return "Additional Payment";
  }

  const installmentMatch = normalized.match(
    /^(?:installment|instalment|inst)(?:\s*(\d+))?$/,
  );
  if (!installmentMatch) return null;

  const installmentNumber = installmentMatch[1]
    ? Number(installmentMatch[1])
    : 1;
  if (installmentNumber < 1 || installmentNumber > 6) return null;
  return `Installment ${installmentNumber}` as PaymentSlotTitle;
};

export const getPaymentSlots = (numberOfInstallments = 6): PaymentSlotTitle[] => {
  return PAYMENT_SLOT_TITLES.slice(0, 7) as PaymentSlotTitle[];
};

export const getPaidPaymentSlots = (
  transactions: PaymentRecord[],
  additionalPaidSlots: PaymentSlotTitle[] = [],
): PaymentSlotTitle[] => {
  const paidSlots = new Set<PaymentSlotTitle>(additionalPaidSlots);

  const regFeeTransactions = transactions.filter((t) => {
    if (String(t.status || "Paid").toLowerCase() !== "paid") return false;
    const title = normalizePaymentSlotTitle(t.title);
    return title === "Registration Fee";
  });

  const otherTransactions = transactions
    .filter((t) => {
      if (String(t.status || "Paid").toLowerCase() !== "paid") return false;
      const title = normalizePaymentSlotTitle(t.title);
      return title !== null && title !== "Registration Fee" && title !== "Additional Payment";
    })
    .sort((left, right) => {
      const leftTitle = left.title || "";
      const rightTitle = right.title || "";
      return leftTitle.localeCompare(rightTitle, undefined, { numeric: true });
    });

  const additionalFeeTransactions = transactions.filter((t) => {
    if (String(t.status || "Paid").toLowerCase() !== "paid") return false;
    const title = normalizePaymentSlotTitle(t.title);
    return title === "Additional Payment";
  });

  if (regFeeTransactions.length > 0) {
    paidSlots.add("Registration Fee");
  }

  otherTransactions.forEach((_, index) => {
    if (index < 6) {
      paidSlots.add(`Installment ${index + 1}` as PaymentSlotTitle);
    }
  });

  if (additionalFeeTransactions.length > 0) {
    paidSlots.add("Additional Payment");
  }

  return PAYMENT_SLOT_TITLES.filter((title) => paidSlots.has(title));
};

export const getAvailablePaymentSlots = (
  paidSlots: Iterable<PaymentSlotTitle>,
  numberOfInstallments = 6,
): PaymentSlotTitle[] => {
  const paid = new Set(paidSlots);
  return getPaymentSlots(numberOfInstallments).filter(
    (title) => !paid.has(title),
  );
};

export const getNextPendingPaymentSlot = (
  paidSlots: Iterable<PaymentSlotTitle>,
  numberOfInstallments = 6,
  hasBalance = false,
): PaymentSlotTitle | null => {
  const available = getAvailablePaymentSlots(paidSlots, numberOfInstallments);
  if (available.length > 0) {
    return available[0];
  }
  if (hasBalance) {
    return "Additional Payment";
  }
  return null;
};


