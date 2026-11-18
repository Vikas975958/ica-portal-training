"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, Plus, Trash2, X } from "lucide-react";
import { DeleteIconsvg, EditIconsvg } from "@/utils/svgicon";
import type { TraineeProfile } from "./trainingData";
import { ProjectTask } from "@/lib/api/types";
import { getProjectsByTrainee } from "@/lib/api/get";
import { createProject } from "@/lib/api/post";
import { updateProject } from "@/lib/api/patch";
import { deleteProject } from "@/lib/api/delete";
import { useRequestDeduplicator } from "@/lib/hooks/useRequestDeduplicator";
import { toast } from "react-toastify";

interface ProjectsTasksContentProps {
  trainee: TraineeProfile;
}

interface CustomStatusSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
}

function CustomStatusSelect({ value, onChange, options }: CustomStatusSelectProps) {
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

  return (
    <div className="relative select-none" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-10 w-full flex items-center justify-between rounded-xl border bg-white px-3.5 text-xs transition cursor-pointer ${
          isOpen
            ? "border-[#ff5b21] ring-2 ring-[#ff5b21]/15 text-gray-900"
            : "border-[#d8d8d8] text-gray-700 hover:border-gray-400"
        }`}
      >
        <span className={value ? "text-gray-900 font-semibold" : "text-gray-400 font-normal"}>
          {value || "--Select Status--"}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#ff5b21]" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 bottom-full mb-1.5 z-50 rounded-xl border border-gray-100 bg-white p-1.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-bottom-2 duration-150 max-h-48 overflow-y-auto no-scrollbar">
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

function getValidUrl(url?: string): string {
  if (!url) return "#";
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export default function ProjectsTasksContent({ trainee }: ProjectsTasksContentProps) {
  const [projects, setProjects] = useState<ProjectTask[]>([]);

  const { shouldFetch } = useRequestDeduplicator();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await getProjectsByTrainee(trainee.id);
        if (response.success && response.data) {
          const raw = response.data;
          const list = Array.isArray(raw)
            ? raw
            : (raw as any).projects || Object.values(raw).find(Array.isArray) || [];
          setProjects(list);
        } else {
          setProjects([]);
        }
      } catch (e) {
        console.error(e);
        setProjects([]);
      }
    };
    if (shouldFetch({ traineeId: trainee.id })) {
      loadProjects();
    }
  }, [trainee.id, shouldFetch]);

  const [isSubmitProjectModalOpen, setIsSubmitProjectModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const [projectError, setProjectError] = useState("");
  const [projectForm, setProjectForm] = useState({
    title: "",
    type: "",
    repo: "",
    live: "",
    result: "",
  });

  const updateProjectForm = (
    field: "title" | "type" | "repo" | "live" | "result",
    value: string,
  ) => {
    setProjectForm((current) => ({ ...current, [field]: value }));
    if (projectError) {
      setProjectError("");
    }
  };

  const resetProjectForm = () => {
    setProjectForm({
      title: "",
      type: "",
      repo: "",
      live: "",
      result: "",
    });
    setProjectError("");
  };

  const closeProjectModal = () => {
    setIsSubmitProjectModalOpen(false);
    resetProjectForm();
  };

  const handleAddProject = async () => {
    if (
      !projectForm.title.trim() ||
      !projectForm.type.trim() ||
      !projectForm.repo.trim() ||
      !projectForm.live.trim() ||
      !projectForm.result
    ) {
      setProjectError("Please fill all fields to submit project.");
      return;
    }

    try {
      const response = await createProject({
        traineeId: trainee.id,
        title: projectForm.title.trim(),
        type: projectForm.type.trim(),
        repo: projectForm.repo.trim(),
        live: projectForm.live.trim(),
        result: projectForm.result as "Approved" | "Under Review",
      });

      if (response.success && response.data) {
        setProjects([response.data, ...projects]);
        toast.success("Project submitted successfully!");
        closeProjectModal();
      } else {
        toast.error(response.message || "Failed to submit project.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to submit project.");
    }
  };

  const handleSaveEditProject = async (updatedProject: {
    title: string;
    type: string;
    repo: string;
    live: string;
    result: ProjectTask["result"];
  }) => {
    if (editingIndex !== null) {
      const original = projects[editingIndex];
      if (!original.id) {
        toast.error("Project ID is missing. Cannot update.");
        return;
      }
      try {
        const response = await updateProject(original.id, {
          title: updatedProject.title.trim(),
          type: updatedProject.type.trim(),
          repo: updatedProject.repo.trim(),
          live: updatedProject.live.trim(),
          result: updatedProject.result,
        });

        if (response.success && response.data) {
          const updated = projects.map((p, idx) => (idx === editingIndex ? response.data : p));
          setProjects(updated);
          toast.success("Project updated successfully!");
          setEditingIndex(null);
        } else {
          toast.error(response.message || "Failed to update project.");
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || "Failed to update project.");
      }
    }
  };

  const handleConfirmDeleteProject = async () => {
    if (deletingIndex !== null) {
      const target = projects[deletingIndex];
      if (!target.id) {
        toast.error("Project ID is missing. Cannot delete.");
        return;
      }
      try {
        const response = await deleteProject(target.id);
        if (response.success) {
          const updated = projects.filter((_, idx) => idx !== deletingIndex);
          setProjects(updated);
          toast.success("Project deleted successfully!");
          setDeletingIndex(null);
        } else {
          toast.error(response.message || "Failed to delete project.");
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || "Failed to delete project.");
      }
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[22px] font-semibold text-[#222]">Projects & Tasks</h2>
            <p className="text-xs text-[#7f7f7f]">Submitted projects with code & live links</p>
          </div>

          <button
            type="button"
            onClick={() => setIsSubmitProjectModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#ff5b21] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#ec4f16] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Submit Project
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <div
              key={`${project.title}-${index}`}
              className="rounded-2xl border border-[#dddddd] bg-white p-5 flex flex-col justify-between min-w-0 overflow-hidden"
            >
              <div className="min-w-0">
                <div className="mb-3 flex items-start justify-between gap-2 border-b border-[#eeeeee] pb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-[#1f1f1f] truncate" title={project.title}>
                      {project.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#8c8c8c] truncate" title={project.type}>
                      {project.type}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold shrink-0 ${
                      project.result === "Approved"
                        ? "bg-[#e3f7ed] text-[#00b060]"
                        : "bg-[#fef3c7] text-[#d97706]"
                    }`}
                  >
                    {project.result}
                  </span>
                </div>

                {(Boolean(project.repo?.trim()) || Boolean(project.live?.trim())) && (
                  <div className="space-y-2 text-xs text-[#1f1f1f] font-medium my-4 min-w-0">
                    {project.repo && project.repo.trim() !== "" && (
                      <div className="flex items-center gap-2 min-w-0">
                        <svg className="h-4 w-4 text-[#1d1d1d] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                        <a
                          href={getValidUrl(project.repo)}
                          target="_blank"
                          rel="noreferrer"
                          title={project.repo}
                          className="min-w-0 flex-1 truncate underline hover:text-[#ff5b21] transition"
                        >
                          {project.repo}
                        </a>
                      </div>
                    )}
                    {project.live && project.live.trim() !== "" && (
                      <div className="flex items-center gap-2 min-w-0">
                        <svg className="h-4 w-4 text-[#1d1d1d] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        <a
                          href={getValidUrl(project.live)}
                          target="_blank"
                          rel="noreferrer"
                          title={project.live}
                          className="min-w-0 flex-1 truncate underline hover:text-[#ff5b21] transition"
                        >
                          {project.live}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingIndex(index)}
                  className="cursor-pointer select-none transition hover:opacity-80"
                  title="Edit Project"
                >
                  <EditIconsvg className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingIndex(index)}
                  className="cursor-pointer select-none transition hover:opacity-80"
                  title="Delete Project"
                >
                  <DeleteIconsvg className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isSubmitProjectModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px] overflow-y-auto">
          <div className="relative my-auto w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-2xl">
            <button
              type="button"
              onClick={closeProjectModal}
              className="absolute -top-4 -right-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#0c101d] text-white hover:opacity-90 cursor-pointer transition z-10"
              aria-label="Close submit project popup"
            >
              <X className="h-4 w-4 stroke-[3.2px]" />
            </button>

            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold text-[#222]">Submit Project</h3>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Project Title"
                value={projectForm.title}
                onChange={(event) => updateProjectForm("title", event.target.value)}
                className="h-10 w-full rounded-xl border border-[#d8d8d8] bg-white px-3.5 text-xs text-gray-800 outline-none transition focus:border-[#ff5b21] placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Tech / Stack"
                value={projectForm.type}
                onChange={(event) => updateProjectForm("type", event.target.value)}
                className="h-10 w-full rounded-xl border border-[#d8d8d8] bg-white px-3.5 text-xs text-gray-800 outline-none transition focus:border-[#ff5b21] placeholder-gray-400"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Code Link"
                  value={projectForm.repo}
                  onChange={(event) => updateProjectForm("repo", event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#d8d8d8] bg-white px-3.5 text-xs text-gray-800 outline-none transition focus:border-[#ff5b21] placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Website Link"
                  value={projectForm.live}
                  onChange={(event) => updateProjectForm("live", event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#d8d8d8] bg-white px-3.5 text-xs text-gray-800 outline-none transition focus:border-[#ff5b21] placeholder-gray-400"
                />
              </div>

              <CustomStatusSelect
                value={projectForm.result}
                onChange={(val) => updateProjectForm("result", val)}
                options={["Approved", "Under Review", "Rejected"]}
              />

              {projectError && <p className="text-[11px] font-medium text-[#ef4444] px-1">{projectError}</p>}

              <button
                type="button"
                onClick={handleAddProject}
                className="mt-2.5 h-10 w-full rounded-xl bg-[#ff5b21] text-xs font-semibold text-white transition hover:bg-[#ec4f16] cursor-pointer"
              >
                Add Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={editingIndex !== null}
        project={editingIndex !== null ? projects[editingIndex] : null}
        onClose={() => setEditingIndex(null)}
        onSave={handleSaveEditProject}
      />

      {/* Delete Project Modal */}
      <DeleteProjectModal
        isOpen={deletingIndex !== null}
        onClose={() => setDeletingIndex(null)}
        onConfirm={handleConfirmDeleteProject}
      />
    </>
  );
}

interface EditProjectModalProps {
  isOpen: boolean;
  project: ProjectTask | null;
  onClose: () => void;
  onSave: (updated: { title: string; type: string; repo: string; live: string; result: ProjectTask["result"] }) => void;
}

function EditProjectModal({ isOpen, project, onClose, onSave }: EditProjectModalProps) {
  const [form, setForm] = useState<{
    title: string;
    type: string;
    repo: string;
    live: string;
    result: ProjectTask["result"];
  }>({
    title: "",
    type: "",
    repo: "",
    live: "",
    result: "Approved",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (project) {
      setForm({
        title: project.title,
        type: project.type,
        repo: project.repo,
        live: project.live,
        result: project.result,
      });
      setError("");
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSave = () => {
    if (!form.title.trim() || !form.type.trim() || !form.repo.trim() || !form.live.trim() || !form.result) {
      setError("Please fill all required fields.");
      return;
    }
    onSave({
      title: form.title.trim(),
      type: form.type.trim(),
      repo: form.repo.trim(),
      live: form.live.trim(),
      result: form.result,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px] overflow-y-auto">
      <div className="relative my-auto w-full max-w-[380px] rounded-2xl bg-white p-5 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-4 -right-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#0c101d] text-white hover:opacity-90 cursor-pointer transition z-10"
        >
          <X className="h-4 w-4 stroke-[3.2px]" />
        </button>

        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-[#222]">Edit Project</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Project Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="h-10 w-full rounded-xl border border-[#d8d8d8] bg-white px-3.5 text-xs text-gray-800 outline-none transition focus:border-[#ff5b21]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Tech / Stack</label>
            <input
              type="text"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="h-10 w-full rounded-xl border border-[#d8d8d8] bg-white px-3.5 text-xs text-gray-800 outline-none transition focus:border-[#ff5b21]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Code Link</label>
              <input
                type="text"
                value={form.repo}
                onChange={(e) => setForm({ ...form, repo: e.target.value })}
                className="h-10 w-full rounded-xl border border-[#d8d8d8] bg-white px-3.5 text-xs text-gray-800 outline-none transition focus:border-[#ff5b21]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Website Link</label>
              <input
                type="text"
                value={form.live}
                onChange={(e) => setForm({ ...form, live: e.target.value })}
                className="h-10 w-full rounded-xl border border-[#d8d8d8] bg-white px-3.5 text-xs text-gray-800 outline-none transition focus:border-[#ff5b21]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Status</label>
            <CustomStatusSelect
              value={form.result}
              onChange={(val) => setForm({ ...form, result: val as ProjectTask["result"] })}
              options={["Approved", "Under Review", "Rejected"]}
            />
          </div>

          {error && <p className="text-[11px] font-medium text-red-500">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 flex-1 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="h-10 flex-1 rounded-xl bg-[#ff5b21] text-xs font-semibold text-white hover:bg-[#ec4f16] cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteProjectModal({ isOpen, onClose, onConfirm }: DeleteProjectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px] overflow-y-auto">
      <div className="relative my-auto w-full max-w-[340px] rounded-2xl bg-white p-5 text-center shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-4 -right-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#0c101d] text-white hover:opacity-90 cursor-pointer transition z-10"
        >
          <X className="h-4 w-4 stroke-[3.2px]" />
        </button>

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500 mb-3">
          <Trash2 className="h-6 w-6" />
        </div>

        <h3 className="text-lg font-bold text-gray-900">Delete Project</h3>
        <p className="mt-1 text-xs text-gray-500">
          Are you sure you want to delete this project? This action cannot be undone.
        </p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 flex-1 rounded-xl bg-red-500 text-xs font-semibold text-white hover:bg-red-600 cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

