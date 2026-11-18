"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { Search, ChevronDown, Plus, Filter, Upload, X } from "lucide-react";
import { Input } from "antd";
import { AddEntryModal, MobileFilterDrawer, TraineeDropdownItem } from "@/components/transactions/TransactionModals";
import { ArrowdownIcon, ArrowupIcon, CalendarIcon } from "@/utils/svgicon";
import { getTransactionsByTrainee, getFeeLedgers } from "@/api/get";
import { createTransaction } from "@/api/post";
import { useRequestDeduplicator } from "@/lib/hooks/useRequestDeduplicator";
import TableScrollContainer from "@/components/ui/TableScrollContainer";
import { PAYMENT_SLOT_TITLES, getNextPendingPaymentSlot, getPaidPaymentSlots, normalizePaymentSlotTitle } from "@/lib/paymentSchedule";

// --- Types ---

const toAmount = value => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
};
const extractTraineeProfiles = data => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  const record = data;
  const collection = record.trainees ?? record.rows ?? record.data;
  return Array.isArray(collection) ? collection : [];
};
const extractLedgerPagination = data => {
  if (!data || typeof data !== "object") return undefined;
  const pagination = data.pagination;
  return pagination && typeof pagination === "object" ? pagination : undefined;
};
const fetchTransactionPage = async params => {
  const requestedPage = Math.max(1, Number(params.page) || 1);
  const requestedLimit = Math.max(1, Number(params.limit) || 10);
  const searchWords = (params.search || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  const isMultiWordSearch = searchWords.length > 1;
  const needsClientFiltering = Boolean(params.status) || isMultiWordSearch;
  const ledgerParams = {
    page: needsClientFiltering ? "1" : String(requestedPage),
    limit: needsClientFiltering ? "10000" : String(requestedLimit)
  };
  if (params.search) ledgerParams.search = isMultiWordSearch ? searchWords[0] : params.search;
  if (params.sortBy) ledgerParams.sortBy = params.sortBy;
  if (params.sortOrder) ledgerParams.sortOrder = params.sortOrder;
  if (params.startDate) ledgerParams.startDate = params.startDate;
  if (params.endDate) ledgerParams.endDate = params.endDate;
  let response = await getFeeLedgers(ledgerParams);
  let responseData = response.data;
  let rows = Array.isArray(responseData?.rows) ? responseData.rows : [];
  let rawSummary = responseData?.summary;
  if (isMultiWordSearch && rows.length === 0) {
    const fallbackParams = {
      ...ledgerParams,
      search: searchWords[searchWords.length - 1]
    };
    const fallbackRes = await getFeeLedgers(fallbackParams);
    const fallbackData = fallbackRes.data;
    if (Array.isArray(fallbackData?.rows) && fallbackData.rows.length > 0) {
      response = fallbackRes;
      responseData = fallbackData;
      rows = fallbackData.rows;
      rawSummary = fallbackData.summary;
    }
  }
  const registrationFees = new Map();
  let items = rows.map(row => mapFeeLedgerRow(row, registrationFees));
  if (isMultiWordSearch) {
    items = items.filter(item => {
      const name = (item.traineeName || "").toLowerCase();
      const email = String(item.traineeEmail || "").toLowerCase();
      const code = String(item.traineeCode || item.traineeId || item.id || "").toLowerCase();
      return searchWords.every(word => name.includes(word) || email.includes(word) || code.includes(word));
    });
  }
  if (params.status) {
    const statusMap = {
      "Fully Paid": "Paid",
      "Partially Paid": "Partially Paid",
      Unpaid: "Pending"
    };
    items = items.filter(item => item.status === statusMap[params.status]);
  }
  if (needsClientFiltering) {
    const totalRecords = items.length;
    const start = (requestedPage - 1) * requestedLimit;
    return {
      items: items.slice(start, start + requestedLimit),
      totalRecords,
      totalPages: Math.max(1, Math.ceil(totalRecords / requestedLimit)),
      summary: rawSummary
    };
  }
  const pagination = responseData?.pagination || response.pagination || extractLedgerPagination(responseData);
  const totalRecords = pagination?.total ?? pagination?.totalRecords ?? items.length;
  return {
    items,
    totalRecords,
    totalPages: pagination?.totalPages ?? Math.max(1, Math.ceil(totalRecords / requestedLimit)),
    summary: rawSummary
  };
};
const mapFeeLedgerRow = (row, registrationFees) => {
  const traineeId = row.trainee_id || row.id || "";
  const firstName = row.first_name || "";
  const lastName = row.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Unknown";
  const payable = toAmount(row.to_pay ?? row.total_to_pay);
  const ledgerRegistrationFee = row.registration_fee_amount ?? row.registration_fee;
  const profileRegistrationFee = row.trainee?.registration_fee_amount ?? registrationFees.get(traineeId);
  const usesProfileRegistrationFee = ledgerRegistrationFee === null || ledgerRegistrationFee === undefined;
  const registrationFee = toAmount(ledgerRegistrationFee ?? profileRegistrationFee);
  const rawTotalPaid = toAmount(row.total_paid);
  const registrationFeeAdjustment = usesProfileRegistrationFee ? registrationFee : 0;
  const totalPaid = rawTotalPaid + registrationFeeAdjustment;
  const rawBalance = row.balance === null || row.balance === undefined ? payable - rawTotalPaid : toAmount(row.balance);
  const balance = Math.max(0, rawBalance - registrationFeeAdjustment);
  const instalments = row.instalments || row.installments || [];
  const getInstalment = index => instalments[index] === undefined || instalments[index] === null ? null : toAmount(instalments[index]);
  const paidPaymentSlots = new Set(row.paidPaymentSlots || []);

  // Keep modal eligibility aligned with the values visibly rendered in the
  // table, even when the backend transaction titles are missing or duplicated.
  if (registrationFee > 0) paidPaymentSlots.add("Registration Fee");
  [0, 1, 2, 3, 4, 5].forEach(index => {
    const installmentAmount = getInstalment(index);
    if (installmentAmount !== null && installmentAmount > 0) {
      paidPaymentSlots.add(`Installment ${index + 1}`);
    }
  });
  return {
    id: traineeId,
    traineeId,
    traineeName: fullName,
    initial: firstName ? firstName.charAt(0).toUpperCase() : fullName.charAt(0).toUpperCase() || "T",
    avatarBg: getAvatarColor(traineeId),
    toPay: payable,
    reg: registrationFee,
    inst1: getInstalment(0),
    inst2: getInstalment(1),
    inst3: getInstalment(2),
    inst4: getInstalment(3),
    inst5: getInstalment(4),
    inst6: getInstalment(5),
    balance,
    status: normaliseStatus(row.payment_status, balance, totalPaid),
    dor: row.date_of_registration || row.trainee?.date_of_registration || (row.createdAt ? row.createdAt.split("T")[0] : ""),
    paidPaymentSlots: PAYMENT_SLOT_TITLES.filter(title => paidPaymentSlots.has(title)),
    // The transactions table exposes six installment columns, so its payment
    // modal must always show the same complete six-installment schedule.
    maxInstallments: 6,
    traineeCode: row.trainee_code || row.traineeCode || row.trainee?.trainee_code || "",
    traineeEmail: row.email || row.trainee_email || row.trainee?.email || ""
  };
};

// --- Debounce hook for optimization ---
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- Avatar colour helpers ---

const AVATAR_COLORS = ["bg-orange-100 text-orange-700", "bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700", "bg-yellow-100 text-yellow-700", "bg-emerald-100 text-emerald-700", "bg-pink-100 text-pink-700", "bg-red-100 text-red-700", "bg-indigo-100 text-indigo-700", "bg-teal-100 text-teal-700", "bg-cyan-100 text-cyan-700"];
function getAvatarColor(id) {
  const index = Math.abs(id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

// Normalise backend payment_status → UI status
function normaliseStatus(raw, balance, totalPaid) {
  if (balance === 0) return "Paid";
  if (totalPaid > 0 && balance > 0) return "Partially Paid";
  return "Pending";
}
function isRegFee(titleOrType) {
  if (!titleOrType) return false;
  const t = String(titleOrType).trim().toLowerCase();
  return t === "registration fee" || t === "registration_fee" || t === "reg_fee";
}

// --- Page ---
export default function TransactionsPage() {
  const {
    shouldFetch,
    forceRefetch
  } = useRequestDeduplicator();

  // Search and debounce optimization to prevent duplicate API fetches on keypresses
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Trigger state to coordinate fetches without duplicate renders
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    totalToCollect: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    fullyClearedCount: 0,
    totalRecords: 0,
    hasLoadedOnce: false,
    isLoading: true
  });
  const onStatsUpdate = useCallback(newStats => {
    setStats(prev => ({
      ...prev,
      ...newStats,
      isLoading: false
    }));
  }, []);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const startDateInputRef = useRef(null);
  const endDateInputRef = useRef(null);
  const openDatePicker = useCallback(ref => {
    if (ref.current) {
      if (typeof ref.current.showPicker === "function") {
        ref.current.showPicker();
      } else {
        ref.current.focus();
        ref.current.click();
      }
    }
  }, []);
  const formatDateLabel = useCallback((dateValue, defaultLabel) => {
    if (!dateValue) return defaultLabel;
    const parsedDate = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) return defaultLabel;
    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }, []);
  const handleClearFilters = useCallback(() => {
    setStartDate("");
    setEndDate("");
    setStatusFilter("");
    setSearch("");
    setRefreshTrigger(prev => prev + 1);
  }, []);
  const onAddEntrySuccess = useCallback(() => {
    setIsAddEntryOpen(false);
    setStartDate("");
    setEndDate("");
    setStatusFilter("");
    setSearch("");
    setRefreshTrigger(prev => prev + 1);
  }, []);
  const [isExporting, setIsExporting] = useState(false);
  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const params = {
        page: "1",
        limit: "10000"
      };
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      if (statusFilter) {
        let mappedStatus = "";
        if (statusFilter === "Paid") mappedStatus = "Fully Paid";else if (statusFilter === "Partially Paid") mappedStatus = "Partially Paid";else if (statusFilter === "Pending") mappedStatus = "Unpaid";
        if (mappedStatus) {
          params.status = mappedStatus;
        }
      }
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }
      const result = await fetchTransactionPage(params);
      const items = result.items;
      if (items.length === 0) {
        toast.error("No data available to export.");
        return;
      }
      const headers = ["#", "Trainee", "To Pay", "Reg.", "Inst 1", "Inst 2", "Inst 3", "Inst 4", "Inst 5", "Inst 6", "Balance", "Status", "Reg Date"];
      const rows = items.map((t, idx) => [idx + 1, t.traineeName, `₹${t.toPay.toLocaleString()}`, `₹${t.reg.toLocaleString()}`, t.inst1 ? `₹${t.inst1.toLocaleString()}` : "—", t.inst2 ? `₹${t.inst2.toLocaleString()}` : "—", t.inst3 ? `₹${t.inst3.toLocaleString()}` : "—", t.inst4 ? `₹${t.inst4.toLocaleString()}` : "—", t.inst5 ? `₹${t.inst5.toLocaleString()}` : "—", t.inst6 ? `₹${t.inst6.toLocaleString()}` : "—", `₹${t.balance.toLocaleString()}`, t.status, t.dor]);
      const csvString = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\r\n");
      const blob = new Blob([csvString], {
        type: "text/csv;charset=utf-8;"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `fee_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("CSV export completed!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export CSV.");
    } finally {
      setIsExporting(false);
    }
  }, [debouncedSearch, statusFilter, startDate, endDate]);
  const formatCur = useCallback(num => {
    const str = Math.floor(num).toString();
    if (str.length <= 3) return `₹${str}`;
    const lastThree = str.substring(str.length - 3);
    const otherNumbers = str.substring(0, str.length - 3);
    const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return `₹${formattedOthers},${lastThree}`;
  }, []);
  return <div className="mx-auto w-full space-y-5">
      {/* Title block */}
      <div>
        <h1 className="text-[22px] font-bold text-[#1f1f1f]">
          Student-wise Transactions
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Fee ledger across all trainees
        </p>
      </div>

      <StatsCards totalToCollect={stats.totalToCollect} totalCollected={stats.totalCollected} totalOutstanding={stats.totalOutstanding} fullyClearedCount={stats.fullyClearedCount} isLoading={stats.isLoading} hasLoadedOnce={stats.hasLoadedOnce} formatCur={formatCur} />

      <FilterControls search={search} setSearch={setSearch} startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} statusFilter={statusFilter} setStatusFilter={setStatusFilter} isExporting={isExporting} handleExportCSV={handleExportCSV} setIsAddEntryOpen={setIsAddEntryOpen} setIsMobileFilterOpen={setIsMobileFilterOpen} startDateInputRef={startDateInputRef} endDateInputRef={endDateInputRef} openDatePicker={openDatePicker} formatDateLabel={formatDateLabel} />

      <TransactionTable debouncedSearch={debouncedSearch} startDate={startDate} endDate={endDate} statusFilter={statusFilter} refreshTrigger={refreshTrigger} isAddEntryOpen={isAddEntryOpen} setIsAddEntryOpen={setIsAddEntryOpen} onStatsUpdate={onStatsUpdate} onAddEntrySuccess={onAddEntrySuccess} formatCur={formatCur} shouldFetch={shouldFetch} forceRefetch={forceRefetch} />

      <MobileFilterDrawer isOpen={isMobileFilterOpen} onClose={() => setIsMobileFilterOpen(false)} startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} statusFilter={statusFilter} setStatusFilter={setStatusFilter} resultsCount={stats.totalRecords} onClear={handleClearFilters} />
    </div>;
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

const StatsCards = React.memo(function StatsCards({
  totalToCollect,
  totalCollected,
  totalOutstanding,
  fullyClearedCount,
  isLoading,
  hasLoadedOnce,
  formatCur
}) {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 select-none">
      <div className="bg-white border border-[#ececec] rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between h-24 sm:h-28">
        <p className="text-xs sm:text-[13px] text-gray-500 font-normal">
          Total to Collect
        </p>
        <p className="text-xl sm:text-[28px] font-bold text-gray-900 leading-none mt-0.5 sm:mt-1">
          {!hasLoadedOnce && isLoading ? "—" : formatCur(totalToCollect)}
        </p>
      </div>

      <div className="bg-white border border-[#ececec] rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between h-24 sm:h-28">
        <p className="text-xs sm:text-[13px] text-gray-500 font-normal">
          Collected
        </p>
        <p className="text-xl sm:text-[28px] font-bold text-[#2e7d32] leading-none mt-0.5 sm:mt-1">
          {!hasLoadedOnce && isLoading ? "—" : formatCur(totalCollected)}
        </p>
      </div>

      <div className="bg-white border border-[#ececec] rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between h-24 sm:h-28">
        <p className="text-xs sm:text-[13px] text-gray-500 font-normal">
          Outstanding
        </p>
        <p className="text-xl sm:text-[28px] font-bold text-[#ff5b21] leading-none mt-0.5 sm:mt-1">
          {!hasLoadedOnce && isLoading ? "—" : formatCur(totalOutstanding)}
        </p>
      </div>

      <div className="bg-[#0c0c0e] rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between h-24 sm:h-28 text-white">
        <p className="text-xs sm:text-[13px] text-gray-300 font-normal">
          Fully Cleared
        </p>
        <p className="text-2xl sm:text-[32px] font-bold text-white leading-none mt-0.5 sm:mt-1">
          {!hasLoadedOnce && isLoading ? "—" : fullyClearedCount}
        </p>
      </div>
    </div>;
});
const FilterControls = React.memo(function FilterControls({
  search,
  setSearch,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  statusFilter,
  setStatusFilter,
  isExporting,
  handleExportCSV,
  setIsAddEntryOpen,
  setIsMobileFilterOpen,
  startDateInputRef,
  endDateInputRef,
  openDatePicker,
  formatDateLabel
}) {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Close status dropdown on outside click
  useEffect(() => {
    function handleOutsideClick(event) {
      const target = event.target;
      if (!target.closest(".status-dropdown-menu") && !target.closest(".status-dropdown-btn")) {
        setIsStatusDropdownOpen(false);
      }
    }
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);
  return <>
      {/* Desktop Filter controls */}
      <div className="hidden md:flex flex-row items-center justify-between gap-3 bg-transparent">
        {/* Search */}
        <div className="relative w-full md:max-w-[290px]">
          <Input value={search} onChange={event => {
          setSearch(event.target.value);
        }} placeholder="Search...." allowClear={true} prefix={<Search className="h-4 w-4 text-[#ff5b21] mr-1.5" />} style={{
          borderRadius: "10px",
          height: "40px"
        }} className="w-full !border-[#dedede] bg-white hover:!border-[#ff5b21] focus-within:!border-[#ff5b21] focus-within:!shadow-none [&>input]:text-sm [&>input]:text-[#333] [&>input]:placeholder-gray-400" />
        </div>

        <div className="flex items-center gap-3 shrink-0 justify-end">
          {/* Date range */}
          <div className="relative inline-flex h-10 items-center justify-between rounded-[10px] border border-[#dedede] bg-white px-3.5 text-[13px] font-medium text-[#8f8f8f] transition hover:bg-[#fbfbfb] cursor-pointer min-w-[315px] select-none">
            <div className="flex items-center gap-1.5 flex-1">
              <CalendarIcon className="h-4.5 w-4.5 text-[#ff5b21] shrink-0" />
              <button type="button" onClick={() => openDatePicker(startDateInputRef)} className="cursor-pointer bg-transparent p-0 text-[#707070] font-normal hover:text-gray-900 transition flex-1 text-left text-xs sm:text-sm whitespace-nowrap">
                {formatDateLabel(startDate, "Start Date")}
              </button>

              <svg width="20" height="10" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#ff5b21] shrink-0 mx-1">
                <path d="M1 5H19M19 5L14.5 1M19 5L14.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              <button type="button" onClick={() => openDatePicker(endDateInputRef)} className="cursor-pointer bg-transparent p-0 text-[#707070] font-normal hover:text-gray-900 transition flex-1 text-right text-xs sm:text-sm whitespace-nowrap">
                {formatDateLabel(endDate, "End Date")}
              </button>
            </div>

            {(startDate || endDate) && <button type="button" onClick={e => {
            e.stopPropagation();
            setStartDate("");
            setEndDate("");
          }} className="ml-3 flex items-center justify-center text-gray-400 hover:text-gray-700 transition" title="Clear dates">
                <X className="h-3.5 w-3.5" />
              </button>}

            <input ref={startDateInputRef} type="date" value={startDate} onChange={e => {
            setStartDate(e.target.value);
          }} className="pointer-events-none absolute h-0 w-0 opacity-0" tabIndex={-1} aria-hidden />
            <input ref={endDateInputRef} type="date" value={endDate} onChange={e => {
            setEndDate(e.target.value);
          }} className="pointer-events-none absolute h-0 w-0 opacity-0" tabIndex={-1} aria-hidden />
          </div>

          {/* Status Dropdown */}
          <div className="relative shrink-0 h-[38px]">
            <button type="button" onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)} className="status-dropdown-btn flex items-center justify-between gap-3 border border-gray-200 bg-white rounded-xl px-3.5 py-2.5 text-xs text-gray-600 font-semibold cursor-pointer outline-none focus:border-[#ff5b21] transition min-w-[90px] select-none h-full">
              <span>{statusFilter || "Status"}</span>
              {statusFilter ? <X className="h-3 w-3 text-gray-400 hover:text-gray-600 transition shrink-0" onClick={e => {
              e.stopPropagation();
              setStatusFilter("");
            }} /> : <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${isStatusDropdownOpen ? "rotate-180" : ""}`} />}
            </button>

            {isStatusDropdownOpen && <div className="status-dropdown-menu absolute right-0 mt-1.5 w-40 bg-white border border-gray-100 rounded-[10px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] py-1.5 z-40 max-h-48 overflow-y-auto no-scrollbar">
                {[{
              label: "All Statuses",
              value: ""
            }, {
              label: "Paid",
              value: "Paid"
            }, {
              label: "Partially Paid",
              value: "Partially Paid"
            }, {
              label: "Pending",
              value: "Pending"
            }].map(item => <button key={item.label} type="button" onClick={() => {
              setStatusFilter(item.value);
              setIsStatusDropdownOpen(false);
            }} className={`block w-full px-3.5 py-2 text-left text-xs transition cursor-pointer font-semibold ${statusFilter === item.value ? "bg-[#ff5b21]/5 text-[#ff5b21]" : "text-gray-700 hover:bg-gray-50"}`}>
                    {item.label}
                  </button>)}
              </div>}
          </div>
          <button type="button" disabled={isExporting} onClick={handleExportCSV} className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-gray-200 hover:border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition shadow-sm cursor-pointer h-[38px] select-none disabled:opacity-50">
            {isExporting ? <div className="h-3.5 w-3.5 animate-spin rounded-full border border-gray-400 border-t-transparent" /> : <Upload className="h-3.5 w-3.5" />}
            Export
          </button>

          {/* Add Entry */}
          <button type="button" onClick={() => setIsAddEntryOpen(true)} className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-[#ff5b21] hover:bg-[#e04f1a] px-4 py-2 text-xs font-semibold text-white transition shadow-sm cursor-pointer h-[38px] select-none">
            <Plus className="h-4 w-4" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Mobile Filter controls */}
      <div className="flex flex-col gap-2.5 md:hidden w-full">
        <div className="flex items-center gap-2.5 w-full">
          <div className="relative flex-1 flex items-center border border-gray-200 bg-white rounded-xl px-3 py-2.5 focus-within:border-[#ff5b21] transition">
            <Search className="h-4 w-4 text-[#ff5b21] shrink-0 mr-2" />
            <input type="text" placeholder="Search..." value={search} onChange={e => {
            setSearch(e.target.value);
          }} className="text-xs text-gray-800 bg-transparent border-none p-0 focus:ring-0 focus:outline-none placeholder-gray-400 w-full" />
          </div>
          <button type="button" disabled={isExporting} onClick={handleExportCSV} className="flex items-center justify-center p-2.5 border border-gray-200 bg-white rounded-xl text-gray-600 hover:text-gray-900 shadow-sm cursor-pointer transition shrink-0 disabled:opacity-50" title="Export Transactions">
            {isExporting ? <div className="h-4 w-4 animate-spin rounded-full border border-gray-400 border-t-transparent" /> : <Upload className="h-4 w-4" />}
          </button>
          <button type="button" onClick={() => setIsMobileFilterOpen(true)} className={`flex items-center justify-center p-2.5 border rounded-xl shadow-sm cursor-pointer transition shrink-0 ${startDate || endDate || statusFilter ? "border-[#ff5b21] bg-[#ff5b21]/5 text-[#ff5b21]" : "border-gray-200 bg-white text-gray-600"}`}>
            <Filter className="h-4 w-4" />
          </button>
        </div>

        <button type="button" onClick={() => setIsAddEntryOpen(true)} className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#ff5b21] hover:bg-[#e04f1a] py-3 text-xs font-semibold text-white transition shadow-sm cursor-pointer select-none">
          <Plus className="h-4 w-4" />
          Add Entry
        </button>
      </div>
    </>;
});
function TransactionTable({
  debouncedSearch,
  startDate,
  endDate,
  statusFilter,
  refreshTrigger,
  isAddEntryOpen,
  setIsAddEntryOpen,
  onStatsUpdate,
  onAddEntrySuccess,
  formatCur,
  shouldFetch,
  forceRefetch
}) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState(null);
  const [expandedCardIds, setExpandedCardIds] = useState([]);
  const itemsPerPage = 10;
  const toggleCard = useCallback(id => {
    setExpandedCardIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  }, []);
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: String(currentPage),
        limit: String(itemsPerPage)
      };
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      if (statusFilter) {
        let mappedStatus = "";
        if (statusFilter === "Paid") mappedStatus = "Fully Paid";else if (statusFilter === "Partially Paid") mappedStatus = "Partially Paid";else if (statusFilter === "Pending") mappedStatus = "Unpaid";
        if (mappedStatus) {
          params.status = mappedStatus;
        }
      }
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }
      if (sortConfig) {
        const sortByMap = {
          traineeName: "name",
          dor: "date_of_registration"
        };
        const apiSortBy = sortByMap[sortConfig.key];
        if (apiSortBy) {
          params.sortBy = apiSortBy;
          params.sortOrder = sortConfig.direction.toUpperCase();
        }
      }
      const result = await fetchTransactionPage(params);
      let summaryData = {
        totalToCollect: 0,
        totalCollected: 0,
        totalOutstanding: 0,
        fullyClearedCount: 0,
        totalRecords: result.totalRecords,
        hasLoadedOnce: true
      };
      if (result.summary) {
        summaryData.totalToCollect = Number(result.summary.total_to_collect || 0);
        summaryData.totalCollected = Number(result.summary.collected || 0);
        summaryData.totalOutstanding = Number(result.summary.outstanding || 0);
        summaryData.fullyClearedCount = Number(result.summary.fully_cleared || 0);
      } else {
        const sumToCollect = result.items.reduce((sum, transaction) => sum + transaction.toPay, 0);
        const sumOutstanding = result.items.reduce((sum, transaction) => sum + transaction.balance, 0);
        summaryData.totalToCollect = sumToCollect;
        summaryData.totalCollected = Math.max(0, sumToCollect - sumOutstanding);
        summaryData.totalOutstanding = sumOutstanding;
        summaryData.fullyClearedCount = result.items.filter(transaction => transaction.balance === 0).length;
      }
      onStatsUpdate(summaryData);
      setTotalRecords(result.totalRecords);
      setTotalPages(result.totalPages);
      setTransactions(result.items);
    } catch (err) {
      console.error("Failed to load transaction data:", err);
      toast.error("Failed to load transaction data.");
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, statusFilter, startDate, endDate, sortConfig, onStatsUpdate]);

  // Reset page when search, filters, or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, startDate, endDate, sortConfig]);

  // Execute unified data loading based on search, pagination, and trigger dependencies
  useEffect(() => {
    const fetchKey = {
      currentPage,
      itemsPerPage,
      debouncedSearch,
      statusFilter,
      startDate,
      endDate,
      sortConfig,
      refreshTrigger
    };
    if (shouldFetch(fetchKey)) {
      loadData();
    }
  }, [loadData, refreshTrigger, shouldFetch, currentPage, itemsPerPage, debouncedSearch, statusFilter, startDate, endDate, sortConfig]);
  const handleSort = useCallback(key => {
    setSortConfig(prevConfig => {
      let direction = "asc";
      if (prevConfig?.key === key && prevConfig.direction === "asc") {
        direction = "desc";
      }
      return {
        key,
        direction
      };
    });
  }, []);

  // Trainee list for Add Entry modal (Memoized to prevent mapper recalculation on every render)
  const traineeDropdownList = useMemo(() => {
    return transactions.map(t => ({
      id: t.traineeId,
      name: t.traineeName,
      balance: t.balance,
      paidPaymentSlots: t.paidPaymentSlots,
      maxInstallments: t.maxInstallments,
      traineeCode: t.traineeCode
    }));
  }, [transactions]);

  // Add Entry handler
  const handleAddEntry = useCallback(async entry => {
    const currentTrainee = transactions.find(transaction => transaction.traineeId === entry.traineeId);
    const requestedSlot = normalizePaymentSlotTitle(entry.installment);
    if (!currentTrainee || currentTrainee.balance <= 0) {
      toast.error(`${entry.traineeName} has already paid all fees.`);
      return false;
    }
    const expectedSlot = getNextPendingPaymentSlot(currentTrainee.paidPaymentSlots, currentTrainee.maxInstallments);
    if (!requestedSlot || requestedSlot !== expectedSlot) {
      toast.error(expectedSlot ? `The next payable item is ${expectedSlot}.` : "No pending installment is available.");
      return false;
    }
    try {
      const ledgerResponse = await getTransactionsByTrainee(entry.traineeId);
      if (!ledgerResponse.success || !ledgerResponse.data) {
        toast.error("Unable to verify the latest payment status.");
        return false;
      }
      const livePaidSlots = getPaidPaymentSlots(ledgerResponse.data.transactions, currentTrainee.paidPaymentSlots);
      const liveExpectedSlot = getNextPendingPaymentSlot(livePaidSlots, currentTrainee.maxInstallments);
      const summaryBalance = Number(ledgerResponse.data.summary?.balance_due);
      const liveBalance = Number.isFinite(summaryBalance) ? Math.min(currentTrainee.balance, Math.max(0, summaryBalance)) : currentTrainee.balance;
      if (liveBalance <= 0 || !liveExpectedSlot) {
        toast.error(`${entry.traineeName} has already paid all fees.`);
        forceRefetch();
        return false;
      }
      if (requestedSlot !== liveExpectedSlot) {
        toast.error(`${requestedSlot} is already paid. Next is ${liveExpectedSlot}.`);
        forceRefetch();
        return false;
      }
      if (entry.amount > liveBalance) {
        toast.error(`Amount cannot exceed the remaining balance of ₹${liveBalance.toLocaleString("en-IN")}.`);
        return false;
      }
      const response = await createTransaction({
        traineeId: entry.traineeId,
        title: entry.installment,
        amount: String(entry.amount),
        mode: entry.mode,
        date: entry.date,
        transactionId: entry.transactionId || undefined,
        status: "Paid"
      });
      if (response.success) {
        toast.success(`Payment of ₹${entry.amount.toLocaleString()} for "${entry.traineeName}" recorded!`);
        onAddEntrySuccess();
        return true;
      } else {
        toast.error(response.message || "Failed to record payment.");
        return false;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to record payment.");
      return false;
    }
  }, [transactions, forceRefetch, onAddEntrySuccess]);
  const paginatedTransactions = transactions;
  return <>
      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-none overflow-hidden select-none">
        <TableScrollContainer>
          <table className="min-w-[1100px] w-full table-fixed text-left select-none relative">
            <colgroup>
              <col className="w-12" />
              <col className="w-48" />
              <col className="w-24" />
              <col className="w-20" />
              <col className="w-20" />
              <col className="w-20" />
              <col className="w-20" />
              <col className="w-20" />
              <col className="w-20" />
              <col className="w-20" />
              <col className="w-24" />
              <col className="w-28" />
            </colgroup>
            <thead className="sticky top-0 z-20 shadow-xs select-none">
              <tr className="bg-[#0b0b0b] text-[11px] font-semibold tracking-wider text-white">
                <th className="px-5 py-3.5 w-12 text-center bg-[#0b0b0b] sticky top-0 z-20">
                  #
                </th>
                <th className="px-5 py-3.5 w-48 bg-[#0b0b0b] sticky top-0 z-20 cursor-pointer select-none outline-none focus:outline-none active:outline-none" onClick={() => handleSort("traineeName")} onMouseDown={e => e.preventDefault()}>
                  <div className="flex items-center gap-1.5 justify-start pointer-events-none select-none">
                    <span>Trainee</span>
                    <div className="flex flex-col gap-[2px] shrink-0">
                      <ArrowupIcon className={`w-[8px] h-[5px] transition-colors ${sortConfig?.key === "traineeName" && sortConfig.direction === "asc" ? "text-[#fe5200]" : "text-[#c8c8c8]"}`} />
                      <ArrowdownIcon className={`w-[8px] h-[5px] transition-colors ${sortConfig?.key === "traineeName" && sortConfig.direction === "desc" ? "text-[#fe5200]" : "text-[#c8c8c8]"}`} />
                    </div>
                  </div>
                </th>
                <th className="px-2 py-3.5 w-24 text-center bg-[#0b0b0b] sticky top-0 z-20">
                  To Pay
                </th>
                <th className="px-2 py-3.5 w-20 text-center bg-[#0b0b0b] sticky top-0 z-20">
                  Reg.
                </th>
                <th className="px-2 py-3.5 w-20 text-center bg-[#0b0b0b] sticky top-0 z-20">
                  Inst 1
                </th>
                <th className="px-2 py-3.5 w-20 text-center bg-[#0b0b0b] sticky top-0 z-20">
                  Inst 2
                </th>
                <th className="px-2 py-3.5 w-20 text-center bg-[#0b0b0b] sticky top-0 z-20">
                  Inst 3
                </th>
                <th className="px-2 py-3.5 w-20 text-center bg-[#0b0b0b] sticky top-0 z-20">
                  Inst 4
                </th>
                <th className="px-2 py-3.5 w-20 text-center bg-[#0b0b0b] sticky top-0 z-20">
                  Inst 5
                </th>
                <th className="px-2 py-3.5 w-20 text-center bg-[#0b0b0b] sticky top-0 z-20">
                  Inst 6
                </th>
                <th className="px-2 py-3.5 w-24 text-center bg-[#0b0b0b] sticky top-0 z-20">
                  Balance
                </th>
                <th className="px-5 py-3.5 w-28 text-center bg-[#0b0b0b] sticky top-0 z-20">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="text-xs text-gray-700">
              {isLoading ? <tr>
                  <td colSpan={12} className="px-5 py-12 text-center bg-white">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#ff5b21] border-t-transparent" />
                      <span className="text-xs text-gray-400 font-medium">
                        Loading transactions…
                      </span>
                    </div>
                  </td>
                </tr> : paginatedTransactions.length === 0 ? <tr>
                  <td colSpan={12} className="px-5 py-10 text-center text-gray-400 font-medium">
                    No transactions found matching the filters.
                  </td>
                </tr> : paginatedTransactions.map((t, index) => <tr key={t.id} className={`hover:bg-gray-50/50 transition ${index === paginatedTransactions.length - 1 ? "[&>td]:border-b-0" : "[&>td]:border-b [&>td]:border-[#E5E7EB]"}`}>
                    <td className="px-5 py-3 text-center text-black font-medium">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full ${t.avatarBg} flex items-center justify-center text-xs font-bold uppercase shrink-0`}>
                          {t.initial}
                        </div>
                        <span className="font-bold text-gray-900">
                          {t.traineeName}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center font-bold text-gray-900">
                      {formatCur(t.toPay)}
                    </td>
                    <td className="px-2 py-3 text-center font-semibold text-gray-500">
                      {formatCur(t.reg)}
                    </td>
                    <td className="px-2 py-3 text-center font-medium text-gray-500">
                      {t.inst1 ? formatCur(t.inst1) : "—"}
                    </td>
                    <td className="px-2 py-3 text-center font-medium text-gray-500">
                      {t.inst2 ? formatCur(t.inst2) : "—"}
                    </td>
                    <td className="px-2 py-3 text-center font-medium text-gray-500">
                      {t.inst3 ? formatCur(t.inst3) : "—"}
                    </td>
                    <td className="px-2 py-3 text-center font-medium text-gray-500">
                      {t.inst4 ? formatCur(t.inst4) : "—"}
                    </td>
                    <td className="px-2 py-3 text-center font-medium text-gray-500">
                      {t.inst5 ? formatCur(t.inst5) : "—"}
                    </td>
                    <td className="px-2 py-3 text-center font-medium text-gray-500">
                      {t.inst6 ? formatCur(t.inst6) : "—"}
                    </td>
                    <td className={`px-2 py-3 text-center font-bold ${t.balance > 0 ? "text-[#ff5b21]" : "text-gray-900"}`}>
                      {t.balance === 0 ? "0" : formatCur(t.balance)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-block w-24 text-center py-1 text-[11px] font-semibold rounded-full ${t.status === "Paid" ? "bg-[#e6f9f0] text-[#10b981]" : t.status === "Partially Paid" ? "bg-[#f3e8ff] text-[#9333ea]" : "bg-[#fff7ed] text-[#ea580c]"}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>)}
            </tbody>
          </table>
        </TableScrollContainer>
      </div>

      {/* Mobile list cards */}
      <div className="lg:hidden space-y-3">
        {isLoading ? <div className="bg-white border border-[#ececec] rounded-2xl p-8 flex flex-col items-center justify-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#ff5b21] border-t-transparent" />
            <span className="text-xs text-gray-400 font-medium">
              Loading transactions…
            </span>
          </div> : paginatedTransactions.length === 0 ? <div className="bg-white border border-[#ececec] rounded-2xl p-6 text-center text-gray-400 font-medium">
            No transactions found matching the filters.
          </div> : paginatedTransactions.map(t => {
        const isExpanded = expandedCardIds.includes(t.id);
        return <div key={t.id} className="bg-white border border-[#ececec] rounded-2xl p-4 shadow-sm flex flex-col gap-4 relative animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full ${t.avatarBg} flex items-center justify-center text-xs font-bold uppercase shrink-0`}>
                      {t.initial}
                    </div>
                    <span className="font-bold text-gray-900 text-sm">
                      {t.traineeName}
                    </span>
                  </div>
                  <span className={`inline-block w-24 text-center py-1 text-[10px] font-semibold rounded-full ${t.status === "Paid" ? "bg-[#e6f9f0] text-[#10b981]" : t.status === "Partially Paid" ? "bg-[#f3e8ff] text-[#9333ea]" : "bg-[#fff7ed] text-[#ea580c]"}`}>
                    {t.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-[#fcfcfd] border border-gray-50 p-3 rounded-xl">
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold tracking-wider">
                      To Pay
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {formatCur(t.toPay)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold tracking-wider">
                      Reg.
                    </p>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5">
                      {formatCur(t.reg)}
                    </p>
                  </div>

                  {isExpanded && <>
                      <div>
                        <p className="text-[10px] text-gray-400 font-semibold tracking-wider">
                          Inst 1
                        </p>
                        <p className="text-sm font-medium text-gray-500 mt-0.5">
                          {t.inst1 ? formatCur(t.inst1) : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-semibold tracking-wider">
                          Inst 2
                        </p>
                        <p className="text-sm font-medium text-gray-500 mt-0.5">
                          {t.inst2 ? formatCur(t.inst2) : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-semibold tracking-wider">
                          Inst 3
                        </p>
                        <p className="text-sm font-medium text-gray-500 mt-0.5">
                          {t.inst3 ? formatCur(t.inst3) : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-semibold tracking-wider">
                          Inst 4
                        </p>
                        <p className="text-sm font-medium text-gray-500 mt-0.5">
                          {t.inst4 ? formatCur(t.inst4) : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-semibold tracking-wider">
                          Inst 5
                        </p>
                        <p className="text-sm font-medium text-gray-500 mt-0.5">
                          {t.inst5 ? formatCur(t.inst5) : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-semibold tracking-wider">
                          Inst 6
                        </p>
                        <p className="text-sm font-medium text-gray-500 mt-0.5">
                          {t.inst6 ? formatCur(t.inst6) : "—"}
                        </p>
                      </div>
                      <div className="col-span-2 border-t border-gray-100 pt-2 mt-1">
                       <p className="text-[10px] text-gray-400 font-semibold tracking-wider">
                          Balance
                        </p>
                        <p className={`text-sm font-bold mt-0.5 ${t.balance > 0 ? "text-[#ff5b21]" : "text-gray-900"}`}>
                          {t.balance === 0 ? "0" : formatCur(t.balance)}
                        </p>
                      </div>
                    </>}
                </div>

                <button type="button" onClick={() => toggleCard(t.id)} className="w-full text-center text-xs font-semibold text-[#ff5b21] hover:text-[#e04f1a] transition pt-1 border-t border-gray-100/50 cursor-pointer">
                  {isExpanded ? "Show Less" : "Show More"}
                </button>
              </div>;
      })}
      </div>

      {/* Pagination */}
      {!isLoading && transactions.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 pt-3 select-none text-xs">
          <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(c => Math.max(1, c - 1))} className="flex items-center  text-gray-500 hover:text-gray-900 font-semibold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer">
            ← Previous
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({
          length: totalPages
        }, (_, i) => i + 1).map(p => <button key={p} type="button" onClick={() => setCurrentPage(p)} className={`h-7 w-7 rounded-lg font-bold flex items-center justify-center transition border ${currentPage === p ? "bg-[#ff5b21] text-white border-[#ff5b21]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
                {p}
              </button>)}
          </div>

          <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} className="flex items-center text-gray-500 hover:text-gray-900 font-semibold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer">
            Next →
          </button>
        </div>}

      {/* Modals */}
      <AddEntryModal isOpen={isAddEntryOpen} onClose={() => setIsAddEntryOpen(false)} onAdd={handleAddEntry} trainees={traineeDropdownList} />
    </>;
}