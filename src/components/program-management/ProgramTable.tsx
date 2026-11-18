"use client";

import { MoreVertical } from "lucide-react";
import ActionDropdown from "@/components/ui/ActionDropdown";
import TableScrollContainer from "@/components/ui/TableScrollContainer";
import type {
  ProgramAction,
  ProgramItem,
  ProgramSortBy,
  ProgramSortConfig,
} from "@/types/program/program.types";
import { ArrowdownIcon, ArrowupIcon } from "@/utils/svgicon";
import {
  getProgramPageNumbers,
  PROGRAM_ITEMS_PER_PAGE,
} from "@/utils/program/program.utils";

interface ProgramTableProps {
  programs: ProgramItem[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  sortConfig: ProgramSortConfig;
  activeMenuId: string | number | null;
  togglingProgramId: string | number | null;
  onSort: (key: ProgramSortBy) => void;
  onPageChange: (page: number) => void;
  onAction: (action: ProgramAction, program: ProgramItem) => void;
  onMenuChange: (id: string | number | null) => void;
  onToggleStatus: (program: ProgramItem) => void;
}

function StatusToggle({
  program,
  disabled,
  onToggle,
}: {
  program: ProgramItem;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={`${program.status ? "Deactivate" : "Activate"} ${program.title}`}
      className={`relative inline-block h-5 w-9 cursor-pointer select-none rounded-full p-0.5 align-middle transition-colors duration-200 focus:outline-none disabled:cursor-wait disabled:opacity-60 ${program.status ? "bg-[#ff5b21]" : "bg-gray-200"}`}
    >
      {program.status ? (
        <span className="absolute top-1/2 left-[7px] h-[7px] w-[1.5px] -translate-y-1/2 rounded-full bg-white" />
      ) : (
        <span className="absolute top-1/2 right-[6px] h-[6px] w-[6px] -translate-y-1/2 rounded-full border border-gray-400 bg-transparent" />
      )}
      <span className={`block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${program.status ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

function SortIcons({ column, sortConfig }: { column: ProgramSortBy; sortConfig: ProgramSortConfig }) {
  return (
    <span className="flex shrink-0 flex-col gap-[2px]">
      <ArrowupIcon className={`h-[5px] w-[8px] transition-colors ${sortConfig.key === column && sortConfig.direction === "asc" ? "text-[#fe5200]" : "text-[#c8c8c8]"}`} />
      <ArrowdownIcon className={`h-[5px] w-[8px] transition-colors ${sortConfig.key === column && sortConfig.direction === "desc" ? "text-[#fe5200]" : "text-[#c8c8c8]"}`} />
    </span>
  );
}

function ProgramRowActions({
  program,
  isOpen,
  align = "center",
  onOpenChange,
  onAction,
}: {
  program: ProgramItem;
  isOpen: boolean;
  align?: "left" | "center";
  onOpenChange: (isOpen: boolean) => void;
  onAction: (action: ProgramAction) => void;
}) {
  const textAlignment = align === "left" ? "text-left" : "text-center";

  return (
    <ActionDropdown
      open={isOpen}
      onOpenChange={onOpenChange}
      trigger={<MoreVertical className="h-4 w-4" />}
      triggerClassName="inline-flex cursor-pointer items-center justify-center rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
      menuClassName={`w-24 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 ${textAlignment} shadow-[0_4px_20px_rgba(0,0,0,0.12)] animate-in fade-in duration-150`}
      ariaLabel={`Open actions for ${program.title}`}
    >
      {(["view", "edit", "delete"] as const).map((action) => (
        <button
          key={action}
          type="button"
          onClick={() => onAction(action)}
          className={`block w-full cursor-pointer px-3 py-2 ${textAlignment} text-xs font-semibold capitalize transition ${action === "delete" ? "text-red-600 hover:bg-red-50/50" : "text-[#2d2d2d] hover:bg-[#f8f8f8]"}`}
        >
          {action}
        </button>
      ))}
    </ActionDropdown>
  );
}

export default function ProgramTable({
  programs,
  isLoading,
  currentPage,
  totalPages,
  totalRecords,
  sortConfig,
  activeMenuId,
  togglingProgramId,
  onSort,
  onPageChange,
  onAction,
  onMenuChange,
  onToggleStatus,
}: ProgramTableProps) {
  return (
    <>
      <div className="hidden select-none overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-none lg:block">
        <TableScrollContainer>
          <table className="relative w-full min-w-[900px] table-fixed select-none text-left">
            <colgroup>
              <col className="w-12" />
              <col className="w-[25%]" />
              <col className="w-[30%]" />
              <col className="w-28" />
              <col className="w-28" />
              <col className="w-28" />
              <col className="w-20" />
            </colgroup>
            <thead className="sticky top-0 z-20 shadow-xs">
              <tr className="select-none bg-[#0b0b0b] text-[11px] font-semibold tracking-wider text-white uppercase">
                <th className="sticky top-0 z-20 w-12 bg-[#0b0b0b] px-5 py-4 text-center">#</th>
                <th className="sticky top-0 z-20 bg-[#0b0b0b] px-5 py-4">
                  <button type="button" onClick={() => onSort("title")} className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-left text-inherit outline-none">
                    <span>Title</span>
                    <SortIcons column="title" sortConfig={sortConfig} />
                  </button>
                </th>
                <th className="sticky top-0 z-20 bg-[#0b0b0b] px-5 py-4">Tags</th>
                <th className="sticky top-0 z-20 w-28 bg-[#0b0b0b] px-5 py-4 text-center">
                  <button type="button" onClick={() => onSort("fees")} className="mx-auto inline-flex cursor-pointer items-center justify-center gap-1.5 border-0 bg-transparent p-0 text-center text-inherit outline-none">
                    <span>Fees</span>
                    <SortIcons column="fees" sortConfig={sortConfig} />
                  </button>
                </th>
                <th className="sticky top-0 z-20 w-28 bg-[#0b0b0b] px-5 py-4 text-center">
                  <button type="button" onClick={() => onSort("duration")} className="mx-auto inline-flex cursor-pointer items-center justify-center gap-1.5 border-0 bg-transparent p-0 text-center text-inherit outline-none">
                    <span>Duration</span>
                    <SortIcons column="duration" sortConfig={sortConfig} />
                  </button>
                </th>
                <th className="sticky top-0 z-20 w-28 bg-[#0b0b0b] px-5 py-4 text-center">Status</th>
                <th className="sticky top-0 z-20 w-20 bg-[#0b0b0b] px-5 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="bg-white px-5 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#ff5b21] border-t-transparent" />
                      <span className="text-xs font-medium text-gray-400">Loading programs…</span>
                    </div>
                  </td>
                </tr>
              ) : programs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm font-medium text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-1.5 text-gray-400">
                      <span className="text-sm font-semibold text-gray-500">No Data Available</span>
                      <span className="text-[11px]">No programs match your search or filter criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                programs.map((program, index) => (
                  <tr key={program.id} className={`transition hover:bg-gray-50/50 ${index === programs.length - 1 ? "!border-b-0 [&>td]:!border-b-0" : "border-b border-[#E5E7EB]"}`}>
                    <td className="px-5 py-4 text-center font-medium text-black">{(currentPage - 1) * PROGRAM_ITEMS_PER_PAGE + index + 1}</td>
                    <td className="px-5 py-4 font-bold text-gray-900">{program.title}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {program.tags.map((tag) => <span key={tag} className="rounded-full bg-[#f0f0f0] px-3.5 py-1 text-xs font-normal text-gray-900">{tag}</span>)}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center font-semibold text-gray-800">{program.fees}</td>
                    <td className="px-5 py-4 text-center font-medium text-gray-500">{program.duration}</td>
                    <td className="px-5 py-4 text-center">
                      <StatusToggle program={program} disabled={togglingProgramId === program.id} onToggle={() => onToggleStatus(program)} />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <ProgramRowActions
                        program={program}
                        isOpen={activeMenuId === program.id}
                        onOpenChange={(open) => onMenuChange(open ? program.id : null)}
                        onAction={(action) => onAction(action, program)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableScrollContainer>
      </div>

      <div className="space-y-3 lg:hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#ececec] bg-white p-8">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#ff5b21] border-t-transparent" />
            <span className="text-xs font-medium text-gray-400">Loading programs…</span>
          </div>
        ) : programs.length === 0 ? (
          <div className="rounded-2xl border border-[#ececec] bg-white p-6 text-center text-xs font-semibold text-gray-400 shadow-sm">No Data Available</div>
        ) : (
          programs.map((program) => (
            <div key={program.id} className="relative rounded-2xl border border-[#ececec] bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <button type="button" className="max-w-[70%] cursor-pointer text-left text-sm leading-tight font-bold text-gray-900" onClick={() => onAction("view", program)}>{program.title}</button>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusToggle program={program} disabled={togglingProgramId === program.id} onToggle={() => onToggleStatus(program)} />
                  <ProgramRowActions
                    program={program}
                    isOpen={activeMenuId === program.id}
                    align="left"
                    onOpenChange={(open) => onMenuChange(open ? program.id : null)}
                    onAction={(action) => onAction(action, program)}
                  />
                </div>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {program.tags.map((tag) => <span key={tag} className="rounded-full bg-[#f0f0f0] px-3 py-1 text-[11px] font-normal text-gray-900">{tag}</span>)}
              </div>
              <div className="mt-3.5 grid grid-cols-2 gap-4 rounded-xl border border-gray-100 bg-[#fcfcfd] p-3 text-xs">
                <div>
                  <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Fees</p>
                  <p className="mt-0.5 font-bold text-gray-800">{program.fees}</p>
                </div>
                <div className="border-l border-gray-100 pl-4">
                  <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Duration</p>
                  <p className="mt-0.5 font-bold text-gray-800">{program.duration}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {totalRecords > 0 && (
        <div className="flex select-none flex-row items-center justify-between border-t border-gray-100 pt-5 text-xs font-semibold">
          <button type="button" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="flex cursor-pointer select-none items-center justify-center gap-1.5 text-gray-500 transition hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-gray-500">← Previous</button>
          <div className="flex items-center gap-1.5">
            {getProgramPageNumbers(currentPage, totalPages).map((page, index) =>
              page === "…" ? (
                <span key={`dots-${index}`} className="px-2 text-gray-400">…</span>
              ) : (
                <button key={`page-${page}`} type="button" onClick={() => onPageChange(page)} aria-current={page === currentPage ? "page" : undefined} className={`flex h-7 w-7 cursor-pointer select-none items-center justify-center rounded-[5px] text-center text-xs transition ${page === currentPage ? "bg-[#ff5b21] font-bold text-white" : "text-gray-600 hover:bg-gray-100"}`}>{page}</button>
              ),
            )}
          </div>
          <button type="button" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className="flex cursor-pointer select-none items-center justify-center gap-1.5 text-gray-500 transition hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-gray-500">Next →</button>
        </div>
      )}
    </>
  );
}

