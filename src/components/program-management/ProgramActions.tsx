"use client";

import { useState } from "react";
import { AlertTriangle, Paperclip, Trash2, X } from "lucide-react";
import type { ProgramItem, UpdateProgramInput } from "@/types/program/program.types";
import { normalizeProgramDuration } from "@/utils/program/program.utils";

export function DeleteProgramModal({
  program,
  isDeleting,
  onClose,
  onConfirm,
}: {
  program: ProgramItem;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[320px] animate-in rounded-[24px] bg-white p-6 shadow-2xl duration-150 fade-in zoom-in-95">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ff4d4d] text-white shadow-sm">
            <Trash2 className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Delete Program?</h3>
          <p className="mt-2 px-1 text-xs leading-relaxed text-gray-500">
            Are you sure you want to delete {program.title}? It will no longer be available for future trainee enrollments.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} disabled={isDeleting} className="h-10 cursor-pointer rounded-xl border border-gray-300 bg-white text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={isDeleting} className="flex h-10 cursor-pointer items-center justify-center rounded-xl bg-[#ff4d4d] text-xs font-semibold text-white transition hover:bg-red-600 disabled:cursor-wait disabled:opacity-60">
            {isDeleting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UnableDeleteModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[320px] animate-in rounded-[24px] bg-white p-6 shadow-2xl duration-150 fade-in zoom-in-95">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ff5b21] text-white shadow-sm">
            <AlertTriangle className="h-7 w-7 stroke-[2.5px]" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Unable to Delete Program</h3>
          <p className="mt-2 px-1 text-xs leading-relaxed text-gray-500">This Program is currently assigned to one or more active trainees. Please reassign or complete those trainees before deleting this Program.</p>
        </div>
        <button type="button" onClick={onClose} className="mt-6 h-10 w-full cursor-pointer rounded-xl bg-[#ff5b21] text-xs font-semibold text-white transition hover:bg-[#e04f1a]">Ok</button>
      </div>
    </div>
  );
}

export function ViewProgramModal({
  program,
  isToggling,
  onClose,
  onToggleStatus,
}: {
  program: ProgramItem;
  isToggling: boolean;
  onClose: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div className="relative w-full max-w-[440px] animate-in duration-150 fade-in zoom-in-95">
        <button type="button" onClick={onClose} className="absolute -top-3 -right-3 z-50 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#0c101d] text-white transition hover:opacity-90" aria-label="Close view program modal"><X className="h-4 w-4 stroke-[3.2px]" /></button>
        <div className="no-scrollbar max-h-[90vh] w-full overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-3 pr-2">
            <h3 className="text-xl leading-snug font-bold text-[#1f1f1f]">{program.title}</h3>
            <button type="button" onClick={onToggleStatus} disabled={isToggling} className={`relative mt-0.5 h-5.5 w-10 shrink-0 cursor-pointer select-none rounded-full p-0.5 transition-colors duration-200 focus:outline-none disabled:cursor-wait disabled:opacity-60 ${program.status ? "bg-[#ff5b21]" : "bg-gray-200"}`} title="Toggle Program Status">
              {program.status ? <span className="absolute top-1/2 left-[7px] h-[7px] w-[1.5px] -translate-y-1/2 rounded-full bg-white" /> : <span className="absolute top-1/2 right-[6px] h-[6px] w-[6px] -translate-y-1/2 rounded-full border border-gray-400" />}
              <span className={`block h-4.5 w-4.5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${program.status ? "translate-x-4.5" : "translate-x-0"}`} />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">{program.tags.map((tag) => <span key={tag} className="rounded-full bg-[#f4f4f4] px-3.5 py-1 text-xs font-medium text-[#444]">{tag}</span>)}</div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div><p className="text-xs font-semibold text-[#8c8c8c]">Price</p><p className="mt-0.5 text-sm font-bold text-[#1f1f1f]">{program.fees}</p></div>
            <div><p className="text-xs font-semibold text-[#8c8c8c]">Duration</p><p className="mt-0.5 text-sm font-bold text-[#1f1f1f]">{program.duration}</p></div>
          </div>
          <p className="mt-3.5 text-xs leading-relaxed text-[#555]">{program.description || "No description provided."}</p>
          <div className="mt-4 border-t border-[#eeeeee] pt-3">
            <h4 className="mb-2.5 text-sm font-bold text-[#1f1f1f]">Attachments</h4>
            {program.attachments.length > 0 ? (
              <div className="space-y-3">
                {program.attachments.map((file) => {
                  const content = (
                    <><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#e8e8e8] bg-[#f8f8f8] text-[#777]"><Paperclip className="h-4 w-4" /></span><span className="min-w-0"><span className="block truncate text-xs font-bold text-[#1f1f1f]">{file.name}</span><span className="mt-0.5 block text-[11px] text-[#8c8c8c]">{file.size} · {file.date}</span></span></>
                  );
                  return file.url ? <a key={file.name} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 border-b border-[#eeeeee] pb-3 last:border-b-0 last:pb-0 hover:opacity-80">{content}</a> : <div key={file.name} className="flex items-center gap-3">{content}</div>;
                })}
              </div>
            ) : <p className="text-xs text-gray-400">No attachment available.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EditProgramModal({
  program,
  isSaving,
  onClose,
  onSave,
}: {
  program: ProgramItem;
  isSaving: boolean;
  onClose: () => void;
  onSave: (program: UpdateProgramInput) => void;
}) {
  const [title, setTitle] = useState(program.title);
  const [fees, setFees] = useState(program.fees);
  const [duration, setDuration] = useState(program.duration);
  const [tagsText, setTagsText] = useState(program.tags.join(", "));
  const [description, setDescription] = useState(program.description);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const numericFees = Number(fees.replace(/[^0-9.]/g, ""));
    if (!title.trim()) nextErrors.title = "Program Title is required";
    if (!Number.isFinite(numericFees) || numericFees <= 0) nextErrors.fees = "Enter a valid fee";
    if (!duration.trim()) nextErrors.duration = "Duration is required";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSave({
      title: title.trim(),
      fees: numericFees,
      duration: normalizeProgramDuration(duration),
      tags: tagsText.split(",").map((tag) => tag.trim()).filter(Boolean),
      description: description.trim(),
      status: program.status ? "active" : "inactive",
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div className="relative w-full max-w-[420px] animate-in duration-150 fade-in zoom-in-95">
        <button type="button" onClick={onClose} disabled={isSaving} className="absolute -top-4 -right-4 z-50 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#0c101d] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60" aria-label="Close edit program modal"><X className="h-4 w-4 stroke-[3.2px]" /></button>
        <form onSubmit={handleSubmit} className="max-h-[90vh] w-full overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl">
          <h3 className="mt-2 mb-4 text-lg font-bold text-gray-900">Edit Program</h3>
          <div className="space-y-4">
            <div><label className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Program Title</label><input type="text" maxLength={50} value={title} onChange={(event) => { setTitle(event.target.value); setErrors((current) => ({ ...current, title: "" })); }} className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm text-gray-700 outline-none transition ${errors.title ? "border-red-500" : "border-gray-200 focus:border-[#ff5b21]"}`} />{errors.title && <p className="mt-1 text-[10px] text-red-500">{errors.title}</p>}</div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Fees</label><input type="text" maxLength={15} value={fees} onChange={(event) => { setFees(event.target.value); setErrors((current) => ({ ...current, fees: "" })); }} className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm text-gray-700 outline-none transition ${errors.fees ? "border-red-500" : "border-gray-200 focus:border-[#ff5b21]"}`} />{errors.fees && <p className="mt-1 text-[10px] text-red-500">{errors.fees}</p>}</div>
              <div><label className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Duration</label><input type="text" maxLength={20} value={duration} onChange={(event) => { setDuration(event.target.value); setErrors((current) => ({ ...current, duration: "" })); }} className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm text-gray-700 outline-none transition ${errors.duration ? "border-red-500" : "border-gray-200 focus:border-[#ff5b21]"}`} />{errors.duration && <p className="mt-1 text-[10px] text-red-500">{errors.duration}</p>}</div>
            </div>
            <div><label className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Tags (comma separated)</label><input type="text" value={tagsText} onChange={(event) => setTagsText(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#ff5b21]" /></div>
            <div><label className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Description</label><textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 h-24 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#ff5b21]" /></div>
          </div>
          <button type="submit" disabled={isSaving} className="mt-6 flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-[#ff5b21] text-xs font-semibold text-white transition hover:bg-[#e04f1a] disabled:cursor-wait disabled:opacity-60">{isSaving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Save Changes"}</button>
        </form>
      </div>
    </div>
  );
}

