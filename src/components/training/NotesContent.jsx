"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { DeleteIconsvg, EditIconsvg } from "@/utils/svgicon";
import { getNotesByTrainee } from "@/api/get";
import { createNote } from "@/api/post";
import { updateNote } from "@/api/patch";
import { deleteNote } from "@/api/delete";
import { useRequestDeduplicator } from "@/lib/hooks/useRequestDeduplicator";
import { toast } from "react-toastify";
const initialsClassMap = ["from-pink-200 to-red-100 text-pink-700", "from-amber-200 to-yellow-100 text-amber-700", "from-sky-200 to-blue-100 text-sky-700"];
export default function NotesContent({
  trainee
}) {
  const [notes, setNotes] = useState([]);
  const {
    shouldFetch
  } = useRequestDeduplicator();
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const response = await getNotesByTrainee(trainee.id);
        if (response.success && response.data) {
          const raw = response.data;
          const list = Array.isArray(raw) ? raw : raw.notes || Object.values(raw).find(Array.isArray) || [];
          setNotes(list);
        } else {
          setNotes([]);
        }
      } catch (e) {
        console.error(e);
        setNotes([]);
      }
    };
    if (shouldFetch({
      traineeId: trainee.id
    })) {
      loadNotes();
    }
  }, [trainee.id, shouldFetch]);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [noteText, setNoteText] = useState("");
  const [selectedNote, setSelectedNote] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editNoteText, setEditNoteText] = useState("");
  const [deletingIndex, setDeletingIndex] = useState(null);
  const closeAddNoteModal = () => {
    setIsAddNoteModalOpen(false);
    setNoteText("");
    setNoteError("");
  };
  const handleAddNote = async () => {
    if (!noteText.trim()) {
      setNoteError("Please write a note before submitting.");
      return;
    }
    let authorName = "Admin";
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        authorName = `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Admin";
      }
    } catch {}
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    try {
      const response = await createNote({
        traineeId: trainee.id,
        author: authorName,
        date: formattedDate,
        text: noteText.trim(),
        initial: authorName.charAt(0).toUpperCase() || "A"
      });
      if (response.success && response.data) {
        setNotes([response.data, ...notes]);
        toast.success("Note added successfully!");
        closeAddNoteModal();
      } else {
        toast.error(response.message || "Failed to add note.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to add note.");
    }
  };
  const handleOpenNotePreview = note => {
    setSelectedNote(note);
    setIsPreviewModalOpen(true);
  };
  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setSelectedNote(null);
  };
  const openEditModal = index => {
    setEditingIndex(index);
    setEditNoteText(notes[index].text);
  };
  const handleSaveEditNote = async () => {
    if (editingIndex === null) return;
    if (!editNoteText.trim()) return;
    const original = notes[editingIndex];
    if (!original.id) {
      toast.error("Note ID is missing. Cannot update.");
      return;
    }
    try {
      const response = await updateNote(original.id, {
        text: editNoteText.trim()
      });
      if (response.success && response.data) {
        const updated = notes.map((n, idx) => idx === editingIndex ? response.data : n);
        setNotes(updated);
        toast.success("Note updated successfully!");
        setEditingIndex(null);
      } else {
        toast.error(response.message || "Failed to update note.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to update note.");
    }
  };
  const handleConfirmDeleteNote = async () => {
    if (deletingIndex === null) return;
    const target = notes[deletingIndex];
    if (!target.id) {
      toast.error("Note ID is missing. Cannot delete.");
      return;
    }
    try {
      const response = await deleteNote(target.id);
      if (response.success) {
        const updated = notes.filter((_, idx) => idx !== deletingIndex);
        setNotes(updated);
        toast.success("Note deleted successfully!");
        setDeletingIndex(null);
      } else {
        toast.error(response.message || "Failed to delete note.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete note.");
    }
  };
  return <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[22px] font-semibold text-[#222]">
              Notes
            </h2>
            <p className="text-xs text-[#7f7f7f]">
              Manager notes for {trainee.name}
            </p>
          </div>

          <button type="button" onClick={() => setIsAddNoteModalOpen(true)} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#ff5b21] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#ec4f16] cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            Add Notes
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {notes.map((note, index) => <div key={`${note.author}-${index}`} className="rounded-2xl border border-[#dddddd] bg-white p-5 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold shrink-0 ${initialsClassMap[index % initialsClassMap.length]}`}>
                    {note.initial}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1f1f1f]">
                      {note.author}
                    </h4>
                    <p className="text-xs text-[#8c8c8c]">{note.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => openEditModal(index)} className="cursor-pointer select-none transition hover:opacity-80" title="Edit Note">
                    <EditIconsvg className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={() => setDeletingIndex(index)} className="cursor-pointer select-none transition hover:opacity-80" title="Delete Note">
                    <DeleteIconsvg className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <p className="text-sm font-medium text-[#1f1f1f] leading-relaxed">
                {note.text}
              </p>
            </div>)}
        </div>
      </div>

      {/* Add Note Modal */}
      {isAddNoteModalOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
          <div className="relative w-full max-w-[380px] rounded-[24px] bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <button type="button" onClick={closeAddNoteModal} className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#0c101d] text-white hover:opacity-90 cursor-pointer transition z-10" aria-label="Close add note popup">
              <X className="h-4 w-4 stroke-[3.2px]" />
            </button>

            <div className="text-center mb-4">
              <h3 className="text-xl font-extrabold text-[#111827]">Add Note</h3>
              <p className="mt-1 text-xs text-gray-500">
                Add a new note record for {trainee.name}
              </p>
            </div>

            <div className="space-y-3">
              <textarea value={noteText} onChange={event => {
            setNoteText(event.target.value);
            if (noteError) {
              setNoteError("");
            }
          }} placeholder="Write a Note..." rows={4} className="w-full resize-none rounded-xl border border-gray-200 p-3.5 text-xs text-gray-700 outline-none transition focus:border-[#ff5b21] focus:ring-2 focus:ring-[#ff5b21]/15 placeholder:text-gray-400" />

              {noteError && <p className="text-xs font-medium text-[#ef4444]">{noteError}</p>}

              <button type="button" onClick={handleAddNote} className="h-11 w-full rounded-xl bg-[#ff5b21] text-sm font-semibold text-white transition hover:bg-[#ec4f16] cursor-pointer shadow-sm">
                Add Note
              </button>
            </div>
          </div>
        </div>}

      {/* Edit Note Modal */}
      {editingIndex !== null && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
          <div className="relative w-full max-w-[380px] rounded-[24px] bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <button type="button" onClick={() => setEditingIndex(null)} className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#0c101d] text-white hover:opacity-90 cursor-pointer transition z-10">
              <X className="h-4 w-4 stroke-[3.2px]" />
            </button>

            <div className="text-center mb-4">
              <h3 className="text-xl font-extrabold text-[#111827]">Edit Note</h3>
              <p className="mt-1 text-xs text-gray-500">
                Update note entry details
              </p>
            </div>

            <div className="space-y-3">
              <textarea value={editNoteText} onChange={e => setEditNoteText(e.target.value)} placeholder="Write a Note..." rows={4} className="w-full resize-none rounded-xl border border-gray-200 p-3.5 text-xs text-gray-700 outline-none transition focus:border-[#ff5b21] focus:ring-2 focus:ring-[#ff5b21]/15 placeholder:text-gray-400" />

              <button type="button" onClick={handleSaveEditNote} className="h-11 w-full rounded-xl bg-[#ff5b21] text-sm font-semibold text-white transition hover:bg-[#ec4f16] cursor-pointer shadow-sm">
                Save Changes
              </button>
            </div>
          </div>
        </div>}

      {/* Delete Confirmation Modal */}
      {deletingIndex !== null && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-[340px] rounded-[24px] bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500 mb-4">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Note?</h3>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed px-1">
                Are you sure you want to delete this note entry? This action cannot be undone.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setDeletingIndex(null)} className="h-10 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmDeleteNote} className="h-10 rounded-xl bg-[#ff4d4d] hover:bg-red-600 text-xs font-semibold text-white cursor-pointer transition">
                Delete
              </button>
            </div>
          </div>
        </div>}

      {/* Preview Full Remark Modal */}
      {isPreviewModalOpen && selectedNote && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
          <div className="relative w-full max-w-[400px] rounded-[24px] bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <button type="button" onClick={closePreviewModal} className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#0c101d] text-white hover:opacity-90 cursor-pointer transition z-10" aria-label="Close note preview popup">
              <X className="h-4 w-4 stroke-[3.2px]" />
            </button>

            <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold ${initialsClassMap[0]}`}>
                {selectedNote.initial}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{selectedNote.author}</p>
                <p className="text-xs text-gray-400">{selectedNote.date}</p>
              </div>
            </div>

            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Remark</h4>
            <p className="text-sm leading-relaxed text-gray-700 bg-gray-50 p-3.5 rounded-xl border border-gray-100 max-h-60 overflow-y-auto">
              {selectedNote.text}
            </p>
          </div>
        </div>}
    </>;
}