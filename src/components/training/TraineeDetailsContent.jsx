"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { DeleteIconsvg, EditIconsvg } from "@/utils/svgicon";
import { AddQualificationModal, EditQualificationModal, DeleteQualificationModal, EditEmergencyModal, EditProgramModal } from "./TraineeActions";
import { updateTrainee } from "@/api/patch";
import { toast } from "react-toastify";
const statusClassMap = {
  Enrolled: "bg-purple-100 text-purple-700",
  Active: "bg-blue-100 text-blue-700",
  "On Hold": "bg-amber-100 text-amber-700",
  Completed: "bg-green-100 text-green-700",
  Dropped: "bg-red-100 text-red-700",
  Inactive: "bg-gray-100 text-gray-700"
};
export default function TraineeDetailsContent({
  trainee,
  onUpdateStatusClick
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [qualificationsList, setQualificationsList] = useState(trainee.qualifications);

  // Emergency & Program Details editable state
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [emergencyInfo, setEmergencyInfo] = useState({
    name: trainee.emergencyName,
    relationship: trainee.emergencyRelationship,
    phone: trainee.emergencyPhone
  });
  const [programInfo, setProgramInfo] = useState({
    programName: trainee.programName,
    duration: trainee.programDuration,
    paymentMode: trainee.paymentMode
  });
  const traineeId = String(trainee.id || "");
  const shortId = trainee.traineeCode ? String(trainee.traineeCode).toUpperCase() : traineeId ? traineeId.slice(-4).toUpperCase() : "";
  const handleSaveTraineeField = async updates => {
    const nameStr = trainee.name || "";
    const nameParts = nameStr.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    const emergencyNameVal = updates.emergencyName ?? emergencyInfo.name;
    const emergencyParts = (emergencyNameVal || "").trim().split(/\s+/);
    const emergencyFirst = emergencyParts[0] || "Emergency";
    const emergencyLast = emergencyParts.slice(1).join(" ") || "Contact";
    const emergencyRelationshipVal = updates.emergencyRelationship ?? emergencyInfo.relationship;
    const emergencyPhoneVal = updates.emergencyPhone ?? emergencyInfo.phone;
    const targetQuals = updates.qualifications ?? qualificationsList;
    const mappedQuals = targetQuals.map(q => ({
      qualification: q.degree,
      institution_name: q.college,
      start_date: q.sessionStart,
      completion_date: q.sessionEnd,
      status: "Completed"
    }));
    const programIdVal = updates.programId ?? trainee.programId ?? "d9b0a1d4-8d96-4a47-a8a5-8c7c9a9d7b12";
    const paymentModeVal = updates.paymentMode ?? programInfo.paymentMode ?? "Cash";
    const totalFeesVal = updates.newFees !== undefined ? updates.newFees : Number(trainee.fees.total) || 0;
    const discountVal = Number(trainee.fees.discount) || 0;
    const payableAmountVal = Math.max(0, totalFeesVal - discountVal);
    const dto = {
      first_name: firstName,
      last_name: lastName,
      email: trainee.email || "",
      phone: trainee.phone || "",
      gender: trainee.gender || "Other",
      flat_house_number: trainee.addressLine || "",
      street_address: trainee.addressStreet || "",
      city: trainee.addressCity || "",
      state: trainee.addressState || "",
      pin_code: trainee.addressPinCode || "",
      emergency_contact: {
        first_name: emergencyFirst,
        last_name: emergencyLast,
        relationship: emergencyRelationshipVal,
        phone: emergencyPhoneVal
      },
      qualifications: mappedQuals,
      program_id: programIdVal,
      date_of_registration: trainee.registrationDate ? trainee.registrationDate.split("T")[0] : new Date().toISOString().split('T')[0],
      total_fees: totalFeesVal,
      scholarship_discount: discountVal,
      payable_amount: payableAmountVal,
      number_of_instalments: trainee.numberOfInstallments || 4,
      number_of_installments: trainee.numberOfInstallments || 4,
      registration_fee: Number(trainee.fees.paidAmount) || 0,
      registration_fee_amount: Number(trainee.fees.paidAmount) || 0,
      payment_mode: paymentModeVal,
      remark: trainee.fees.remarks || "",
      status: trainee.status || "Enrolled"
    };
    try {
      const res = await updateTrainee(trainee.id, dto);
      if (res.success) {
        toast.success("Trainee profile updated successfully!");
        return true;
      } else {
        toast.error(res.message || "Failed to update trainee profile.");
        return false;
      }
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? String(err.message) : "An unexpected network error occurred.";
      toast.error(msg);
      return false;
    }
  };
  const handleAddQualification = async newQual => {
    const updatedQuals = [newQual, ...qualificationsList];
    const success = await handleSaveTraineeField({
      qualifications: updatedQuals
    });
    if (success) {
      setQualificationsList(updatedQuals);
    }
  };
  const handleSaveEditQualification = async updatedQual => {
    if (editingIndex !== null) {
      const updatedQuals = qualificationsList.map((q, idx) => idx === editingIndex ? updatedQual : q);
      const success = await handleSaveTraineeField({
        qualifications: updatedQuals
      });
      if (success) {
        setQualificationsList(updatedQuals);
      }
    }
  };
  const handleConfirmDeleteQualification = async () => {
    if (deletingIndex !== null) {
      const updatedQuals = qualificationsList.filter((_, idx) => idx !== deletingIndex);
      const success = await handleSaveTraineeField({
        qualifications: updatedQuals
      });
      if (success) {
        setQualificationsList(updatedQuals);
        setDeletingIndex(null);
      }
    }
  };
  return <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="rounded-2xl border border-[#dddddd] bg-white p-5 text-center flex flex-col items-center justify-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-yellow-100 text-4xl font-semibold text-[#2f2f2f] shadow-xs">
            {trainee.name.charAt(0)}
          </div>
          <h2 className="mt-3 text-xl font-bold text-[#1f1f1f]">
            {trainee.name}
          </h2>
          <p className="mt-1 text-xs font-semibold text-[#ff5b21]">
            Student ID: {shortId}
          </p>
        </div>

        <div className="rounded-2xl border border-[#dddddd] bg-white p-5">
          <div className="grid gap-4 md:grid-cols-2 md:gap-x-8">
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[#8c8c8c]">Email Address</p>
                <p className="mt-0.5 text-sm font-semibold text-[#1f1f1f]">
                  {trainee.email}
                </p>
              </div>
              <div>
                <p className="text-[#8c8c8c]">Phone Number</p>
                <p className="mt-0.5 text-sm font-semibold text-[#1f1f1f]">
                  {trainee.phone}
                </p>
              </div>
              <div>
                <p className="text-[#8c8c8c]">Date of Registration</p>
                <p className="mt-0.5 text-sm font-semibold text-[#1f1f1f]">
                  {trainee.registrationDate}
                </p>
              </div>
              <div>
                <p className="text-[#8c8c8c]">Gender</p>
                <p className="mt-0.5 text-sm font-semibold text-[#1f1f1f]">
                  {trainee.gender}
                </p>
              </div>
            </div>

            <div className="space-y-3 border-t border-[#eeeeee] pt-3 text-xs md:border-l md:border-t-0 md:pl-8 md:pt-0">
              <div>
                <p className="text-[#8c8c8c]">Address</p>
                <p className="mt-0.5 text-sm font-semibold text-[#1f1f1f]">
                  {trainee.addressLine}
                </p>
                <p className="text-xs text-[#666666] mt-0.5">
                  {trainee.addressDetail}
                </p>
              </div>
              <div>
                <p className="text-[#8c8c8c]">Status</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusClassMap[trainee.status] || "bg-gray-100 text-gray-700"}`}>
                    {trainee.status}
                  </span>
                  <button type="button" onClick={onUpdateStatusClick} className="cursor-pointer select-none bg-transparent border-0 p-0 outline-none" title="Update Status">
                    <EditIconsvg className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#dddddd] bg-white p-5">
          <div className="mb-4 flex items-center justify-between border-b border-[#eeeeee] pb-3">
            <h3 className="text-base font-bold text-[#1f1f1f]">
              Emergency Contact
            </h3>
            <button type="button" onClick={() => setIsEmergencyModalOpen(true)} className="cursor-pointer select-none bg-transparent border-0 p-0 outline-none" title="Edit Emergency Contact">
              <EditIconsvg className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-y-3 gap-x-4 text-xs sm:grid-cols-2">
            <div>
              <p className="text-[#8c8c8c]">Name</p>
              <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">
                {emergencyInfo.name}
              </p>
            </div>
            <div>
              <p className="text-[#8c8c8c]">Relationship</p>
              <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">
                {emergencyInfo.relationship}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-[#8c8c8c]">Contact No.</p>
              <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">
                {emergencyInfo.phone}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#dddddd] bg-white p-5">
          <div className="mb-4 flex items-center justify-between border-b border-[#eeeeee] pb-3">
            <h3 className="text-base font-bold text-[#1f1f1f]">
              Program Details
            </h3>
            <button type="button" onClick={() => setIsProgramModalOpen(true)} className="cursor-pointer select-none bg-transparent border-0 p-0 outline-none" title="Edit Program Details">
              <EditIconsvg className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-y-3 gap-x-4 text-xs sm:grid-cols-2">
            <div>
              <p className="text-[#8c8c8c]">Program</p>
              <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">
                {programInfo.programName}
              </p>
            </div>
            <div>
              <p className="text-[#8c8c8c]">Duration</p>
              <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">
                {programInfo.duration}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-[#8c8c8c]">Mode of Payment</p>
              <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">
                {programInfo.paymentMode}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-[22px] font-semibold text-[#222]">
            Education Qualification
          </h3>
          <button type="button" onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#ff5b21] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#ec4f16] cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            Add Education
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {qualificationsList.map((qualification, index) => <div key={`${qualification.degree}-${index}`} className="rounded-2xl border border-[#dddddd] bg-white p-5">
              <div className="mb-4 flex items-start justify-between border-b border-[#eeeeee] pb-3">
                <div>
                  <h4 className="text-base font-bold text-[#1f1f1f]">
                    {qualification.degree}
                  </h4>
                  <p className="mt-0.5 text-xs text-[#8c8c8c]">
                    {qualification.college}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => setEditingIndex(index)} className="cursor-pointer select-none bg-transparent border-0 p-0 outline-none" title="Edit Qualification">
                    <EditIconsvg className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={() => setDeletingIndex(index)} className="cursor-pointer select-none bg-transparent border-0 p-0 outline-none" title="Delete Qualification">
                    <DeleteIconsvg className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[#8c8c8c]">Session Start</p>
                  <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">
                    {qualification.sessionStart}
                  </p>
                </div>
                <div>
                  <p className="text-[#8c8c8c]">Session End</p>
                  <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">
                    {qualification.sessionEnd}
                  </p>
                </div>
              </div>
            </div>)}
        </div>
      </div>

      <AddQualificationModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddQualification} />

      <EditQualificationModal isOpen={editingIndex !== null} qualification={editingIndex !== null ? qualificationsList[editingIndex] : null} onClose={() => setEditingIndex(null)} onSave={handleSaveEditQualification} />

      <DeleteQualificationModal isOpen={deletingIndex !== null} onClose={() => setDeletingIndex(null)} onConfirm={handleConfirmDeleteQualification} />

      <EditEmergencyModal isOpen={isEmergencyModalOpen} onClose={() => setIsEmergencyModalOpen(false)} emergencyData={emergencyInfo} onSave={async updated => {
      const success = await handleSaveTraineeField({
        emergencyName: updated.name,
        emergencyRelationship: updated.relationship,
        emergencyPhone: updated.phone
      });
      if (success) {
        setEmergencyInfo(updated);
      }
    }} />

      <EditProgramModal isOpen={isProgramModalOpen} onClose={() => setIsProgramModalOpen(false)} programData={programInfo} onSave={async updated => {
      const success = await handleSaveTraineeField({
        programName: updated.programName,
        programDuration: updated.duration,
        paymentMode: updated.paymentMode,
        programId: updated.programId,
        newFees: updated.fees
      });
      if (success) {
        setProgramInfo({
          programName: updated.programName,
          duration: updated.duration,
          paymentMode: updated.paymentMode
        });
        window.location.reload();
      }
    }} />
    </div>;
}