"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DeleteIconsvg, EditIconsvg, HoldIconsvg } from "@/utils/svgicon";
import { DeleteTraineeModal, UpdateStatusModal, PutOnHoldModal } from "./TraineeActions";
import Breadcrumb from "@/components/Breadcrumb";
import { updateTraineeStatusApi } from "@/api/put";
import { deleteTraineeApi } from "@/api/delete";
import { toast } from "react-toastify";

const accountTabs = [
  {
    key: "details",
    label: "Trainee Details",
    href: (id) => `/dashboard/trainees/${id}/details`,
  },
  {
    key: "projects",
    label: "Projects & Tasks",
    href: (id) => `/dashboard/trainees/${id}/projects`,
  },
  {
    key: "fees",
    label: "Fees & Payments",
    href: (id) => `/dashboard/trainees/${id}/fees`,
  },
  {
    key: "placement",
    label: "Placement Details",
    href: (id) => `/dashboard/trainees/${id}/placement`,
  },
  {
    key: "notes",
    label: "Notes",
    href: (id) => `/dashboard/trainees/${id}/notes`,
  },
];

export default function TraineeAccountShell({
  trainee,
  activeTab,
  children,
}) {
  const router = useRouter();

  const [status, setStatus] = useState(trainee?.status || "Active");
  const [holdReason, setHoldReason] = useState("need to pay the this month fees");

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isHoldOpen, setIsHoldOpen] = useState(false);

  const handleConfirmDelete = async () => {
    try {
      await deleteTraineeApi(trainee.id);
      toast.success("Trainee dropped successfully!");
    } catch (err) {
      console.error("Failed to delete trainee:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to drop trainee.");
    }
    setIsDeleteOpen(false);
    router.push("/dashboard/trainees");
  };

  const handleConfirmUpdateStatus = async (newStatus, reason) => {
    try {
      await updateTraineeStatusApi(trainee.id, { status: newStatus });
      setStatus(newStatus);
      if (newStatus === "On Hold") {
        setHoldReason(reason || "need to pay the this month fees");
      }
      toast.success(`Trainee status updated to "${newStatus}"!`);
    } catch (err) {
      console.error("Failed to update trainee status:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to update trainee status.");
    }
    setIsUpdateOpen(false);
  };

  const handleConfirmHoldQuick = async (reason) => {
    try {
      await updateTraineeStatusApi(trainee.id, { status: "On Hold" });
      setStatus("On Hold");
      setHoldReason(reason || "need to pay the this month fees");
      toast.success("Trainee put on hold!");
    } catch (err) {
      console.error("Failed to set trainee on hold:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to put trainee on hold.");
    }
    setIsHoldOpen(false);
  };

  const handleUnhold = async () => {
    try {
      await updateTraineeStatusApi(trainee.id, { status: "Active" });
      setStatus("Active");
      toast.success("Trainee resumed successfully!");
    } catch (err) {
      console.error("Failed to unhold trainee:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to resume trainee.");
    }
  };

  const handleHoldIconClick = async () => {
    if (status === "On Hold") {
      return;
    }
    setIsHoldOpen(true);
  };

  const updatedTrainee = {
    ...trainee,
    status,
  };

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        trainee: updatedTrainee,
        onUpdateStatusClick: () => setIsUpdateOpen(true),
      });
    }
    return child;
  });

  const traineeId = String(trainee?.id || "");
  const shortId = trainee?.traineeCode
    ? String(trainee.traineeCode).toUpperCase()
    : traineeId ? traineeId.slice(-4).toUpperCase() : "";

  return (
    <div className="mx-auto w-full space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Breadcrumb
          backText="Trainees Management"
          backHref="/dashboard/trainees"
          currentText={`ID: ${shortId}`}
          withBottomMargin={false}
        />

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href={`/dashboard/trainees/${trainee?.id}/edit`}
            className="h-8 w-8 block select-none cursor-pointer"
            title="Edit Profile"
          >
            <EditIconsvg className="h-8 w-8" />
          </Link>
          {status !== "On Hold" && (
            <button
              type="button"
              onClick={handleHoldIconClick}
              className="cursor-pointer select-none hover:opacity-85 transition"
              title="Put on Hold"
            >
              <HoldIconsvg className="h-8 w-8" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="cursor-pointer select-none"
            title="Drop Trainee"
          >
            <DeleteIconsvg className="h-8 w-8" />
          </button>
        </div>
      </div>

      {status === "On Hold" && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-[#fff9f4] border border-[#ff5b21]/20 rounded-2xl gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffeedd] text-[#ff5b21]">
              <HoldIconsvg className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#ff5b21]">On Hold</h4>
              <p className="text-xs text-[#555] font-medium mt-0.5">{holdReason}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleUnhold}
            className="px-6 py-2 rounded-xl bg-[#ff5b21] hover:bg-[#e04f1a] text-white text-xs font-semibold tracking-wide transition shadow-sm cursor-pointer shrink-0"
          >
            Unhold
          </button>
        </div>
      )}

      <h1 className="text-[22px] font-bold text-[#1f1f1f]">Account Details</h1>

      <div className="no-scrollbar overflow-x-auto border-b-0 sm:border-b sm:border-[#dddddd]">
        <div className="flex min-w-max items-center gap-6">
          {accountTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Link
                key={tab.key}
                href={tab.href(trainee?.id)}
                className={`border-b-2 pb-2 text-xs font-medium transition ${
                  isActive
                    ? "border-[#ff5b21] text-[#ff5b21]"
                    : "border-transparent text-[#555] hover:text-[#222]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {childrenWithProps}

      <DeleteTraineeModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      <UpdateStatusModal
        isOpen={isUpdateOpen}
        currentStatus={status}
        onClose={() => setIsUpdateOpen(false)}
        onConfirm={handleConfirmUpdateStatus}
      />

      <PutOnHoldModal
        isOpen={isHoldOpen}
        onClose={() => setIsHoldOpen(false)}
        onConfirm={handleConfirmHoldQuick}
      />
    </div>
  );
}
