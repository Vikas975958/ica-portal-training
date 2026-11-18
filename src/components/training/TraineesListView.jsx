"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "antd";
import { ArrowRight, ChevronDown, Check, Download, MoreVertical, Plus, Search, SlidersHorizontal, Upload, X } from "lucide-react";
import { ArrowdownIcon, ArrowupIcon, HoldIconsvg, CalendarIcon } from "@/utils/svgicon";
import { TableSkeleton } from "@/components/ui/Loader";
import TableScrollContainer from "@/components/ui/TableScrollContainer";
import ActionDropdown from "@/components/ui/ActionDropdown";
import { AssignProgramModal } from "./TraineeActions";
import { getAllTrainees, downloadTraineeTemplate, getAllPrograms } from "@/api/get";
import { updateTraineeStatus } from "@/api/patch";
import { deleteTrainee } from "@/api/delete";
import { importTrainees } from "@/api/post";
import { useRequestDeduplicator } from "@/lib/hooks/useRequestDeduplicator";
import { toast } from "react-toastify";
const statusStyleMap = {
  Completed: "bg-[#e3f7ed] text-[#00b060]",
  Active: "bg-[#dbeafe] text-[#2563eb]",
  "On Hold": "bg-[#fef3c7] text-[#d97706]",
  Enrolled: "bg-[#f3e8ff] text-[#9333ea]",
  Dropped: "bg-[#ffe4e6] text-[#e11d48]",
  Inactive: "bg-[#fee2e2] text-[#ef4444]"
};
const defaultFilters = {
  status: "All",
  program: "",
  duration: "All",
  startDate: "",
  endDate: ""
};
function CustomProgramSelect({
  value,
  onChange,
  options
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return <div className="relative select-none" ref={containerRef}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className={`h-10 w-full flex items-center justify-between rounded-xl border bg-white px-3.5 text-xs transition cursor-pointer ${isOpen ? "border-[#ff5b21] ring-2 ring-[#ff5b21]/15 text-gray-900" : "border-gray-200 text-gray-700 hover:border-gray-300"}`}>
        <span className={value ? "text-gray-900 font-semibold" : "text-gray-400 font-normal"}>
          {value || "--Select Program--"}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#ff5b21]" : ""}`} />
      </button>

      {isOpen && <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-gray-100 bg-white p-1.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-top-2 duration-150 max-h-56 overflow-y-auto no-scrollbar">
          <button type="button" onClick={() => {
        onChange("");
        setIsOpen(false);
      }} className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${!value ? "bg-[#fff7f4] text-[#ff5b21]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
            <span>--Select Program--</span>
            {!value && <Check className="h-3.5 w-3.5 text-[#ff5b21]" />}
          </button>
          {options.map(option => {
        const isSelected = value === option;
        return <button key={option} type="button" onClick={() => {
          onChange(option);
          setIsOpen(false);
        }} className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${isSelected ? "bg-[#fff7f4] text-[#ff5b21]" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"}`}>
                <span>{option}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#ff5b21]" />}
              </button>;
      })}
        </div>}
    </div>;
}
const statusFilterOptions = ["All", "Completed", "Active", "Enrolled", "On Hold", "Dropped", "Inactive"];
const durationFilterOptions = ["All", "15 Days", "45 Days", "1 Month", "2 Months", "3 Months", "6 Months", "12 Months"];
const AVATAR_GRADIENTS = ["from-[#ff6ed6] to-[#ffc2f6] text-gray-900", "from-[#c084fc] to-[#f3e8ff] text-gray-900", "from-[#fb923c] to-[#ffedd5] text-gray-900", "from-[#38bdf8] to-[#bae6fd] text-gray-900", "from-[#f43f5e] to-[#fecdd3] text-gray-900", "from-[#818cf8] to-[#e0e7ff] text-gray-900", "from-[#facc15] to-[#fef08a] text-gray-900", "from-[#34d399] to-[#d1fae5] text-gray-900", "from-[#38bdf8] to-[#e0f2fe] text-gray-900", "from-[#2dd4bf] to-[#ccfbf1] text-gray-900"];
function getAvatarClass(id) {
  const index = Math.abs(id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

// Debounce hook
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
export default function TraineesListView() {
  const router = useRouter();
  const [trainees, setTrainees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 400);
  const {
    shouldFetch,
    forceRefetch
  } = useRequestDeduplicator();
  const programMapRef = useRef({});
  const [openActionId, setOpenActionId] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [onHoldDialog, setOnHoldDialog] = useState(null);
  const [dropDialog, setDropDialog] = useState(null);
  const [statusDialog, setStatusDialog] = useState(null);
  const [nextStatus, setNextStatus] = useState("Completed");
  const [onHoldReason, setOnHoldReason] = useState("");

  // Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const handleImportCSV = async e => {
    e.preventDefault();
    if (!importFile) {
      toast.error("Please select a CSV or XLSX file to import.");
      return;
    }
    setIsImporting(true);
    try {
      const response = await importTrainees(importFile);
      if (response.success) {
        toast.success("Trainees imported successfully!");
        setIsImportModalOpen(false);
        setImportFile(null);
        setCurrentPage(1);
        forceRefetch();
        loadData(); // Refresh list
      } else {
        toast.error(response.message || "Failed to import trainees.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to import trainees.");
    } finally {
      setIsImporting(false);
    }
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 10;
  const [isAssignProgramOpen, setIsAssignProgramOpen] = useState(false);
  const [assignTraineeName, setAssignTraineeName] = useState("Trainee");
  const startDateInputRef = useRef(null);
  const endDateInputRef = useRef(null);
  const modalStartDateInputRef = useRef(null);
  const modalEndDateInputRef = useRef(null);
  const [programFilterOptions, setProgramFilterOptions] = useState([]);
  const [programMap, setProgramMap] = useState({});
  useEffect(() => {
    programMapRef.current = programMap;
  }, [programMap]);
  useEffect(() => {
    async function fetchPrograms() {
      try {
        const res = await getAllPrograms();
        if (res.success && res.data) {
          const map = {};
          const options = [];
          for (const p of res.data) {
            const name = p.title || p.id;
            if (p.id) map[p.id] = name;
            if (name) options.push(name);
          }
          setProgramMap(map);
          setProgramFilterOptions(options);
        }
      } catch (err) {
        console.error("Failed to load programs for filters", err);
      }
    }
    fetchPrograms();
  }, []);
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // We now rely on the pre-fetched programMap from state.
      // If loadData is called before programs finish, it will use an empty map.
      // However, filter changes usually happen after load.

      // API Parameters
      const params = {
        page: String(currentPage),
        limit: String(itemsPerPage)
      };
      const searchWords = debouncedSearchText.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const isMultiWordSearch = searchWords.length > 1;
      if (isMultiWordSearch) {
        params.search = searchWords[0];
        params.limit = "200";
        params.page = "1";
      } else if (debouncedSearchText) {
        params.search = debouncedSearchText.trim();
      }
      if (appliedFilters.status && appliedFilters.status !== "All" && appliedFilters.status !== "--") {
        params.status = appliedFilters.status;
      }
      if (appliedFilters.program && appliedFilters.program !== "All" && appliedFilters.program !== "--") {
        const pId = Object.keys(programMapRef.current).find(k => programMapRef.current[k] === appliedFilters.program);
        if (pId) {
          params.program_id = pId;
        } else {
          params.program_id = appliedFilters.program; // fallback in case it's already an ID
        }
      }
      if (appliedFilters.duration && appliedFilters.duration !== "All" && appliedFilters.duration !== "--") {
        params.duration = appliedFilters.duration;
      }
      if (appliedFilters.startDate) {
        params.startDate = appliedFilters.startDate;
      }
      if (appliedFilters.endDate) {
        params.endDate = appliedFilters.endDate;
      }

      // API-side sorting
      if (sortField) {
        const sortByMap = {
          name: "name",
          dor: "date_of_registration"
        };
        params.sortBy = sortByMap[sortField];
        params.sortOrder = sortDirection.toUpperCase(); // ASC or DESC
      }
      const response = await getAllTrainees(params);
      let rawList = [];
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          rawList = response.data;
        } else if (response.data && typeof response.data === "object" && "trainees" in response.data && Array.isArray(response.data.trainees)) {
          rawList = response.data.trainees;
        }
      }

      // If multi-word search and first word returned 0 candidates, fallback to searching by last word (e.g. surname)
      if (isMultiWordSearch && rawList.length === 0) {
        const fallbackParams = {
          ...params,
          search: searchWords[searchWords.length - 1],
          limit: "200",
          page: "1"
        };
        const fallbackRes = await getAllTrainees(fallbackParams);
        if (fallbackRes.success && fallbackRes.data) {
          if (Array.isArray(fallbackRes.data)) {
            rawList = fallbackRes.data;
          } else if (fallbackRes.data && typeof fallbackRes.data === "object" && "trainees" in fallbackRes.data && Array.isArray(fallbackRes.data.trainees)) {
            rawList = fallbackRes.data.trainees;
          }
        }
      }

      // If multi-word search, filter candidate list to ensure all search words match full name, email, or code
      if (isMultiWordSearch && rawList.length > 0) {
        rawList = rawList.filter(t => {
          const fullName = `${t.first_name || ""} ${t.last_name || ""}`.toLowerCase();
          const email = String(t.email || "").toLowerCase();
          const code = String(t.trainee_code || t.id || "").toLowerCase();
          return searchWords.every(word => fullName.includes(word) || email.includes(word) || code.includes(word));
        });
      }
      const mapRawTrainee = t => {
        const traineeId = String(t.id || "");
        const shortId = t.trainee_code ? String(t.trainee_code).toUpperCase() : traineeId ? traineeId.slice(-4).toUpperCase() : "";
        const programName = t.program?.name || t.program?.title || programMapRef.current[t.program_id || ""] || "";
        const programDuration = t.program?.duration || "";
        return {
          id: t.id,
          name: `${t.first_name || ""} ${t.last_name || ""}`.trim() || "Trainee",
          email: t.email || "",
          phone: t.phone || "",
          program: programName,
          duration: programDuration,
          dor: t.date_of_registration || (t.createdAt ? t.createdAt.split('T')[0] : ""),
          status: t.status || "Enrolled",
          initial: t.first_name ? t.first_name.charAt(0).toUpperCase() : "T",
          avatarClass: getAvatarClass(t.id),
          traineeCode: shortId
        };
      };
      if (isMultiWordSearch) {
        const total = rawList.length;
        setTotalRecords(total);
        setTotalPages(Math.max(1, Math.ceil(total / itemsPerPage)));
        const pagedList = rawList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
        setTrainees(pagedList.map(mapRawTrainee));
      } else {
        const mappedList = rawList.map(mapRawTrainee);

        // Set Pagination Meta
        const pag = response.pagination || (response.data && typeof response.data === "object" && "pagination" in response.data ? response.data.pagination : null);
        if (pag) {
          const count = pag.total ?? pag.totalRecords ?? mappedList.length;
          setTotalRecords(count);
          const pages = pag.totalPages ?? Math.max(1, Math.ceil(count / itemsPerPage));
          setTotalPages(pages);
        } else {
          // Fallback if no meta
          setTotalRecords(mappedList.length);
          setTotalPages(1);
        }
        setTrainees(mappedList);
      }
    } catch (err) {
      console.error("Failed to load trainees:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearchText, appliedFilters, sortField, sortDirection]);

  // Reset page to 1 when debounced search, filters, or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText, appliedFilters, sortField, sortDirection]);

  // Fetch data when filters/page/sort changes
  useEffect(() => {
    const fetchKey = {
      currentPage,
      itemsPerPage,
      debouncedSearchText,
      appliedFilters,
      sortField,
      sortDirection
    };
    if (shouldFetch(fetchKey)) {
      loadData();
    }
  }, [loadData, shouldFetch, currentPage, itemsPerPage, debouncedSearchText, appliedFilters, sortField, sortDirection]);
  const getDesktopActionKey = id => `desktop-${id}`;
  const getMobileActionKey = id => `mobile-${id}`;
  const openDatePicker = inputRef => {
    const input = inputRef.current;
    if (!input) {
      return;
    }
    const pickerInput = input;
    if (typeof pickerInput.showPicker === "function") {
      pickerInput.showPicker();
      return;
    }
    input.focus();
    input.click();
  };
  const formatDateLabel = (dateValue, fallback) => {
    if (!dateValue) {
      return fallback;
    }
    const parsedDate = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      return fallback;
    }
    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };
  const hasActiveFilters = useMemo(() => {
    return appliedFilters.status !== "All" || appliedFilters.program !== "" || appliedFilters.duration !== "All" || appliedFilters.startDate !== "" || appliedFilters.endDate !== "";
  }, [appliedFilters]);
  const handleSortClick = field => {
    if (sortField === field) {
      setSortDirection(current => current === "asc" ? "desc" : "asc");
      return;
    }
    setSortField(field);
    setSortDirection("asc");
  };
  const handleOpenFilterModal = () => {
    setIsFilterModalOpen(true);
  };
  const handleFilterChange = updates => {
    setAppliedFilters(current => ({
      ...current,
      ...updates
    }));
    setCurrentPage(1);
  };
  const handleClearFilters = () => {
    setAppliedFilters(defaultFilters);
    setCurrentPage(1);
  };
  const openOnHoldDialog = (id, name) => {
    setOpenActionId(null);
    setOnHoldReason("");
    setOnHoldDialog({
      id,
      name
    });
  };
  const handleConfirmOnHold = async () => {
    if (!onHoldDialog) {
      return;
    }
    try {
      await updateTraineeStatus(onHoldDialog.id, "On Hold");
      setTrainees(current => current.map(trainee => trainee.id === onHoldDialog.id ? {
        ...trainee,
        status: "On Hold"
      } : trainee));
    } catch (err) {
      console.error("Failed to set trainee on hold:", err);
    }
    setOnHoldDialog(null);
  };
  const openDropDialog = (id, name) => {
    setOpenActionId(null);
    setDropDialog({
      id,
      name
    });
  };
  const openStatusDialog = (id, name, status) => {
    setOpenActionId(null);
    setNextStatus(status);
    setStatusDialog({
      id,
      name
    });
  };
  const handleConfirmDrop = async () => {
    if (!dropDialog) {
      return;
    }
    try {
      await deleteTrainee(dropDialog.id);
      setTrainees(current => current.filter(trainee => trainee.id !== dropDialog.id));
      toast.success(`Trainee "${dropDialog.name}" deleted successfully!`);
    } catch (err) {
      console.error("Failed to delete trainee:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to delete trainee.");
    }
    setDropDialog(null);
  };
  const handleConfirmStatusUpdate = async () => {
    if (!statusDialog) {
      return;
    }
    try {
      await updateTraineeStatus(statusDialog.id, nextStatus);
      setTrainees(current => current.map(trainee => trainee.id === statusDialog.id ? {
        ...trainee,
        status: nextStatus
      } : trainee));
      toast.success(`Status updated to "${nextStatus}" successfully!`);
    } catch (err) {
      console.error("Failed to update trainee status:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to update trainee status.");
    }
    setStatusDialog(null);
  };
  return <div className="mx-auto w-full space-y-4 md:space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[#1b1b1b] md:text-3xl">Trainees</h1>
        <p className="text-sm text-[#8e8e8e]">Manage all trainees from one place.</p>
      </div>

      {/* Mobile Top Controls */}
      <div className="flex flex-col gap-2.5 md:hidden w-full">
        <div className="flex items-center gap-2 w-full">
          <div className="relative flex-1 flex items-center border border-gray-200 bg-white rounded-xl px-3.5 py-2.5 focus-within:border-[#ff5b21] transition">
            <Search className="h-4 w-4 text-[#ff5b21] shrink-0 mr-2" />
            <input type="text" placeholder="Search...." value={searchText} onChange={e => {
            setSearchText(e.target.value);
          }} className="text-xs text-gray-800 bg-transparent border-none p-0 focus:ring-0 focus:outline-none placeholder-gray-400 w-full" />
          </div>

          <button type="button" onClick={handleOpenFilterModal} className="relative h-10 w-10 border border-gray-200 rounded-xl bg-white flex items-center justify-center text-gray-700 hover:border-gray-300 transition shrink-0 cursor-pointer">
            <SlidersHorizontal className="h-4 w-4" />
            {hasActiveFilters && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#ff5b21]" />}
          </button>

          <button type="button" onClick={() => {
          setImportFile(null);
          setIsImportModalOpen(true);
        }} className="h-10 w-10 border border-gray-200 rounded-xl bg-white flex items-center justify-center text-gray-700 hover:border-gray-300 transition shrink-0 cursor-pointer" title="Import Trainees">
            <Download className="h-4 w-4" />
          </button>

        
        </div>

        <Link href="/dashboard/add-trainee" className="w-full bg-[#ff5b21] hover:bg-[#e04f1a] text-white font-bold py-3 rounded-[10px] transition text-xs flex items-center justify-center gap-1.5 shadow-sm select-none">
          <Plus className="h-4 w-4" />
          Add Trainees
        </Link>
      </div>

      {/* Desktop Controls */}
      <div className="relative z-30 hidden md:flex flex-row items-center justify-between gap-3">
        <div className="relative w-full md:max-w-[290px]">
          <Input value={searchText} onChange={event => {
          setSearchText(event.target.value);
        }} placeholder="Search...." allowClear={true} prefix={<Search className="h-4 w-4 text-[#ff5b21] mr-1.5" />} style={{
          borderRadius: "10px",
          height: "40px"
        }} className="w-full !border-[#dedede] bg-white hover:!border-[#ff5b21] focus-within:!border-[#ff5b21] focus-within:!shadow-none [&>input]:text-sm [&>input]:text-[#333] [&>input]:placeholder-gray-400" />
        </div>

        <div className="w-auto flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            <div className="relative inline-flex h-10 items-center justify-between rounded-[10px] border border-[#dedede] bg-white px-3.5 text-[13px] font-medium text-[#8f8f8f] transition hover:bg-[#fbfbfb] cursor-pointer min-w-[315px] select-none">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <CalendarIcon className="h-4.5 w-4.5 text-[#ff5b21] shrink-0" />
                <button type="button" onClick={() => openDatePicker(startDateInputRef)} className="cursor-pointer bg-transparent p-0 text-[#707070] font-normal hover:text-gray-900 transition flex-1 text-left whitespace-nowrap text-xs sm:text-[13px]">
                  {formatDateLabel(appliedFilters.startDate, "Start Date")}
                </button>

                <svg width="20" height="10" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#ff5b21] shrink-0 mx-1">
                  <path d="M1 5H19M19 5L14.5 1M19 5L14.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                <button type="button" onClick={() => openDatePicker(endDateInputRef)} className="cursor-pointer bg-transparent p-0 text-[#707070] font-normal hover:text-gray-900 transition flex-1 text-right whitespace-nowrap text-xs sm:text-[13px]">
                  {formatDateLabel(appliedFilters.endDate, "End Date")}
                </button>
              </div>

              {(appliedFilters.startDate || appliedFilters.endDate) && <button type="button" onClick={e => {
              e.stopPropagation();
              setAppliedFilters(current => ({
                ...current,
                startDate: "",
                endDate: ""
              }));
              setCurrentPage(1);
            }} className="ml-2.5 flex items-center justify-center text-gray-400 hover:text-gray-700 transition shrink-0" title="Clear dates">
                  <X className="h-3.5 w-3.5" />
                </button>}

              <input ref={startDateInputRef} type="date" value={appliedFilters.startDate} onChange={event => {
              setAppliedFilters(current => ({
                ...current,
                startDate: event.target.value
              }));
            }} className="pointer-events-none absolute h-0 w-0 opacity-0" tabIndex={-1} aria-hidden />
              <input ref={endDateInputRef} type="date" value={appliedFilters.endDate} onChange={event => {
              setAppliedFilters(current => ({
                ...current,
                endDate: event.target.value
              }));
            }} className="pointer-events-none absolute h-0 w-0 opacity-0" tabIndex={-1} aria-hidden />
            </div>

            <button type="button" onClick={handleOpenFilterModal} className="inline-flex h-10 w-auto items-center justify-center gap-1.5 rounded-[10px] border border-[#dedede] bg-white px-3 text-xs font-semibold text-gray-800 transition hover:bg-[#fbfbfb] cursor-pointer select-none">
              <div className="relative flex items-center justify-center">
                <SlidersHorizontal className="h-4 w-4 text-gray-700" />
                {hasActiveFilters && <span className="absolute -top-1 -right-0.5 h-2 w-2 rounded-[10px] bg-[#ff5b21] border border-white shrink-0" />}
              </div>
              Filter
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => {
            setImportFile(null);
            setIsImportModalOpen(true);
          }} className="inline-flex h-10 w-auto items-center justify-center gap-1.5 rounded-[10px] border border-[#dedede] bg-white px-3 text-xs font-semibold text-gray-800 transition hover:bg-[#fbfbfb] cursor-pointer">
              <Download className="h-4 w-4 text-gray-700" />
              Import
            </button>

            {/* <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex h-10 w-auto items-center justify-center gap-1.5 rounded-2xl border border-[#dedede] bg-white px-3 text-xs font-semibold text-gray-800 transition hover:bg-[#fbfbfb] cursor-pointer"
             >
              <Download className="h-4 w-4 text-gray-700" />
              Export
             </button> */}

            <Link href="/dashboard/add-trainee" className="inline-flex h-10 w-auto items-center justify-center gap-1.5 rounded-[10px] bg-[#ff5b21] px-4 text-xs font-semibold text-white transition hover:bg-[#ec4f16]">
              <Plus className="h-4 w-4" />
              Add Trainees
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden bg-white rounded-2xl overflow-hidden shadow-none md:block select-none ">
        <TableScrollContainer allowHorizontalScroll={false}>
          {isLoading && trainees.length > 0 && <div className="absolute inset-0 z-30 flex items-center justify-center bg-transparent">
              <div className="flex flex-col items-center gap-2">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#ff5b21] border-t-transparent" />
                <span className="text-xs font-semibold text-gray-500">Loading trainees...</span>
              </div>
            </div>}
          <table className="w-full table-fixed text-center select-none relative">
            <colgroup>
              <col className="w-[4%]" />
              <col className="w-[7%]" />
              <col className="w-[19%]" />
              <col className="w-[21%]" />
              <col className="w-[19%]" />
              <col className="w-[13%]" />
              <col className="w-[10%]" />
              <col className="w-[7%]" />
            </colgroup>
            <thead className="sticky top-0 z-20 shadow-xs [&_th]:align-middle">
              <tr className="bg-[#0b0b0b] text-[11px] font-semibold tracking-wider text-white">
                <th className="sticky top-0 z-20 bg-[#0b0b0b] px-2 py-3.5 text-center lg:px-3">#</th>
                <th className="sticky top-0 z-20 bg-[#0b0b0b] px-2 py-3.5 text-center lg:px-3">ID</th>
                <th className="sticky top-0 z-20 bg-[#0b0b0b] px-2 py-3.5 text-center lg:px-3">
                  <button type="button" onClick={() => handleSortClick("name")} className="inline-flex w-full items-center justify-center gap-1.5 cursor-pointer select-none bg-transparent border-0 outline-none p-0 text-inherit">
                    <span>Name</span>
                    <div className="flex flex-col gap-[2px] shrink-0">
                      <ArrowupIcon className={`w-[8px] h-[5px] transition-colors ${sortField === "name" && sortDirection === "asc" ? "text-[#fe5200]" : "text-[#c8c8c8]"}`} />
                      <ArrowdownIcon className={`w-[8px] h-[5px] transition-colors ${sortField === "name" && sortDirection === "desc" ? "text-[#fe5200]" : "text-[#c8c8c8]"}`} />
                    </div>
                  </button>
                </th>
                <th className="sticky top-0 z-20 bg-[#0b0b0b] px-2 py-3.5 text-center lg:px-3">Email</th>
                <th className="sticky top-0 z-20 bg-[#0b0b0b] px-2 py-3.5 text-center lg:px-3">Program</th>
                <th className="sticky top-0 z-20 bg-[#0b0b0b] px-2 py-3.5 text-center lg:px-3">
                  <button type="button" onClick={() => handleSortClick("dor")} className="inline-flex w-full items-center justify-center gap-1.5 cursor-pointer select-none bg-transparent border-0 outline-none p-0 text-inherit">
                    <span>D.O.R</span>
                    <div className="flex flex-col gap-[2px] shrink-0">
                      <ArrowupIcon className={`w-[8px] h-[5px] transition-colors ${sortField === "dor" && sortDirection === "asc" ? "text-[#fe5200]" : "text-[#c8c8c8]"}`} />
                      <ArrowdownIcon className={`w-[8px] h-[5px] transition-colors ${sortField === "dor" && sortDirection === "desc" ? "text-[#fe5200]" : "text-[#c8c8c8]"}`} />
                    </div>
                  </button>
                </th>
                <th className="sticky top-0 z-20 bg-[#0b0b0b] px-2 py-3.5 text-center">Status</th>
                <th className="sticky top-0 z-20 bg-[#0b0b0b] px-2 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-gray-700 lg:text-xs [&_td]:align-middle">
              {isLoading ? <tr>
                  <td colSpan={8} className="px-5 py-12 text-center bg-white">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#ff5b21] border-t-transparent" />
                      <span className="text-xs text-gray-400 font-medium">
                        Loading trainees…
                      </span>
                    </div>
                  </td>
                </tr> : trainees.length === 0 ? <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400 font-medium text-sm">
                    <div className="flex flex-col items-center justify-center gap-1.5 text-gray-400">
                      <span className="text-sm font-semibold text-gray-500">No Data Available</span>
                      <span className="text-[11px] text-gray-400">No trainees match your search or filter criteria.</span>
                    </div>
                  </td>
                </tr> : trainees.map((trainee, index) =>
            // console.log(trainee,"dataaa"),
            <tr key={trainee.id} onClick={() => router.push(`/dashboard/trainees/${trainee.id}/details`)} className={`hover:bg-gray-50/80 transition cursor-pointer ${index === trainees.length - 1 ? "[&>td]:border-b-0" : "[&>td]:border-b [&>td]:border-[#E5E7EB]"}`}>
                    <td className="px-2 py-3 text-center font-medium text-black lg:px-3">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-2 py-3 text-center font-medium text-gray-800 lg:px-3">
                      <span className="block truncate" title={trainee.id}>
                        {trainee.traineeCode || trainee.id}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-left lg:px-4">
                      <div className="group flex min-w-0 items-center justify-start gap-2">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr text-[14px] font-extrabold uppercase shadow-xs ${trainee.avatarClass}`}>
                          {trainee.initial}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900 transition group-hover:text-[#ff5b21]" title={trainee.name}>
                            {trainee.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center lg:px-3">
                      <p className="truncate font-medium text-gray-800" title={trainee.email}>
                        {trainee.email}
                      </p>
                    </td>
                    <td className="px-2 py-3 text-center lg:px-3">
                      <p className="truncate font-medium text-gray-900" title={trainee.program}>
                        {trainee.program || "—"}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-center font-medium text-gray-900 lg:px-3">
                      {trainee.dor}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className={`inline-flex max-w-full items-center justify-center rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyleMap[trainee.status] || statusStyleMap.Enrolled}`}>
                        {trainee.status}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center" onClick={e => e.stopPropagation()}>
                      <ActionDropdown open={openActionId === getDesktopActionKey(trainee.id)} onOpenChange={isOpen => setOpenActionId(isOpen ? getDesktopActionKey(trainee.id) : null)} trigger={<MoreVertical className="h-4 w-4" />} triggerClassName="rounded p-1 text-[#8c8c8c] hover:bg-[#f7f7f7] hover:text-[#333] cursor-pointer" menuClassName="w-28 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 text-left shadow-[0_4px_20px_rgba(0,0,0,0.12)] animate-in fade-in duration-150" ariaLabel={`Open actions for ${trainee.name}`}>
                        <button type="button" onClick={() => {
                    setOpenActionId(null);
                    router.push(`/dashboard/trainees/${trainee.id}/details`);
                  }} className="block w-full px-3.5 py-1.5 text-left text-xs font-semibold text-[#2d2d2d] transition hover:bg-[#f8f8f8] cursor-pointer">
                          View
                        </button>
                        <button type="button" onClick={() => {
                    setOpenActionId(null);
                    router.push(`/dashboard/trainees/${trainee.id}/edit`);
                  }} className="block w-full px-3.5 py-1.5 text-left text-xs font-semibold text-[#2d2d2d] transition hover:bg-[#f8f8f8] cursor-pointer">
                          Edit
                        </button>
                        <button type="button" onClick={() => openOnHoldDialog(trainee.id, trainee.name)} className="block w-full px-3.5 py-1.5 text-left text-xs font-semibold text-[#2d2d2d] transition hover:bg-[#f8f8f8] cursor-pointer">
                          On Hold
                        </button>
                      </ActionDropdown>
                    </td>
                  </tr>)}
            </tbody>
          </table>
        </TableScrollContainer>
      </div>

      <div className="space-y-3 md:hidden">
        {isLoading ? <div className="bg-white border border-[#ececec] rounded-2xl p-8 flex flex-col items-center justify-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#ff5b21] border-t-transparent" />
            <span className="text-xs text-gray-400 font-medium">
              Loading trainees…
            </span>
          </div> : trainees.length === 0 ? <div className="bg-white border border-[#ececec] rounded-2xl p-6 text-center text-gray-400 font-semibold text-xs shadow-sm">
            No Data Available
          </div> : trainees.map((trainee, index) => <div key={`${trainee.id}-${index}`} role="button" tabIndex={0} onClick={() => router.push(`/dashboard/trainees/${trainee.id}/details`)} onKeyDown={event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/dashboard/trainees/${trainee.id}/details`);
        }
      }} className="block rounded-2xl border border-[#e8e8e8] bg-white p-4 shadow-[0_2px_10px_rgba(16,16,16,0.04)] transition hover:border-[#ffc3af]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold uppercase shrink-0 bg-gradient-to-tr shadow-xs ${trainee.avatarClass}`}>
                  {trainee.initial}
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-gray-900">{trainee.name}</p>
                  <p className="text-[11px] text-[#8c8c8c]">ID: {trainee.traineeCode || trainee.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusStyleMap[trainee.status] || statusStyleMap.Enrolled}`}>
                  {trainee.status}
                </span>
                <ActionDropdown open={openActionId === getMobileActionKey(trainee.id)} onOpenChange={isOpen => setOpenActionId(isOpen ? getMobileActionKey(trainee.id) : null)} trigger={<MoreVertical className="h-4 w-4" />} triggerClassName="rounded p-1 text-[#8c8c8c] hover:bg-[#f7f7f7] hover:text-[#333] cursor-pointer" menuClassName="w-24 overflow-hidden rounded-lg border border-[#e7e7e7] bg-white text-left shadow-lg" ariaLabel={`Open actions for ${trainee.name}`}>
                  <button type="button" onClick={() => {
                setOpenActionId(null);
                router.push(`/dashboard/trainees/${trainee.id}/details`);
              }} className="block w-full px-3 py-2 text-xs font-medium text-[#2d2d2d] transition hover:bg-[#f8f8f8] cursor-pointer">
                    View
                  </button>
                  <button type="button" onClick={() => {
                setOpenActionId(null);
                router.push(`/dashboard/trainees/${trainee.id}/edit`);
              }} className="block w-full px-3 py-2 text-xs font-medium text-[#2d2d2d] transition hover:bg-[#f8f8f8] cursor-pointer">
                    Edit
                  </button>
                  <button type="button" onClick={() => openOnHoldDialog(trainee.id, trainee.name)} className="block w-full px-3 py-2 text-xs font-medium text-[#2d2d2d] transition hover:bg-[#f8f8f8] cursor-pointer">
                    On Hold
                  </button>
                </ActionDropdown>
              </div>
            </div>

            {/* Inner Light Gray Details Box matching design reference */}
            <div className="mt-3  rounded-xl p-3.5 flex flex-col gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900">Email</p>
                <p className="mt-0.5 text-xs text-gray-600 font-medium truncate" title={trainee.email}>
                  {trainee.email}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-0.5">
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-gray-900">Program</p>
                  <p className="mt-0.5 text-xs text-gray-600 font-medium truncate" title={trainee.program}>
                    {trainee.program}
                  </p>
                </div>
                <div className="min-w-0 border-l border-gray-200 pl-3">
                  <p className="text-xs font-bold text-gray-900">D.O.R</p>
                  <p className="mt-0.5 text-xs text-gray-600 font-medium whitespace-nowrap">
                    {trainee.dor}
                  </p>
                </div>
              </div>
            </div>
          </div>)}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 select-none text-xs">
        <button type="button" disabled={currentPage === 1 || isLoading} onClick={() => {
        setOpenActionId(null);
        setCurrentPage(c => Math.max(1, c - 1));
      }} className="flex items-center text-gray-500 hover:text-gray-900 font-semibold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer">
          ← Previous
        </button>

        <div className={`flex items-center gap-1.5 cursor-pointer ${isLoading ? "pointer-events-none opacity-50" : ""}`}>
          {Array.from({
          length: totalPages
        }, (_, i) => i + 1).map(p => <button key={p} type="button" disabled={isLoading} onClick={() => {
          setOpenActionId(null);
          setCurrentPage(p);
        }} className={`h-7 w-7 rounded-lg font-bold flex items-center justify-center transition border ${currentPage === p ? "bg-[#ff5b21] text-white border-[#ff5b21]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
              {p}
            </button>)}
        </div>

        <button type="button" disabled={currentPage === totalPages || totalPages === 0 || isLoading} onClick={() => {
        setOpenActionId(null);
        setCurrentPage(c => Math.min(totalPages, c + 1));
      }} className="flex items-center text-gray-500 hover:text-gray-900 font-semibold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer">
          Next →
        </button>
      </div>

      {isFilterModalOpen && <div className="fixed inset-0 z-[70] flex justify-end">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/45 backdrop-blur-[1px] transition-opacity" onClick={() => setIsFilterModalOpen(false)} />

          {/* Drawer content pinned to right side */}
          <div className="relative z-10 flex h-full w-full max-w-[400px] flex-col justify-between bg-white shadow-2xl animate-in slide-in-from-right duration-250 select-none">
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <h2 className="text-2xl font-bold text-[#1d1d1d]">
                  Filters
                </h2>
                <button type="button" onClick={handleClearFilters} className="text-xs font-semibold text-[#ff5b21] hover:underline cursor-pointer">
                  Clear Filters
                </button>
              </div>

              <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-4 space-y-6">
                <div className="space-y-3 md:hidden">
                  <p className="text-sm font-semibold text-[#242424]">Filters By Date of Registration</p>
                  <div className="relative flex h-11 w-full items-center justify-between rounded-xl border border-[#dedede] bg-white px-3.5 text-[13px] font-medium text-[#8f8f8f] select-none">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <CalendarIcon className="h-4.5 w-4.5 text-[#ff5b21] shrink-0" />
                      <button type="button" onClick={() => openDatePicker(modalStartDateInputRef)} className="cursor-pointer bg-transparent p-0 text-[#707070] font-normal hover:text-gray-900 transition text-left whitespace-nowrap text-[13px]">
                        {formatDateLabel(appliedFilters.startDate, "Start Date")}
                      </button>
                    </div>

                    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#ff5b21] shrink-0 mx-2">
                      <path d="M1 5H19M19 5L14.5 1M19 5L14.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>

                    <div className="flex items-center justify-end min-w-0 flex-1">
                      <button type="button" onClick={() => openDatePicker(modalEndDateInputRef)} className="cursor-pointer bg-transparent p-0 text-[#707070] font-normal hover:text-gray-900 transition text-right whitespace-nowrap text-[13px]">
                        {formatDateLabel(appliedFilters.endDate, "End Date")}
                      </button>
                    </div>

                    <input ref={modalStartDateInputRef} type="date" value={appliedFilters.startDate} onChange={event => handleFilterChange({
                  startDate: event.target.value
                })} className="pointer-events-none absolute h-0 w-0 opacity-0" tabIndex={-1} aria-hidden />
                    <input ref={modalEndDateInputRef} type="date" value={appliedFilters.endDate} onChange={event => handleFilterChange({
                  endDate: event.target.value
                })} className="pointer-events-none absolute h-0 w-0 opacity-0" tabIndex={-1} aria-hidden />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-900">Status</h3>
                  <div className="space-y-2">
                    {statusFilterOptions.map(statusOption => {
                  const isSelected = appliedFilters.status === statusOption;
                  return <button key={statusOption} type="button" onClick={() => handleFilterChange({
                    status: statusOption
                  })} className="flex w-full items-center justify-between text-left text-xs font-medium text-gray-700 hover:text-gray-900 cursor-pointer py-1">
                          <span>{statusOption}</span>
                          <span className={`h-4 w-4 rounded-full border flex items-center justify-center transition ${isSelected ? "border-[#ff5b21]" : "border-gray-300"}`}>
                            {isSelected && <span className="h-2 w-2 rounded-full bg-[#ff5b21]" />}
                          </span>
                        </button>;
                })}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-900">Program</h3>
                  <CustomProgramSelect value={appliedFilters.program} onChange={val => handleFilterChange({
                program: val
              })} options={programFilterOptions} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-900">Duration</h3>
                  <div className="space-y-2">
                    {durationFilterOptions.map(durationOption => {
                  const isSelected = appliedFilters.duration === durationOption;
                  return <button key={durationOption} type="button" onClick={() => handleFilterChange({
                    duration: durationOption
                  })} className="flex w-full items-center justify-between text-left text-xs font-medium text-gray-700 hover:text-gray-900 cursor-pointer py-1">
                          <span>{durationOption}</span>
                          <span className={`h-4 w-4 rounded-full border flex items-center justify-center transition ${isSelected ? "border-[#ff5b21]" : "border-gray-300"}`}>
                            {isSelected && <span className="h-2 w-2 rounded-full bg-[#ff5b21]" />}
                          </span>
                        </button>;
                })}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 px-6 py-4 bg-white">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setIsFilterModalOpen(false)} className="h-10 flex-1 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition">
                  Close
                </button>
                <button type="button" onClick={() => setIsFilterModalOpen(false)} className="h-10 flex-1 rounded-xl bg-[#ff5b21] text-xs font-semibold text-white hover:bg-[#ec4f16] cursor-pointer transition shadow-sm">
                  {totalRecords} results
                </button>
              </div>
            </div>
          </div>
        </div>}

      {isImportModalOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[380px] rounded-2xl bg-white p-5 shadow-2xl relative">
            <button type="button" onClick={() => setIsImportModalOpen(false)} className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#0c101d] text-white hover:opacity-90 cursor-pointer transition z-10" aria-label="Close modal">
              <X className="h-4 w-4 stroke-[3.2px]" />
            </button>

            <form onSubmit={handleImportCSV} className="space-y-4 pt-2">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-[#262626]">Import Trainees</h2>
                <p className="mt-1 text-xs text-[#9b9b9b]">
                  Select a CSV or XLSX file containing trainee records to import them.
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center bg-[#fafafa] hover:bg-gray-50 transition cursor-pointer relative">
                <input type="file" accept=".csv,.xlsx,.xls" onChange={e => {
              if (e.target.files && e.target.files[0]) {
                setImportFile(e.target.files[0]);
              }
            }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500 font-semibold text-center truncate max-w-full px-2">
                  {importFile ? importFile.name : "Click to select a file"}
                </span>
                <span className="text-[10px] text-gray-400 mt-1">
                  Supports CSV, XLSX, XLS
                </span>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setIsImportModalOpen(false)} className="h-10 flex-1 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition">
                  Cancel
                </button>
                <button type="submit" disabled={isImporting || !importFile} className="h-10 flex-1 rounded-xl bg-[#ff5b21] text-xs font-semibold text-white hover:bg-[#ec4f16] cursor-pointer transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
                  {isImporting ? <>
                      <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Importing...
                    </> : "Upload & Import"}
                </button>
              </div>
            </form>
          </div>
        </div>}
      <AssignProgramModal isOpen={isAssignProgramOpen} onClose={() => setIsAssignProgramOpen(false)} traineeName={assignTraineeName} />

      {onHoldDialog && <div className="fixed inset-0 z-[72] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[340px] rounded-xl bg-white p-4 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff8b2d] text-white">
                <HoldIconsvg className="h-10 w-10" />
              </div>
              <h3 className="mt-3 text-[22px] font-semibold text-[#222]">Put Trainee on Hold?</h3>
              <p className="mt-1 text-[11px] text-[#8f8f8f]">
                This trainee will be marked as On Hold and their training progress will be paused
                until reactivated.
              </p>
            </div>

            <textarea value={onHoldReason} onChange={event => setOnHoldReason(event.target.value)} placeholder="Reason" className="mt-4 h-20 w-full rounded-md border border-[#e3e3e3] px-3 py-2 text-xs outline-none transition focus:border-[#ff5b21]" />

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setOnHoldDialog(null)} className="h-8 rounded-md border border-[#d0d0d0] text-xs font-medium text-[#2f2f2f] cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmOnHold} className="h-8 rounded-md bg-[#ff5b21] text-xs font-medium text-white cursor-pointer">
                On Hold
              </button>
            </div>
          </div>
        </div>}
    </div>;
}