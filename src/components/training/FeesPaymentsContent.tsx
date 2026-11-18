"use client";

import { useState, useEffect, useCallback } from "react";
import type { TraineeProfile } from "./trainingData";
import { PaymentTransaction, TraineeTransactionsResponse } from "@/lib/api/types";
import { TransactionCardList } from "./TransactionCardList";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { ImportPaymentModal } from "./ImportPaymentModal";
import { getTransactionsByTrainee, getTraineeById } from "@/lib/api/get";
import { createTransaction, importTransactions } from "@/lib/api/post";
import { updateTransaction, updateTrainee } from "@/lib/api/patch";
import { deleteTransaction } from "@/lib/api/delete";
import { useRequestDeduplicator } from "@/lib/hooks/useRequestDeduplicator";
import {
  getNextPendingPaymentSlot,
  getPaidPaymentSlots,
  normalizePaymentSlotTitle,
} from "@/lib/paymentSchedule";
import { toast } from "react-toastify";

interface FeesPaymentsContentProps {
  trainee: TraineeProfile;
}

export default function FeesPaymentsContent({ trainee }: FeesPaymentsContentProps) {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [summary, setSummary] = useState<TraineeTransactionsResponse["summary"] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [remarks, setRemarks] = useState<string>(
    trainee.fees?.remarks || (trainee as any)?.remark || ""
  );

  const { shouldFetch } = useRequestDeduplicator();

  const adjustPaymentData = useCallback(
    (
      rawTransactions: PaymentTransaction[],
      rawSummary: TraineeTransactionsResponse["summary"],
      loadedRegistrationFee?: number,
      loadedPaymentMode?: string,
      loadedTransactionId?: string,
      loadedRegistrationDate?: string,
    ) => {
      const hasRegFeeTx = rawTransactions.some(
        (t) => normalizePaymentSlotTitle(t.title) === "Registration Fee",
      );

      const profileRegFeeTx = trainee.fees?.transactions?.find(
        (t) => normalizePaymentSlotTitle(t.title) === "Registration Fee",
      );
      const profileRegFee = loadedRegistrationFee !== undefined
        ? loadedRegistrationFee
        : (profileRegFeeTx ? Number(profileRegFeeTx.amount) : Number(trainee.fees?.paidAmount || 0));

      const registrationFeeVal = !hasRegFeeTx ? profileRegFee : 0;

      let adjustedTransactions = rawTransactions;
      if (!hasRegFeeTx && registrationFeeVal > 0) {
        const regFeeTx: PaymentTransaction = {
          id: `reg-fee-${trainee.id}`,
          traineeId: trainee.id,
          title: "Registration Fee",
          amount: registrationFeeVal,
          mode: loadedPaymentMode || profileRegFeeTx?.mode || trainee.paymentMode || "UPI",
          date: loadedRegistrationDate || profileRegFeeTx?.date || trainee.registrationDate || "",
          transactionId: loadedTransactionId || profileRegFeeTx?.transactionId || "",
          status: "Paid",
        };
        adjustedTransactions = [regFeeTx, ...rawTransactions];
      }

      const totalFees = Number(rawSummary.total_fees || trainee.fees?.total || 0);
      const discount = Number(rawSummary.discount || trainee.fees?.discount || 0);
      const payableAmount = Math.max(0, totalFees - discount);
      const totalPaid = adjustedTransactions
        .filter((t) => t.status === "Paid" || String(t.status).toLowerCase() === "paid")
        .reduce((sum, t) => sum + Number(String(t.amount).replace(/,/g, "")), 0);
      const balanceDue = Math.max(0, payableAmount - totalPaid);

      let payment_status = "Unpaid";
      if (balanceDue === 0) {
        payment_status = "Fully Paid";
      } else if (totalPaid > 0) {
        payment_status = "Partially Paid";
      }

      const isOverpaid = totalPaid > payableAmount;
      const overpaidAmount = isOverpaid ? (totalPaid - payableAmount) : 0;

      const adjustedSummary = {
        ...rawSummary,
        total_fees: totalFees,
        discount: discount,
        payable_amount: payableAmount,
        total_paid: totalPaid,
        balance_due: balanceDue,
        progress_percent: payableAmount > 0 ? Math.min(100, Math.round((totalPaid / payableAmount) * 100)) : 0,
        payment_status,
        isOverpaid,
        overpaidAmount,
      };

      return {
        transactions: adjustedTransactions,
        summary: adjustedSummary,
      };
    },
    [trainee],
  );

  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await getTransactionsByTrainee(trainee.id);
        if (response.success && response.data) {
          const raw = response.data;
          const adjusted = adjustPaymentData(
            raw.transactions,
            raw.summary,
            raw.registration_fee_amount,
            raw.payment_mode,
            raw.transaction_id,
            raw.date_of_registration
          );
          setTransactions(adjusted.transactions);
          setSummary(adjusted.summary);

          const rawRemark =
            (raw as any)?.remark ||
            (raw as any)?.remarks ||
            (raw as any)?.fee_remark ||
            (raw as any)?.fee_remarks ||
            (raw as any)?.summary?.remark ||
            (raw as any)?.summary?.remarks;
          if (rawRemark) {
            setRemarks(rawRemark);
          } else if (!trainee.fees?.remarks && !(trainee as any)?.remark) {
            try {
              const traineeRes = await getTraineeById(trainee.id);
              if (traineeRes.success && traineeRes.data) {
                const t = traineeRes.data as any;
                const fetchedRemark =
                  t.remark || t.remarks || t.fees?.remarks || t.fee_remark || "";
                if (fetchedRemark) {
                  setRemarks(fetchedRemark);
                }
              }
            } catch {
              // ignore
            }
          }
        } else {
          setTransactions([]);
          setSummary(null);
          setLoadError(response.message || "Payment data is unavailable.");
        }
      } catch (error) {
        console.error("Failed to load fee ledger:", error);
        setTransactions([]);
        setSummary(null);
        setLoadError("Unable to load payment data from the API.");
      } finally {
        setIsLoading(false);
      }
    };
    if (shouldFetch({ traineeId: trainee.id, reloadKey })) {
      loadTransactions();
    }
  }, [trainee.id, reloadKey, shouldFetch, adjustPaymentData]);

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<PaymentTransaction | null>(null);
  const balanceDue = summary ? Number(summary.balance_due) : 0;
  const paidPaymentSlots = getPaidPaymentSlots(transactions);
  const numberOfInstallments = trainee.numberOfInstallments || 4;
  const nextPaymentTitle = getNextPendingPaymentSlot(
    paidPaymentSlots,
    numberOfInstallments,
    balanceDue > 0,
  );

  const handleOpenRecordModal = () => {
    if (displayBalance <= 0) {
      toast.error(`${trainee.name} has already paid all fees.`);
      return;
    }
    setEditingTransaction(null);
    setIsRecordModalOpen(true);
  };

  const handleOpenEditModal = (tx: PaymentTransaction) => {
    setEditingTransaction(tx);
    setIsRecordModalOpen(true);
  };

  const handleSaveTraineeField = async (
    updates: Partial<{
      regFeeAmount: string;
      regFeeMode: string;
      regFeeTransactionId: string;
      regFeePaymentDate: string;
    }>
  ) => { 
    const regFeeAmount = updates.regFeeAmount !== undefined ? Number(updates.regFeeAmount) : Number(trainee.fees.paidAmount || 0);
    const regFeeMode = updates.regFeeMode !== undefined ? updates.regFeeMode : trainee.paymentMode;
    const regFeeTransactionId = updates.regFeeTransactionId !== undefined ? updates.regFeeTransactionId : (trainee.fees.transactions?.[0]?.transactionId || "");
    const regFeePaymentDate = updates.regFeePaymentDate !== undefined ? updates.regFeePaymentDate : (trainee.fees.transactions?.[0]?.date || trainee.registrationDate || "");

    let ymdDate = "";
    if (regFeePaymentDate) {
      const trimmed = regFeePaymentDate.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        ymdDate = trimmed;
      } else if (trimmed.includes("T")) {
        ymdDate = trimmed.split("T")[0];
      } else {
        const cleaned = trimmed.replace(/\bSept\b/i, "Sep");
        const parsed = new Date(cleaned);
        if (!isNaN(parsed.getTime())) {
          const y = parsed.getFullYear();
          const m = String(parsed.getMonth() + 1).padStart(2, "0");
          const d = String(parsed.getDate()).padStart(2, "0");
          ymdDate = `${y}-${m}-${d}`;
        }
      }
    }
    if (!ymdDate) {
      ymdDate = new Date().toISOString().split("T")[0];
    }
    const formattedPaymentDate = `${ymdDate}T00:00:00.000Z`;

    const dto = {
      registration_fee: regFeeAmount,
      registration_fee_amount: regFeeAmount,
      payment_mode: regFeeMode,
      transaction_id: regFeeTransactionId,
      transactionId: regFeeTransactionId,
      payment_date: formattedPaymentDate,
      date_of_registration: ymdDate,
    };

    try {
      const res = await updateTrainee(trainee.id, dto);
      return res.success;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (id.startsWith("reg-fee-")) {
      const success = await handleSaveTraineeField({
        regFeeAmount: "0",
        regFeeMode: "UPI",
        regFeeTransactionId: "",
        regFeePaymentDate: "",
      });
      if (success) {
        toast.success("Registration fee deleted successfully!");
        setReloadKey((prev) => prev + 1);
      } else {
        toast.error("Failed to delete registration fee.");
      }
      return;
    }

    try {
      const txToDelete = transactions.find((t) => t.id === id);
      const response = await deleteTransaction(id);
      if (response.success) {
        if (txToDelete && normalizePaymentSlotTitle(txToDelete.title) === "Registration Fee") {
          await handleSaveTraineeField({
            regFeeAmount: "0",
            regFeeMode: "UPI",
            regFeeTransactionId: "",
            regFeePaymentDate: "",
          });
        }
        toast.success("Transaction deleted successfully!");
        setReloadKey((prev) => prev + 1);
      } else {
        toast.error(response.message || "Failed to delete transaction.");
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      toast.error("Failed to delete transaction.");
    }
  };

  const fetchLatestPaymentState = async () => {
    const response = await getTransactionsByTrainee(trainee.id);
    if (!response.success || !response.data) return null;

    const raw = response.data;
    const adjusted = adjustPaymentData(
      raw.transactions,
      raw.summary,
      raw.registration_fee_amount,
      raw.payment_mode,
      raw.transaction_id,
      raw.date_of_registration
    );
    const latestTransactions = adjusted.transactions;
    const latestPaidSlots = getPaidPaymentSlots(latestTransactions);
    const latestBalanceDue = Number(adjusted.summary.balance_due);
    const latestNumberOfInstallments = trainee.numberOfInstallments || 4;

    return {
      paidSlots: latestPaidSlots,
      balance: latestBalanceDue,
      nextPaymentTitle: getNextPendingPaymentSlot(
        latestPaidSlots,
        latestNumberOfInstallments,
        latestBalanceDue > 0,
      ),
    };
  };

  const handleImportPayments = async (file: File): Promise<boolean> => {
    try {
      const response = await importTransactions(file);
      if (response.success && response.data) {
        const { imported = 0, skipped = 0, errors = [] } = response.data;
        if (imported > 0) {
          toast.success(
            `Successfully imported ${imported} payment(s)${skipped ? `; skipped ${skipped}` : ""}.`
          );
          setReloadKey((previous) => previous + 1);
          return true;
        } else {
          const firstErr = errors && errors[0]
            ? `Row ${errors[0].row}: ${errors[0].error || 'Validation error'}`
            : "";
          toast.error(
            `Import failed. ${skipped} skipped. ${firstErr}`
          );
          return false;
        }
      } else {
        toast.error(response.message || "Failed to import payments.");
        return false;
      }
    } catch (error: unknown) {
      console.error("Failed to import payments:", error);
      const isAxiosErr = error && typeof error === 'object' && 'response' in error;
      const responseMessage = isAxiosErr
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      const errorMsg = error instanceof Error ? error.message : "";
      toast.error(
        responseMessage || errorMsg || "Failed to import transactions."
      );
      return false;
    }
  };

  const handleSavePayment = async (payment: {
    amount: string;
    mode: string;
    transactionId: string;
    date: string;
    title?: string;
  }): Promise<boolean> => {
    if (editingTransaction) {
      if (!editingTransaction.id) {
        toast.error("Transaction ID is missing. Cannot update.");
        return false;
      }

      if (editingTransaction.id.startsWith("reg-fee-")) {
        const success = await handleSaveTraineeField({
          regFeeAmount: payment.amount,
          regFeeMode: payment.mode,
          regFeeTransactionId: payment.transactionId,
          regFeePaymentDate: payment.date,
        });
        if (success) {
          toast.success("Registration fee updated successfully!");
          setReloadKey((previous) => previous + 1);
          return true;
        }
        toast.error("Failed to update registration fee.");
        return false;
      }

      try {
        const targetTitle = payment.title || editingTransaction.title;
        const response = await updateTransaction(editingTransaction.id, {
          title: targetTitle,
          amount: payment.amount,
          mode: payment.mode,
          transactionId: payment.transactionId,
          date: payment.date,
        });

        if (response.success && response.data) {
          const normalizedTarget = normalizePaymentSlotTitle(targetTitle);
          if (normalizedTarget === "Registration Fee") {
            await handleSaveTraineeField({
              regFeeAmount: payment.amount,
              regFeeMode: payment.mode,
              regFeeTransactionId: payment.transactionId,
              regFeePaymentDate: payment.date,
            });
          }

          toast.success("Transaction updated successfully!");
          setReloadKey((previous) => previous + 1);
          return true;
        }
        toast.error(response.message || "Failed to update transaction.");
      } catch (error) {
        console.error("Failed to update transaction:", error);
        toast.error("Failed to update transaction.");
      }
      return false;
    }

    try {
      const latest = await fetchLatestPaymentState();
      if (!latest) {
        toast.error("Unable to verify the latest payment status.");
        return false;
      }

      const requestedTitle = normalizePaymentSlotTitle(payment.title);
      if (latest.balance <= 0 || !latest.nextPaymentTitle) {
        toast.error(`${trainee.name} has already paid all fees.`);
        setReloadKey((previous) => previous + 1);
        return false;
      }
      if (!requestedTitle || requestedTitle !== latest.nextPaymentTitle) {
        toast.error(
          requestedTitle
            ? `${requestedTitle} is already paid. Next is ${latest.nextPaymentTitle}.`
            : `The next payable item is ${latest.nextPaymentTitle}.`,
        );
        setReloadKey((previous) => previous + 1);
        return false;
      }

      const amount = Number(payment.amount.replace(/,/g, ""));
      if (!Number.isFinite(amount) || amount <= 0 || amount > latest.balance) {
        toast.error(
          `Amount cannot exceed the remaining balance of Rs ${latest.balance.toLocaleString("en-IN")}.`,
        );
        return false;
      }

      const response = await createTransaction({
        traineeId: trainee.id,
        title: requestedTitle,
        amount: payment.amount,
        mode: payment.mode,
        date: payment.date,
        transactionId: payment.transactionId,
        status: "Paid",
      });

      if (response.success && response.data) {
        toast.success("Payment recorded successfully!");
        setReloadKey((previous) => previous + 1);
        return true;
      }
      toast.error(response.message || "Failed to record payment.");
    } catch (error) {
      console.error("Failed to record payment:", error);
      toast.error("Failed to record payment.");
    }
    return false;
  };

  if (isLoading && !summary) {
    return (
      <div className="rounded-2xl border border-[#dddddd] bg-white p-8 text-center text-sm font-semibold text-gray-500">
        Loading payment data...
      </div>
    );
  }

  if (loadError || !summary) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm font-semibold text-red-600">
        {loadError || "Payment data is unavailable."}
      </div>
    );
  }

  const displayTotal = Number(summary.total_fees);
  const displayDiscount = Number(summary.discount);
  const displayPayable = Number(summary.payable_amount);
  const displayBalance = Number(summary.balance_due);
  const displayPaid = Number(summary.total_paid);
  const displayPercent = Math.min(100, Math.max(0, Number(summary.progress_percent)));
  const displayStatus = summary.payment_status;
  const canRecordPayment = displayBalance > 0 && Boolean(nextPaymentTitle);

  let statusBadgeStyle = "bg-[#fef7e0] text-[#b06000]"; // default/pending/unpaid style
  if (displayStatus === "Fully Paid") {
    statusBadgeStyle = "bg-[#e6f4ea] text-[#137333]";
  } else if (displayStatus === "Partially Paid") {
    statusBadgeStyle = "bg-[#efe4ff] text-[#895eff]";
  }

  return (
    <div className="space-y-4 select-none">
      {/* 4 Stats Cards */}
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#dddddd] bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold text-[#8a8a8a]">Total Fees</p>
          <p className="mt-1 text-2xl font-extrabold text-[#141414]">
            ₹{displayTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-2xl border border-[#dddddd] bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold text-[#8a8a8a]">Discount</p>
          <p className="mt-1 text-2xl font-extrabold text-[#f97316]">
            {displayDiscount > 0 ? `-₹${displayDiscount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : "₹0"}
          </p>
        </div>
        <div className="rounded-2xl border border-[#dddddd] bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold text-[#8a8a8a]">Payable Amount</p>
          <p className="mt-1 text-2xl font-extrabold text-[#141414]">
            ₹{displayPayable.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-2xl border border-[#141414] bg-[#111111] p-4 shadow-2xs text-white">
          <p className="text-xs font-semibold text-[#bcbcbc]">
            {summary?.isOverpaid ? "Advance/Overpaid Amount" : "Balance Due"}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-white">
            ₹{(summary?.isOverpaid ? Number(summary.overpaidAmount) : displayBalance).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Payment Progress Bar */}
      <div className="rounded-2xl border border-[#dddddd] bg-white p-4 shadow-2xs">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-bold text-[#4d4d4d]">Payment Progress</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeStyle}`}>
            {displayStatus}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#e9e9e9] overflow-hidden">
          <div
            style={{ width: `${Math.min(100, displayPercent)}%` }}
            className="h-full rounded-full bg-[#f97316]"
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-semibold">
          <span className="text-[#141414]">
            Paid{" "}
            <span className="text-[#ff5b21]">
              ₹{displayPaid.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>{" "}
            of ₹{displayPayable.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[#ff5b21]">{displayPercent}% complete</span>
        </div>
      </div>

      {/* Transaction History Section Component */}
      <TransactionCardList
        transactions={transactions}
        traineeName={trainee.name}
        onRecordPaymentClick={handleOpenRecordModal}
        onEditTransaction={handleOpenEditModal}
        onDeleteTransaction={handleDeleteTransaction}
        onImportClick={() => setIsImportModalOpen(true)}
        canRecordPayment={canRecordPayment}
        nextPaymentTitle={nextPaymentTitle}
      />

      {/* Remarks Section (dynamic width aligned with transaction cards) */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div
          className={`rounded-2xl border border-[#dddddd] bg-white p-4 shadow-2xs ${
            transactions.length === 1
              ? "col-span-1 md:col-span-1 xl:col-span-1"
              : transactions.length === 2
                ? "col-span-1 md:col-span-2 xl:col-span-2"
                : "col-span-1 md:col-span-2 xl:col-span-3"
          }`}
        >
          <p className="text-xs font-semibold text-[#8a8a8a]">Remarks</p>
          <p className="mt-1 text-xs font-semibold text-[#141414] leading-relaxed whitespace-pre-wrap">
            {remarks || "No remarks provided."}
          </p>
        </div>
      </div>

      {/* Record / Edit Payment Modal Component */}
      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSave={handleSavePayment}
        initialData={editingTransaction}
        maxAllowedAmount={
          editingTransaction
            ? displayBalance + Number(String(editingTransaction.amount).replace(/,/g, ""))
            : displayBalance
        }
        paymentTitle={nextPaymentTitle}
        paidPaymentSlots={paidPaymentSlots}
        numberOfInstallments={numberOfInstallments}
        hasBalance={displayBalance > 0}
      />

      {/* Import Payments Modal Component */}
      <ImportPaymentModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportPayments}
      />
    </div>
  );
}

