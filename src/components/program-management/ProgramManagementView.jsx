"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ProgramFilters from "@/components/program-management/ProgramFilters";
import ProgramTable from "@/components/program-management/ProgramTable";
import {
  DeleteProgramModal,
  EditProgramModal,
  UnableDeleteModal,
  ViewProgramModal,
} from "@/components/program-management/ProgramActions";
import { usePrograms } from "@/hooks/program/useProgram";
import { deleteProgram } from "@/api/delete";
import { toggleProgramStatus, updateProgram } from "@/api/put";
import { getProgramErrorMessage } from "@/utils/program/program.utils";

export default function ProgramManagementView() {
  const {
    programs,
    setPrograms,
    allTags,
    isLoading,
    error,
    search,
    selectedStatus,
    selectedTag,
    currentPage,
    totalPages,
    totalRecords,
    sortConfig,
    setSearch,
    setSelectedStatus,
    setSelectedTag,
    setCurrentPage,
    setSort,
    reloadPrograms,
    reloadTags,
  } = usePrograms();
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [openDialog, setOpenDialog] = useState(null);
  const [togglingProgramId, setTogglingProgramId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  function closeDialog() {
    setOpenDialog(null);
    setSelectedProgram(null);
  }

  function handleAction(action, program) {
    setActiveMenuId(null);
    setSelectedProgram(program);

    if (action === "delete" && program.isAssigned) {
      setOpenDialog("unable-delete");
      return;
    }

    setOpenDialog(action);
  }

  async function handleToggleStatus(program) {
    if (togglingProgramId !== null) return;
    setTogglingProgramId(program.id);

    try {
      const response = await toggleProgramStatus(String(program.id));
      if (!response.success) {
        toast.error(response.message || "Failed to update program status.");
        return;
      }

      setPrograms((current) =>
        current.map((item) =>
          item.id === program.id ? { ...item, status: !item.status } : item
        )
      );

      setSelectedProgram((current) =>
        current?.id === program.id ? { ...current, status: !current.status } : current,
      );
      await reloadPrograms(undefined, true);
      toast.success("Program status updated successfully!");
    } catch (statusError) {
      console.error("Failed to toggle program status:", statusError);
      toast.error(getProgramErrorMessage(statusError, "An error occurred while updating status."));
    } finally {
      setTogglingProgramId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!selectedProgram || isDeleting) return;
    setIsDeleting(true);

    try {
      const response = await deleteProgram(String(selectedProgram.id));
      if (!response.success) {
        toast.error(response.message || "Failed to delete program.");
        return;
      }

      closeDialog();
      if (programs.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
        await reloadTags();
      } else {
        await Promise.all([reloadPrograms(), reloadTags()]);
      }
      toast.success("Program deleted successfully!");
    } catch (deleteError) {
      console.error("Failed to delete program:", deleteError);
      toast.error(getProgramErrorMessage(deleteError, "An error occurred while deleting the program."));
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSaveProgram(values) {
    if (!selectedProgram || isSaving) return;
    setIsSaving(true);

    try {
      const response = await updateProgram(String(selectedProgram.id), values);
      if (!response.success) {
        toast.error(response.message || "Failed to update program.");
        return;
      }

      await Promise.all([reloadPrograms(), reloadTags()]);
      closeDialog();
      toast.success("Program updated successfully!");
    } catch (saveError) {
      console.error("Failed to update program:", saveError);
      toast.error(getProgramErrorMessage(saveError, "An error occurred while saving the program."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-[#1f1f1f]">Program Management</h1>
        <p className="mt-1 text-xs text-gray-500">Manage all training Programs from one place.</p>
      </div>

      <ProgramFilters
        search={search}
        selectedStatus={selectedStatus}
        selectedTag={selectedTag}
        tags={allTags}
        onSearchChange={setSearch}
        onStatusChange={setSelectedStatus}
        onTagChange={setSelectedTag}
      />

      <ProgramTable
        programs={programs}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        sortConfig={sortConfig}
        activeMenuId={activeMenuId}
        togglingProgramId={togglingProgramId}
        onSort={setSort}
        onPageChange={(page) => {
          setActiveMenuId(null);
          setCurrentPage(page);
        }}
        onAction={handleAction}
        onMenuChange={setActiveMenuId}
        onToggleStatus={handleToggleStatus}
      />

      {openDialog === "view" && selectedProgram && (
        <ViewProgramModal
          program={selectedProgram}
          isToggling={togglingProgramId === selectedProgram.id}
          onClose={closeDialog}
          onToggleStatus={() => handleToggleStatus(selectedProgram)}
        />
      )}
      {openDialog === "delete" && selectedProgram && (
        <DeleteProgramModal
          program={selectedProgram}
          isDeleting={isDeleting}
          onClose={closeDialog}
          onConfirm={handleConfirmDelete}
        />
      )}
      {openDialog === "unable-delete" && <UnableDeleteModal onClose={closeDialog} />}
      {openDialog === "edit" && selectedProgram && (
        <EditProgramModal
          key={selectedProgram.id}
          program={selectedProgram}
          isSaving={isSaving}
          onClose={closeDialog}
          onSave={handleSaveProgram}
        />
      )}
    </div>
  );
}
