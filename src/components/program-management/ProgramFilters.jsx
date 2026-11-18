"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Input } from "antd";
import { ChevronDown, Plus, Search, X } from "lucide-react";

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export default function ProgramFilters({
  search,
  selectedStatus,
  selectedTag,
  tags,
  onSearchChange,
  onStatusChange,
  onTagChange,
}) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!controlsRef.current?.contains(event.target)) setOpenDropdown(null);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="relative z-30 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-[290px]">
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search...."
          allowClear
          prefix={<Search className="mr-1.5 h-4 w-4 text-[#ff5b21]" />}
          style={{ borderRadius: "10px", height: "40px" }}
          className="w-full !border-[#dedede] bg-white hover:!border-[#ff5b21] focus-within:!border-[#ff5b21] focus-within:!shadow-none [&>input]:text-sm [&>input]:text-[#333] [&>input]:placeholder-gray-400"
        />
      </div>

      <div ref={controlsRef} className="flex w-full shrink-0 flex-wrap items-center gap-3 sm:w-auto">
        <div className="relative min-w-32 flex-1 sm:flex-initial">
          <button
            type="button"
            onClick={() => setOpenDropdown((current) => (current === "status" ? null : "status"))}
            aria-expanded={openDropdown === "status"}
            aria-label="Filter programs by status"
            className="flex h-10 w-full cursor-pointer select-none items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-xs font-semibold text-gray-600 outline-none transition focus:border-[#ff5b21]"
          >
            <span>{selectedStatus ? (selectedStatus === "active" ? "Active" : "Inactive") : "All Statuses"}</span>
            <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${openDropdown === "status" ? "rotate-180" : ""}`} />
          </button>

          {openDropdown === "status" && (
            <div className="absolute left-0 z-40 mt-1.5 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:right-0 sm:left-auto sm:w-36">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => {
                    onStatusChange(option.value);
                    setOpenDropdown(null);
                  }}
                  className={`block w-full cursor-pointer px-3.5 py-2 text-left text-xs font-semibold transition ${selectedStatus === option.value ? "bg-[#ff5b21]/5 text-[#ff5b21]" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex-1 shrink-0 sm:flex-initial">
          <button
            type="button"
            onClick={() => setOpenDropdown((current) => (current === "tag" ? null : "tag"))}
            aria-expanded={openDropdown === "tag"}
            aria-label="Filter programs by tag"
            className="flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-600 outline-none transition focus:border-[#ff5b21]"
          >
            <span>{selectedTag || "Tags"}</span>
            {selectedTag ? (
              <X
                className="h-3 w-3 shrink-0 text-gray-400 transition hover:text-gray-600"
                onClick={(event) => {
                  event.stopPropagation();
                  onTagChange("");
                  setOpenDropdown(null);
                }}
              />
            ) : (
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${openDropdown === "tag" ? "rotate-180" : ""}`} />
            )}
          </button>

          {openDropdown === "tag" && (
            <div className="no-scrollbar absolute left-0 z-40 mt-1.5 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:right-0 sm:left-auto sm:w-44">
              {["", ...tags].map((tag) => (
                <button
                  key={tag || "all-tags"}
                  type="button"
                  onClick={() => {
                    onTagChange(tag);
                    setOpenDropdown(null);
                  }}
                  className={`block w-full cursor-pointer px-3 py-2 text-left text-xs font-semibold transition ${selectedTag === tag ? "bg-[#ff5b21]/5 text-[#ff5b21]" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  {tag || "All Tags"}
                </button>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/dashboard/program-management/add-program"
          className="inline-flex flex-1 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#ff5b21] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#e04f1a] sm:flex-initial"
        >
          <Plus className="h-4 w-4" />
          Add Program
        </Link>
      </div>
    </div>
  );
}
