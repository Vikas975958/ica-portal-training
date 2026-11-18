"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { Plus, X, ChevronDown, Check, Trash2 } from "lucide-react";
import { DeleteIconsvg, EditIconsvg, SortIcon, CalendarIcon } from "@/utils/svgicon";
import type { TraineeProfile } from "./trainingData";
import { PlacementRound } from "@/lib/api/types";
import { getPlacementsByTrainee } from "@/lib/api/get";
import { createPlacement } from "@/lib/api/post";
import { updatePlacement } from "@/lib/api/patch";
import { deletePlacement } from "@/lib/api/delete";
import { useRequestDeduplicator } from "@/lib/hooks/useRequestDeduplicator";
import TableScrollContainer from "@/components/ui/TableScrollContainer";
import { toast } from "react-toastify";

interface PlacementDetailsContentProps {
  trainee: TraineeProfile;
}

const placementResultClassMap: Record<PlacementRound["result"], string> = {
  Selected: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  "On Hold": "bg-amber-100 text-amber-700",
};

interface ResultSelectProps {
  value: string;
  onChange: (val: PlacementRound["result"]) => void;
}

function ResultSelect({ value, onChange }: ResultSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options: Array<PlacementRound["result"]> = ["Selected", "Rejected", "On Hold"];

  return (
    <div className="relative select-none" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-10 w-full flex items-center justify-between rounded-lg border bg-white px-3 text-sm transition cursor-pointer ${
          isOpen
            ? "border-[#ff5b21] ring-2 ring-[#ff5b21]/15 text-gray-900"
            : "border-[#e3e3e3] text-gray-700 hover:border-gray-300"
        }`}
      >
        <span className={value ? "text-gray-900 font-medium" : "text-[#7d7d7d]"}>
          {value || "-- Select Result --"}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#ff5b21]" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 bottom-full mb-1.5 z-50 rounded-xl border border-gray-100 bg-white p-1.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-bottom-2 duration-150">
          {options.map((option) => {
            const isSelected = value === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  isSelected
                    ? "bg-[#fff7f4] text-[#ff5b21]"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span>{option}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#ff5b21]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PlacementDetailsContent({ trainee }: PlacementDetailsContentProps) {
  const [rounds, setRounds] = useState<PlacementRound[]>([]);
  const { shouldFetch } = useRequestDeduplicator();
  const [sortField, setSortField] = useState<"company" | "date">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSortCompany = () => {
    if (sortField === "company") {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField("company");
      setSortDirection("asc");
    }
  };

  const handleSortDate = () => {
    if (sortField === "date") {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField("date");
      setSortDirection("desc");
    }
  };
  const [isAddInterviewModalOpen, setIsAddInterviewModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  // Load placement rounds from API
  useEffect(() => {
    const loadPlacements = async () => {
      try {
        const response = await getPlacementsByTrainee(trainee.id);
        if (response.success && response.data) {
          const raw = response.data;
          const list = Array.isArray(raw)
            ? raw
            : (raw as any).placements || Object.values(raw).find(Array.isArray) || [];
          setRounds(list);
        } else {
          setRounds([]);
        }
      } catch (e) {
        console.error(e);
        setRounds([]);
      }
    };
    if (shouldFetch({ traineeId: trainee.id })) {
      loadPlacements();
    }
  }, [trainee.id, shouldFetch]);

  const sortedRounds = useMemo(() => {
    return [...rounds].sort((a, b) => {
      if (sortField === "company") {
        const cmp = a.company.localeCompare(b.company);
        return sortDirection === "asc" ? cmp : -cmp;
      } else {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
        const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
        return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
      }
    });
  }, [rounds, sortField, sortDirection]);

  const latestRound = useMemo(() => {
    if (!rounds || rounds.length === 0) return null;
    return [...rounds].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
      const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
      return timeB - timeA;
    })[0];
  }, [rounds]);

  const currentCompany = latestRound ? latestRound.company : trainee.placement.currentCompany;
  const currentRole = latestRound ? latestRound.role : trainee.placement.currentRole;
  const currentStatus = latestRound ? latestRound.result : trainee.placement.currentStatus;

  const [interviewError, setInterviewError] = useState("");
  const [interviewForm, setInterviewForm] = useState({
    company: "",
    role: "",
    round: "",
    interviewDate: "",
    result: "" as "" | PlacementRound["result"],
  });

  const [editForm, setEditForm] = useState({
    company: "",
    role: "",
    round: "",
    interviewDate: "",
    result: "" as PlacementRound["result"],
  });

  const interviewDateInputRef = useRef<HTMLInputElement | null>(null);

  const formatDateLabel = (dateValue: string) => {
    if (!dateValue) {
      return "Interview Date";
    }

    const parsedDate = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      return dateValue;
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const updateInterviewForm = (
    field: "company" | "role" | "round" | "interviewDate" | "result",
    value: string,
  ) => {
    setInterviewForm((current) => ({ ...current, [field]: value }));
    if (interviewError) {
      setInterviewError("");
    }
  };

  const resetInterviewForm = () => {
    setInterviewForm({
      company: "",
      role: "",
      round: "",
      interviewDate: "",
      result: "",
    });
    setInterviewError("");
  };

  const closeInterviewModal = () => {
    setIsAddInterviewModalOpen(false);
    resetInterviewForm();
  };

  const openInterviewDatePicker = () => {
    const input = interviewDateInputRef.current;
    if (!input) {
      return;
    }

    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
    if (typeof pickerInput.showPicker === "function") {
      pickerInput.showPicker();
      return;
    }

    input.focus();
    input.click();
  };

  const handleAddInterview = async () => {
    if (
      !interviewForm.company.trim() ||
      !interviewForm.role.trim() ||
      !interviewForm.round.trim() ||
      !interviewForm.interviewDate.trim() ||
      !interviewForm.result
    ) {
      setInterviewError("Please fill all fields to add interview.");
      return;
    }

    const selectedResult = interviewForm.result as PlacementRound["result"];

    try {
      const response = await createPlacement({
        traineeId: trainee.id,
        company: interviewForm.company.trim(),
        role: interviewForm.role.trim(),
        round: interviewForm.round.trim(),
        date: formatDateLabel(interviewForm.interviewDate),
        result: selectedResult,
      });

      if (response.success && response.data) {
        setRounds([response.data, ...rounds]);
        toast.success("Placement round added successfully!");
        closeInterviewModal();
      } else {
        toast.error(response.message || "Failed to add interview.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to add interview.");
    }
  };

  const openEditModal = (roundItem: PlacementRound) => {
    const originalIndex = rounds.findIndex((r) => r === roundItem);
    setEditingIndex(originalIndex >= 0 ? originalIndex : 0);
    setEditForm({
      company: roundItem.company,
      role: roundItem.role,
      round: roundItem.round,
      interviewDate: roundItem.date,
      result: roundItem.result,
    });
  };

  const handleSaveEditInterview = async () => {
    if (editingIndex === null) return;
    const original = rounds[editingIndex];
    if (!original.id) {
      toast.error("Placement record ID is missing. Cannot update.");
      return;
    }

    try {
      const response = await updatePlacement(original.id, {
        company: editForm.company,
        role: editForm.role,
        round: editForm.round,
        date: editForm.interviewDate,
        result: editForm.result,
      });

      if (response.success && response.data) {
        const updated = rounds.map((r, idx) =>
          idx === editingIndex ? response.data : r
        );
        setRounds(updated);
        toast.success("Placement round updated successfully!");
        setEditingIndex(null);
      } else {
        toast.error(response.message || "Failed to update interview.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to update interview.");
    }
  };

  const openDeleteModal = (roundItem: PlacementRound) => {
    const originalIndex = rounds.findIndex((r) => r === roundItem);
    setDeletingIndex(originalIndex >= 0 ? originalIndex : 0);
  };

  const handleConfirmDeleteInterview = async () => {
    if (deletingIndex === null) return;
    const target = rounds[deletingIndex];
    if (!target.id) {
      toast.error("Placement record ID is missing. Cannot delete.");
      return;
    }

    try {
      const response = await deletePlacement(target.id);
      if (response.success) {
        const updated = rounds.filter((_, idx) => idx !== deletingIndex);
        setRounds(updated);
        toast.success("Placement round deleted successfully!");
        setDeletingIndex(null);
      } else {
        toast.error(response.message || "Failed to delete interview.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete interview.");
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[22px] font-semibold text-[#222]">Placement Details</h2>
          <button
            type="button"
            onClick={() => setIsAddInterviewModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#ff5b21] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#ec4f16] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Interview
          </button>
        </div>

        <div className="rounded-lg bg-[#121212] p-4 text-white">
          <p className="text-[10px] uppercase tracking-wide text-[#b3b3b3]">Current Hiring Status</p>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-3xl font-semibold text-[#ff7c23]">{currentCompany}</h3>
              <p className="text-sm text-[#d5d5d5]">{currentRole}</p>
            </div>
            <span className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              currentStatus === "Selected"
                ? "bg-green-100 text-green-700"
                : currentStatus === "Rejected"
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-700"
            }`}>
              {currentStatus}
            </span>
          </div>
        </div>

        <div className="hidden bg-white rounded-2xl overflow-hidden shadow-none md:block select-none">
          <TableScrollContainer>
            <table className="w-full text-left text-xs select-none">
              <thead className="sticky top-0 z-20">
                <tr className="bg-[#0b0b0b] text-[11px] font-semibold uppercase tracking-wider text-white">
                  <th className="px-5 py-4 w-12 text-center bg-[#0b0b0b]">#</th>
                  <th className="px-5 py-4 bg-[#0b0b0b]">
                    <button
                      type="button"
                      onClick={handleSortCompany}
                      className="inline-flex items-center gap-1.5 cursor-pointer select-none bg-transparent border-0 outline-none text-left p-0 text-inherit font-semibold"
                    >
                      <span>Company</span>
                      <SortIcon sortOrder={sortField === "company" ? sortDirection : undefined} />
                    </button>
                  </th>
                  <th className="px-5 py-4 bg-[#0b0b0b]">Role</th>
                  <th className="px-5 py-4 bg-[#0b0b0b]">Round</th>
                  <th className="px-5 py-4 bg-[#0b0b0b]">
                    <button
                      type="button"
                      onClick={handleSortDate}
                      className="inline-flex items-center gap-1.5 cursor-pointer select-none bg-transparent border-0 outline-none text-left p-0 text-inherit font-semibold"
                    >
                      <span>Date</span>
                      <SortIcon sortOrder={sortField === "date" ? sortDirection : undefined} />
                    </button>
                  </th>
                  <th className="px-5 py-4 bg-[#0b0b0b]">Result</th>
                  <th className="px-5 py-4 w-20 text-center bg-[#0b0b0b]">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs text-gray-700">
                {sortedRounds.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm font-medium text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-1.5 text-gray-400">
                        <span className="text-sm font-semibold text-gray-500">No Data Available</span>
                        <span className="text-[11px]">No interview placement rounds found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedRounds.map((round, index) => (
                    <tr
                      key={`${round.company}-${index}`}
                      className={`hover:bg-gray-50/50 transition ${
                        index === sortedRounds.length - 1 ? "!border-b-0 [&>td]:!border-b-0" : "border-b border-[#E5E7EB]"
                      }`}
                    >
                      <td className="px-5 py-4.5 text-center text-black font-medium">{index + 1}</td>
                      <td className="px-5 py-4.5 font-bold text-gray-900">{round.company}</td>
                      <td className="px-5 py-4.5 font-medium text-gray-700">{round.role}</td>
                      <td className="px-5 py-4.5 text-gray-500 font-medium">{round.round}</td>
                      <td className="px-5 py-4.5 text-gray-500 font-medium">{round.date}</td>
                      <td className="px-5 py-4.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${placementResultClassMap[round.result]}`}
                        >
                          {round.result}
                        </span>
                      </td>
                      <td className="px-5 py-4.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(round)}
                            className="cursor-pointer select-none transition hover:opacity-80"
                            title="Edit Interview"
                          >
                            <EditIconsvg className="h-4 w-4 md:h-5 md:w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(round)}
                            className="cursor-pointer select-none transition hover:opacity-80"
                            title="Delete Interview"
                          >
                            <DeleteIconsvg className="h-4 w-4 md:h-5 md:w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableScrollContainer>
        </div>

        <div className="space-y-2 md:hidden">
          {sortedRounds.length === 0 ? (
            <div className="bg-white border border-[#ececec] rounded-2xl p-6 text-center text-gray-400 font-semibold text-xs shadow-sm">
              No Data Available
            </div>
          ) : (
            sortedRounds.map((round, index) => (
              <div key={`${round.company}-${index}`} className="rounded-lg border border-[#dddddd] bg-white p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#222]">{round.company}</p>
                    <p className="text-xs text-[#707070]">{round.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${placementResultClassMap[round.result]}`}
                    >
                      {round.result}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(round)}
                        className="cursor-pointer"
                      >
                        <EditIconsvg className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteModal(round)}
                        className="cursor-pointer"
                      >
                        <DeleteIconsvg className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[#8f8f8f]">Round</p>
                    <p className="font-medium text-[#2a2a2a]">{round.round}</p>
                  </div>
                  <div>
                    <p className="text-[#8f8f8f]">Date</p>
                    <p className="font-medium text-[#2a2a2a]">{round.date}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {editingIndex !== null && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px] overflow-y-auto">
          <div className="relative my-auto w-full max-w-[400px] rounded-[24px] bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setEditingIndex(null)}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#0c101d] text-white hover:opacity-90 cursor-pointer transition z-10"
            >
              <X className="h-4 w-4 stroke-[3.2px]" />
            </button>

            <div className="text-center mb-4">
              <h3 className="text-xl font-extrabold text-[#111827]">Edit Interview</h3>
              <p className="mt-1 text-xs text-gray-500">
                Update interview record details
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Company"
                value={editForm.company}
                onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                className="h-10 w-full rounded-xl border border-[#e3e3e3] px-3.5 text-xs text-gray-700 outline-none transition focus:border-[#ff5b21] focus:ring-2 focus:ring-[#ff5b21]/15 placeholder:text-gray-400"
              />
              <input
                type="text"
                placeholder="Role"
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="h-10 w-full rounded-xl border border-[#e3e3e3] px-3.5 text-xs text-gray-700 outline-none transition focus:border-[#ff5b21] focus:ring-2 focus:ring-[#ff5b21]/15 placeholder:text-gray-400"
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Round"
                  value={editForm.round}
                  onChange={(e) => setEditForm({ ...editForm, round: e.target.value })}
                  className="h-10 w-full rounded-xl border border-[#e3e3e3] px-3.5 text-xs text-gray-700 outline-none transition focus:border-[#ff5b21] focus:ring-2 focus:ring-[#ff5b21]/15 placeholder:text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Interview Date"
                  value={editForm.interviewDate}
                  onChange={(e) => setEditForm({ ...editForm, interviewDate: e.target.value })}
                  className="h-10 w-full rounded-xl border border-[#e3e3e3] px-3.5 text-xs text-gray-700 outline-none transition focus:border-[#ff5b21] focus:ring-2 focus:ring-[#ff5b21]/15 placeholder:text-gray-400"
                />
              </div>

              <ResultSelect
                value={editForm.result}
                onChange={(val) => setEditForm({ ...editForm, result: val })}
              />

              <button
                type="button"
                onClick={handleSaveEditInterview}
                className="h-11 w-full rounded-xl bg-[#ff5b21] text-sm font-semibold text-white transition hover:bg-[#ec4f16] cursor-pointer mt-4 shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px] overflow-y-auto">
          <div className="relative my-auto w-full max-w-[340px] rounded-[24px] bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500 mb-4">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Interview?</h3>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed px-1">
                Are you sure you want to delete this interview record? This action cannot be undone.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeletingIndex(null)}
                className="h-10 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteInterview}
                className="h-10 rounded-xl bg-[#ff4d4d] hover:bg-red-600 text-xs font-semibold text-white cursor-pointer transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Interview Modal */}
      {isAddInterviewModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px] overflow-y-auto">
          <div className="relative my-auto w-full max-w-[420px] rounded-[24px] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={closeInterviewModal}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#0c101d] text-white hover:opacity-90 cursor-pointer transition z-10"
              aria-label="Close add interview modal"
            >
              <X className="h-4 w-4 stroke-[3.2px]" />
            </button>

            <div className="text-center mb-5">
              <h3 className="text-2xl font-bold text-[#1f1f1f]">Add Interview</h3>
            </div>

            <div className="space-y-3.5">
              <input
                type="text"
                placeholder="Company"
                value={interviewForm.company}
                onChange={(e) => updateInterviewForm("company", e.target.value)}
                className="h-11 w-full rounded-2xl border border-[#e3e3e3] px-4 text-sm text-gray-800 outline-none transition focus:border-[#ff5b21] focus:ring-2 focus:ring-[#ff5b21]/15 placeholder:text-gray-400"
              />

              <input
                type="text"
                placeholder="Role"
                value={interviewForm.role}
                onChange={(e) => updateInterviewForm("role", e.target.value)}
                className="h-11 w-full rounded-2xl border border-[#e3e3e3] px-4 text-sm text-gray-800 outline-none transition focus:border-[#ff5b21] focus:ring-2 focus:ring-[#ff5b21]/15 placeholder:text-gray-400"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Round"
                  value={interviewForm.round}
                  onChange={(e) => updateInterviewForm("round", e.target.value)}
                  className="h-11 w-full rounded-2xl border border-[#e3e3e3] px-4 text-sm text-gray-800 outline-none transition focus:border-[#ff5b21] focus:ring-2 focus:ring-[#ff5b21]/15 placeholder:text-gray-400"
                />

                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={openInterviewDatePicker}
                    className="h-11 w-full flex items-center justify-between rounded-2xl border border-[#e3e3e3] bg-white px-4 text-sm text-gray-700 outline-none transition hover:border-gray-400 focus:border-[#ff5b21] cursor-pointer select-none"
                  >
                    <span className={interviewForm.interviewDate ? "text-gray-900 font-medium" : "text-gray-400"}>
                      {formatDateLabel(interviewForm.interviewDate)}
                    </span>
                    <CalendarIcon className="h-4.5 w-4.5 text-gray-400 shrink-0" />
                  </button>

                  <input
                    ref={interviewDateInputRef}
                    type="date"
                    value={interviewForm.interviewDate}
                    onChange={(e) => updateInterviewForm("interviewDate", e.target.value)}
                    className="pointer-events-none absolute h-0 w-0 opacity-0"
                    tabIndex={-1}
                    aria-hidden
                  />
                </div>
              </div>

              <ResultSelect
                value={interviewForm.result}
                onChange={(val) => updateInterviewForm("result", val)}
              />

              {interviewError && (
                <p className="text-xs font-medium text-red-500 px-1">{interviewError}</p>
              )}

              <button
                type="button"
                onClick={handleAddInterview}
                className="mt-2 h-12 w-full rounded-2xl bg-[#ff5b21] text-base font-semibold text-white transition hover:bg-[#ec4f16] cursor-pointer shadow-sm"
              >
                Add Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

