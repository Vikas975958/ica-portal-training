import React, { useState, useRef, useEffect } from "react";
import { Trash2, X, ChevronDown, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { HoldIconsvg, CalendarIcon, DeleteIconsvg } from "@/utils/svgicon";
import { getAllPrograms } from "@/api/get";
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export function MonthYearPickerPopover({
  isOpen,
  onClose,
  value,
  onChange,
  alignRight = false
}) {
  const currentYearNow = new Date().getFullYear();
  let initialYear = currentYearNow;
  if (value) {
    const parts = value.trim().split(" ");
    if (parts.length >= 2) {
      const parsedYear = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(parsedYear)) initialYear = parsedYear;
    }
  }
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [viewMode, setViewMode] = useState("months");
  const [yearPageStart, setYearPageStart] = useState(Math.floor((initialYear - 1) / 12) * 12 + 1);
  const popoverRef = useRef(null);
  useEffect(() => {
    if (value) {
      const parts = value.trim().split(" ");
      if (parts.length >= 2) {
        const parsedYear = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(parsedYear)) {
          setSelectedYear(parsedYear);
          setYearPageStart(Math.floor((parsedYear - 1) / 12) * 12 + 1);
        }
      }
    }
  }, [value, isOpen]);
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  const handleSelectMonth = monthName => {
    onChange(`${monthName} ${selectedYear}`);
    onClose();
  };
  const yearsInPage = Array.from({
    length: 12
  }, (_, i) => yearPageStart + i);
  return <div ref={popoverRef} className={`absolute bottom-full mb-1 z-[150] w-[240px] sm:w-[250px] rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-150 select-none ${alignRight ? "right-0" : "left-0"}`}>
      {/* Header: Year / Range Navigation */}
      <div className="flex items-center justify-between mb-2.5 border-b border-gray-100 pb-2">
        <button type="button" onClick={() => {
        if (viewMode === "months") {
          setSelectedYear(y => y - 1);
        } else {
          setYearPageStart(y => y - 12);
        }
      }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition cursor-pointer">
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button type="button" onClick={() => setViewMode(viewMode === "months" ? "years" : "months")} className="flex items-center gap-1 font-bold text-xs text-gray-900 hover:text-[#ff5b21] transition cursor-pointer px-2 py-1 rounded-lg hover:bg-orange-50">
          <span>
            {viewMode === "months" ? selectedYear : `${yearPageStart} - ${yearPageStart + 11}`}
          </span>
          <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${viewMode === "years" ? "rotate-180 text-[#ff5b21]" : ""}`} />
        </button>

        <button type="button" onClick={() => {
        if (viewMode === "months") {
          setSelectedYear(y => y + 1);
        } else {
          setYearPageStart(y => y + 12);
        }
      }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition cursor-pointer">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Body: Months Grid or 12-Year Grid */}
      {viewMode === "months" ? <div className="grid grid-cols-3 gap-1.5">
          {MONTH_NAMES.map(m => {
        const shortName = m.substring(0, 3);
        const isSelected = value === `${m} ${selectedYear}`;
        return <button key={m} type="button" onClick={() => handleSelectMonth(m)} className={`py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${isSelected ? "bg-[#ff5b21] text-white font-bold shadow-xs" : "bg-gray-50 text-gray-700 hover:bg-[#fff7f4] hover:text-[#ff5b21]"}`}>
                {shortName}
              </button>;
      })}
        </div> : <div className="grid grid-cols-3 gap-1.5">
          {yearsInPage.map(y => {
        const isSelected = y === selectedYear;
        return <button key={y} type="button" onClick={() => {
          setSelectedYear(y);
          setViewMode("months");
        }} className={`py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${isSelected ? "bg-[#ff5b21] text-white font-bold shadow-xs" : "bg-gray-50 text-gray-700 hover:bg-[#fff7f4] hover:text-[#ff5b21]"}`}>
                {y}
              </button>;
      })}
        </div>}
    </div>;
}

// 1. Delete / Drop Trainee Modal

export function DeleteTraineeModal({
  isOpen,
  onClose,
  onConfirm
}) {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[340px] rounded-[24px] bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex flex-col items-center  text-center">
          <div className="flex h-12 w-12 bg-[#fb4a49] items-center justify-center rounded-full text-red-500 mb-4">
            <DeleteIconsvg className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Drop Trainee?</h3>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed px-1">
            Are you sure you want to mark this trainee as Dropped? Their training will be discontinued, and their assigned program status will be updated accordingly.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="h-10 rounded-xl bg-[#ff4d4d] hover:bg-red-600 text-xs font-semibold text-white cursor-pointer transition">
            Drop Trainee
          </button>
        </div>
      </div>
    </div>;
}

// 2. Update Status Modal

export function UpdateStatusModal({
  isOpen,
  currentStatus,
  onClose,
  onConfirm
}) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [holdReason, setHoldReason] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const hasChanges = selectedStatus !== currentStatus || selectedStatus === "On Hold" && holdReason.trim() !== "";
  const dropdownRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  if (!isOpen) return null;
  const handleUpdate = () => {
    onConfirm(selectedStatus, selectedStatus === "On Hold" ? holdReason : undefined);
  };
  const statusOptions = ["Active", "Completed", "Enrolled"];
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[340px] rounded-[24px] bg-white p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button type="button" onClick={onClose} className="absolute -top-4 -right-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#0c101d] text-white hover:opacity-90 cursor-pointer transition z-10">
          <X className="h-4 w-4 stroke-[3.2px]" />
        </button>

        <h3 className="text-lg font-bold text-gray-900 text-center mt-2">Update Trainee Status</h3>
        <p className="mt-1 text-xs text-gray-500 text-center">
          Are you sure you want to update the trainee's status?
        </p>

        {/* Custom Modern Dropdown Selector */}
        <div className="relative mt-4 select-none" ref={dropdownRef}>
          <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`w-full flex items-center justify-between border rounded-xl px-3.5 py-2.5 text-sm font-medium bg-white transition cursor-pointer ${isDropdownOpen ? "border-[#ff5b21] ring-2 ring-[#ff5b21]/15 text-gray-900" : "border-gray-200 text-gray-700 hover:border-gray-300"}`}>
            <span>{selectedStatus}</span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180 text-[#ff5b21]" : ""}`} />
          </button>

          {isDropdownOpen && <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-top-2 duration-150">
              {statusOptions.map(option => {
            const isSelected = selectedStatus === option;
            return <button key={option} type="button" onClick={() => {
              setSelectedStatus(option);
              setIsDropdownOpen(false);
            }} className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${isSelected ? "bg-[#fff7f4] text-[#ff5b21]" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"}`}>
                    <span>{option}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-[#ff5b21]" />}
                  </button>;
          })}
            </div>}
        </div>

        {selectedStatus === "On Hold" && <textarea value={holdReason} onChange={e => setHoldReason(e.target.value)} placeholder="Reason for putting on hold" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 mt-3 h-20 outline-none transition focus:border-[#ff5b21] focus:ring-2 focus:ring-[#ff5b21]/15 resize-none" />}

        <button type="button" disabled={!hasChanges} onClick={handleUpdate} className="w-full h-11 bg-[#ff5b21] hover:bg-[#e04f1a] text-white text-xs font-semibold rounded-xl mt-5 cursor-pointer transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
          Update
        </button>
      </div>
    </div>;
}
const formatDateToMonthYear = val => {
  if (!val) return "";
  if (val.includes("-")) {
    const parts = val.split("-");
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parts[2] ? parseInt(parts[2], 10) : 1;
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric"
        });
      }
    }
  }
  return val;
};

// 3. Quick Hold Modal (triggered by hold icon in shell header)

export function PutOnHoldModal({
  isOpen,
  onClose,
  onConfirm
}) {
  const [reason, setReason] = useState("");
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[340px] rounded-[24px] bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full text-[#ff5b21] mb-3">
            <HoldIconsvg className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Put Trainee on Hold?</h3>
          <p className="mt-1.5 text-xs text-gray-500 leading-relaxed px-1">
            This trainee will be marked as On Hold and their training progress will be paused until reactivated.
          </p>
        </div>

        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for putting on hold (e.g. need to pay this month fees)" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 mt-4 h-20 outline-none transition focus:border-[#ff5b21] resize-none" />

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition">
            Cancel
          </button>
          <button type="button" onClick={() => onConfirm(reason)} className="h-10 rounded-xl bg-[#ff5b21] hover:bg-[#e04f1a] text-xs font-semibold text-white cursor-pointer transition">
            On Hold
          </button>
        </div>
      </div>
    </div>;
}

// 4. Add Qualification Modal

export function AddQualificationModal({
  isOpen,
  onClose,
  onAdd
}) {
  const [degree, setDegree] = useState("");
  const [college, setCollege] = useState("");
  const [status, setStatus] = useState("Completed");
  const [sessionStart, setSessionStart] = useState("");
  const [sessionEnd, setSessionEnd] = useState("");
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);
  const qualificationOptions = ["BTech", "12th", "10th", "MTech", "BCA", "MCA", "Diploma"];
  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsSelectOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    if (isOpen) {
      setDegree("");
      setCollege("");
      setSessionStart("");
      setSessionEnd("");
      setStatus("Completed");
      setErrors({});
    }
  }, [isOpen]);
  if (!isOpen) return null;
  const handleSubmit = () => {
    const newErrors = {};
    if (!degree) newErrors.degree = "Please select a qualification";
    if (!college.trim()) newErrors.college = "Institute name is required";
    if (!sessionStart) newErrors.sessionStart = "Start date is required";
    if (status === "Completed" && !sessionEnd) newErrors.sessionEnd = "Completion date is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onAdd({
      degree,
      college,
      sessionStart,
      sessionEnd: status === "Ongoing" ? "Present" : sessionEnd
    });
    setDegree("");
    setCollege("");
    setSessionStart("");
    setSessionEnd("");
    setStatus("Completed");
    setErrors({});
    onClose();
  };
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[360px] rounded-[24px] bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button type="button" onClick={onClose} className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#0c101d] text-white hover:opacity-90 cursor-pointer transition z-10">
          <X className="h-4 w-4 stroke-[3.2px]" />
        </button>

        <h3 className="text-xl font-extrabold text-[#111827] text-center">Add Qualification</h3>
        <p className="mt-1 text-xs text-gray-500 text-center">
          Add the education qualification of the trainee
        </p>

        {/* Custom Dropdown Selector */}
        <div className="relative mt-5 select-none" ref={selectRef}>
          <button type="button" onClick={() => setIsSelectOpen(!isSelectOpen)} className={`w-full flex items-center justify-between border rounded-xl px-3.5 py-2.5 text-sm transition cursor-pointer bg-white ${errors.degree ? "border-red-500 ring-2 ring-red-100" : isSelectOpen ? "border-[#ff5b21] ring-2 ring-[#ff5b21]/15 text-gray-900" : "border-gray-200 text-gray-700 hover:border-gray-300"}`}>
            <span className={degree ? "text-gray-900 font-medium" : "text-gray-400"}>
              {degree || "--Select Qualification--"}
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isSelectOpen ? "rotate-180 text-[#ff5b21]" : ""}`} />
          </button>
          {errors.degree && <p className="text-[10px] text-red-500 mt-1">{errors.degree}</p>}

          {isSelectOpen && <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12)] max-h-48 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
              {qualificationOptions.map(option => {
            const isSelected = degree === option;
            return <button key={option} type="button" onClick={() => {
              setDegree(option);
              setIsSelectOpen(false);
              if (errors.degree) setErrors(prev => ({
                ...prev,
                degree: ""
              }));
            }} className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${isSelected ? "bg-[#fff7f4] text-[#ff5b21]" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"}`}>
                    <span>{option}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-[#ff5b21]" />}
                  </button>;
          })}
            </div>}
        </div>

        {/* Instituted Name Input */}
        <div>
          <input type="text" value={college} onChange={e => {
          setCollege(e.target.value);
          if (errors.college) setErrors(prev => ({
            ...prev,
            college: ""
          }));
        }} placeholder="Instituted Name" className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-gray-700 mt-3 outline-none transition focus:ring-2 ${errors.college ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-[#ff5b21] focus:ring-[#ff5b21]/15"} placeholder:text-gray-400`} />
          {errors.college && <p className="text-[10px] text-red-500 mt-1">{errors.college}</p>}
        </div>

        {/* Qualification Status Radio Buttons */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-gray-900 mb-2">
            Qualification Status
          </label>
          <div className="flex items-center gap-6">
            <label onClick={() => setStatus("Completed")} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800 select-none">
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center transition ${status === "Completed" ? "border-[#ff5b21]" : "border-gray-300"}`}>
                {status === "Completed" && <div className="h-2 w-2 rounded-full bg-[#ff5b21]" />}
              </div>
              Completed
            </label>

            <label onClick={() => {
            setStatus("Ongoing");
            if (errors.sessionEnd) setErrors(prev => ({
              ...prev,
              sessionEnd: ""
            }));
          }} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800 select-none">
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center transition ${status === "Ongoing" ? "border-[#ff5b21]" : "border-gray-300"}`}>
                {status === "Ongoing" && <div className="h-2 w-2 rounded-full bg-[#ff5b21]" />}
              </div>
              Ongoing
            </label>
          </div>
        </div>

        {/* Date Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="relative flex flex-col">
            <div className="relative flex items-center">
              <input type="text" readOnly value={sessionStart} onClick={() => setIsStartPickerOpen(!isStartPickerOpen)} placeholder="July 2022" className={`w-full border rounded-xl pl-3.5 pr-9 py-2.5 text-xs text-gray-700 outline-none transition focus:ring-2 ${errors.sessionStart ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-[#ff5b21] focus:ring-[#ff5b21]/15"} placeholder:text-gray-400 cursor-pointer bg-white select-none`} />
              <button type="button" onClick={() => setIsStartPickerOpen(!isStartPickerOpen)} className="absolute right-3 p-1 text-[#ff5b21] hover:opacity-80 transition cursor-pointer">
                <CalendarIcon className="h-4 w-4" />
              </button>
              <MonthYearPickerPopover isOpen={isStartPickerOpen} onClose={() => setIsStartPickerOpen(false)} value={sessionStart} onChange={val => {
              setSessionStart(val);
              if (errors.sessionStart) setErrors(prev => ({
                ...prev,
                sessionStart: ""
              }));
            }} />
            </div>
            {errors.sessionStart && <p className="text-[10px] text-red-500 mt-1">{errors.sessionStart}</p>}
          </div>

          <div className="relative flex flex-col">
            <div className="relative flex items-center">
              <input type="text" readOnly value={sessionEnd} onClick={() => status !== "Ongoing" && setIsEndPickerOpen(!isEndPickerOpen)} placeholder="Completion Date" disabled={status === "Ongoing"} className={`w-full border rounded-xl pl-3.5 pr-9 py-2.5 text-xs text-gray-700 outline-none transition focus:ring-2 ${errors.sessionEnd ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-[#ff5b21] focus:ring-[#ff5b21]/15"} placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400 cursor-pointer bg-white select-none`} />
              <button type="button" disabled={status === "Ongoing"} onClick={() => setIsEndPickerOpen(!isEndPickerOpen)} className="absolute right-3 p-1 text-[#ff5b21] hover:opacity-80 transition cursor-pointer disabled:opacity-40">
                <CalendarIcon className="h-4 w-4" />
              </button>
              <MonthYearPickerPopover isOpen={isEndPickerOpen} onClose={() => setIsEndPickerOpen(false)} value={sessionEnd} onChange={val => {
              setSessionEnd(val);
              if (errors.sessionEnd) setErrors(prev => ({
                ...prev,
                sessionEnd: ""
              }));
            }} alignRight />
            </div>
            {errors.sessionEnd && <p className="text-[10px] text-red-500 mt-1">{errors.sessionEnd}</p>}
          </div>
        </div>

        {/* Submit Button */}
        <button type="button" onClick={handleSubmit} className="w-full h-11 bg-[#ff5b21] hover:bg-[#e04f1a] text-white text-sm font-semibold rounded-xl mt-5 cursor-pointer transition shadow-sm">
          Add
        </button>
      </div>
    </div>;
}

// 5. Edit Qualification Modal

export function EditQualificationModal({
  isOpen,
  qualification,
  onClose,
  onSave
}) {
  const [degree, setDegree] = useState("");
  const [college, setCollege] = useState("");
  const [status, setStatus] = useState("Completed");
  const [sessionStart, setSessionStart] = useState("");
  const [sessionEnd, setSessionEnd] = useState("");
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectRef = useRef(null);
  const [isEditStartPickerOpen, setIsEditStartPickerOpen] = useState(false);
  const [isEditEndPickerOpen, setIsEditEndPickerOpen] = useState(false);

  // Fallback for duration split
  const origEnd = qualification?.sessionEnd || "";
  const origStart = qualification?.sessionStart || "";
  const finalOrigEnd = !origStart && !origEnd && qualification && qualification.duration ? qualification.duration.split(" - ")[1]?.trim() || "" : origEnd;
  const finalOrigStart = !origStart && !origEnd && qualification && qualification.duration ? qualification.duration.split(" - ")[0]?.trim() || "" : origStart;
  const hasChanges = qualification && (degree !== (qualification.degree || "") || college !== (qualification.college || "") || sessionStart !== finalOrigStart || (status === "Ongoing" ? "Present" : sessionEnd) !== finalOrigEnd);
  const qualificationOptions = ["BTech", "12th", "10th", "MTech", "BCA", "MCA", "Diploma"];
  useEffect(() => {
    if (isOpen && qualification) {
      setDegree(qualification.degree || "");
      setCollege(qualification.college || "");
      let startVal = qualification.sessionStart || "";
      let endVal = qualification.sessionEnd || "";

      // Fallback for combined duration format (used on Edit Trainee page)
      if (!startVal && !endVal && qualification.duration) {
        const parts = qualification.duration.split(" - ");
        const s = parts[0]?.trim();
        const e = parts[1]?.trim();
        if (s && s !== "-") startVal = s;
        if (e && e !== "-") endVal = e;
      }
      setSessionStart(startVal);
      setSessionEnd(endVal === "Present" ? "" : endVal);
      setStatus(endVal === "Present" ? "Ongoing" : "Completed");
    }
  }, [qualification, isOpen]);
  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsSelectOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  if (!isOpen || !qualification) return null;
  const handleSubmit = () => {
    onSave({
      degree: degree || "BTech",
      college: college || "College Name",
      sessionStart: sessionStart || "July 2022",
      sessionEnd: status === "Ongoing" ? "Present" : sessionEnd || "May 2026"
    });
    onClose();
  };
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[360px] rounded-[24px] bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button type="button" onClick={onClose} className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#0c101d] text-white hover:opacity-90 cursor-pointer transition z-10">
          <X className="h-4 w-4 stroke-[3.2px]" />
        </button>

        <h3 className="text-xl font-extrabold text-[#111827] text-center">Edit Qualification</h3>
        <p className="mt-1 text-xs text-gray-500 text-center">
          Update the education qualification details of the trainee
        </p>

        {/* Custom Dropdown Selector */}
        <div className="relative mt-5 select-none" ref={selectRef}>
          <button type="button" onClick={() => setIsSelectOpen(!isSelectOpen)} className={`w-full flex items-center justify-between border rounded-xl px-3.5 py-2.5 text-sm transition cursor-pointer bg-white ${isSelectOpen ? "border-[#ff5b21] ring-2 ring-[#ff5b21]/15 text-gray-900" : "border-gray-200 text-gray-700 hover:border-[#ff5b21]"}`}>
            <span className={degree ? "text-gray-900 font-medium" : "text-gray-400"}>
              {degree || "--Select Qualification--"}
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isSelectOpen ? "rotate-180 text-[#ff5b21]" : ""}`} />
          </button>

          {isSelectOpen && <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12)] max-h-48 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
              {qualificationOptions.map(option => {
            const isSelected = degree === option;
            return <button key={option} type="button" onClick={() => {
              setDegree(option);
              setIsSelectOpen(false);
            }} className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${isSelected ? "bg-[#fff7f4] text-[#ff5b21]" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"}`}>
                    <span>{option}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-[#ff5b21]" />}
                  </button>;
          })}
            </div>}
        </div>

        {/* Instituted Name Input */}
        <input type="text" value={college} onChange={e => setCollege(e.target.value)} placeholder="Instituted Name" className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-700 mt-3 outline-none transition focus:border-[#ff5b21] focus:ring-2 focus:ring-[#ff5b21]/15 placeholder:text-gray-400" />

        {/* Qualification Status Radio Buttons */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-gray-900 mb-2">
            Qualification Status
          </label>
          <div className="flex items-center gap-6">
            <label onClick={() => setStatus("Completed")} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800 select-none">
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center transition ${status === "Completed" ? "border-[#ff5b21]" : "border-gray-300"}`}>
                {status === "Completed" && <div className="h-2 w-2 rounded-full bg-[#ff5b21]" />}
              </div>
              Completed
            </label>

            <label onClick={() => setStatus("Ongoing")} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800 select-none">
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center transition ${status === "Ongoing" ? "border-[#ff5b21]" : "border-gray-300"}`}>
                {status === "Ongoing" && <div className="h-2 w-2 rounded-full bg-[#ff5b21]" />}
              </div>
              Ongoing
            </label>
          </div>
        </div>

        {/* Date Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="relative flex items-center">
            <input type="text" readOnly value={sessionStart} onClick={() => setIsEditStartPickerOpen(!isEditStartPickerOpen)} placeholder="July 2022" className="w-full border border-gray-200 rounded-xl pl-3.5 pr-9 py-2.5 text-xs text-gray-700 outline-none transition focus:border-[#ff5b21] focus:ring-2 focus:ring-[#ff5b21]/15 placeholder:text-gray-400 cursor-pointer bg-white select-none" />
            <button type="button" onClick={() => setIsEditStartPickerOpen(!isEditStartPickerOpen)} className="absolute right-3 p-1 text-[#ff5b21] hover:opacity-80 transition cursor-pointer">
              <CalendarIcon className="h-4 w-4" />
            </button>
            <MonthYearPickerPopover isOpen={isEditStartPickerOpen} onClose={() => setIsEditStartPickerOpen(false)} value={sessionStart} onChange={val => setSessionStart(val)} />
          </div>

          <div className="relative flex items-center">
            <input type="text" readOnly value={sessionEnd} onClick={() => status !== "Ongoing" && setIsEditEndPickerOpen(!isEditEndPickerOpen)} placeholder="Completion Date" disabled={status === "Ongoing"} className="w-full border border-gray-200 rounded-xl pl-3.5 pr-9 py-2.5 text-xs text-gray-700 outline-none transition focus:border-[#ff5b21] focus:ring-2 focus:ring-[#ff5b21]/15 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400 cursor-pointer bg-white select-none" />
            <button type="button" disabled={status === "Ongoing"} onClick={() => setIsEditEndPickerOpen(!isEditEndPickerOpen)} className="absolute right-3 p-1 text-[#ff5b21] hover:opacity-80 transition cursor-pointer disabled:opacity-40">
              <CalendarIcon className="h-4 w-4" />
            </button>
            <MonthYearPickerPopover isOpen={isEditEndPickerOpen} onClose={() => setIsEditEndPickerOpen(false)} value={sessionEnd} onChange={val => setSessionEnd(val)} alignRight />
          </div>
        </div>

        {/* Save Button */}
        <button type="button" disabled={!hasChanges} onClick={handleSubmit} className="w-full h-11 bg-[#ff5b21] hover:bg-[#e04f1a] text-white text-sm font-semibold rounded-xl mt-5 cursor-pointer transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
          Save Changes
        </button>
      </div>
    </div>;
}

// 6. Delete Qualification Modal

export function DeleteQualificationModal({
  isOpen,
  onClose,
  onConfirm
}) {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[340px] rounded-[24px] bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500 mb-4">
            <Trash2 className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Delete Qualification?</h3>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed px-1">
            Are you sure you want to delete this qualification entry? This action cannot be undone.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="h-10 rounded-xl bg-[#ff4d4d] hover:bg-red-600 text-xs font-semibold text-white cursor-pointer transition">
            Delete
          </button>
        </div>
      </div>
    </div>;
}

// 7. Edit Emergency Contact Modal

export function EditEmergencyModal({
  isOpen,
  onClose,
  emergencyData,
  onSave
}) {
  const [form, setForm] = useState(emergencyData);
  const [errors, setErrors] = useState({});
  const hasChanges = form.name !== emergencyData.name || form.relationship !== emergencyData.relationship || form.phone !== emergencyData.phone;
  useEffect(() => {
    if (isOpen) {
      setForm(emergencyData);
      setErrors({});
    }
  }, [emergencyData, isOpen]);
  if (!isOpen) return null;
  const handleChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
    setErrors(prev => {
      const next = {
        ...prev
      };
      delete next[field];
      return next;
    });
  };
  const handlePhoneChange = rawValue => {
    let digitsOnly = rawValue.replace(/\D/g, "");
    if (digitsOnly.startsWith("91") && digitsOnly.length > 10) {
      digitsOnly = digitsOnly.slice(2);
    }
    const cleanPhone = digitsOnly.slice(0, 10);
    handleChange("phone", cleanPhone);
    if (cleanPhone.startsWith("0")) {
      setErrors(prev => ({
        ...prev,
        phone: "Phone number cannot start with 0"
      }));
    } else if (cleanPhone.length === 10) {
      if (!/^[6-9]/.test(cleanPhone)) {
        setErrors(prev => ({
          ...prev,
          phone: "Phone number must start with 6, 7, 8, or 9"
        }));
      } else if (/^(\d)\1{9}$/.test(cleanPhone)) {
        setErrors(prev => ({
          ...prev,
          phone: "Please enter a valid phone number"
        }));
      }
    }
  };
  const handleSubmit = () => {
    const newErrors = {};
    if (!form.name.trim()) {
      newErrors.name = "Contact Name is required";
    } else if (form.name.trim().length > 60) {
      newErrors.name = "Contact Name cannot exceed 60 characters";
    }
    if (!form.relationship.trim()) {
      newErrors.relationship = "Relationship is required";
    } else if (form.relationship.trim().length > 30) {
      newErrors.relationship = "Relationship cannot exceed 30 characters";
    }
    if (!form.phone.trim()) {
      newErrors.phone = "Contact Number is required";
    } else if (!/^\d+$/.test(form.phone.trim())) {
      newErrors.phone = "Only numbers are allowed";
    } else if (form.phone.trim().length !== 10) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    } else if (form.phone.trim().startsWith("0")) {
      newErrors.phone = "Phone number cannot start with 0";
    } else if (!/^[6-9]/.test(form.phone.trim())) {
      newErrors.phone = "Phone number must start with 6, 7, 8, or 9";
    } else if (/^(\d)\1{9}$/.test(form.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave(form);
    onClose();
  };
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[360px] rounded-[24px] bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button type="button" onClick={onClose} className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#0c101d] text-white hover:opacity-90 cursor-pointer transition z-10">
          <X className="h-4 w-4 stroke-[3.2px]" />
        </button>

        <h3 className="text-xl font-extrabold text-[#111827] text-center">Edit Emergency Contact</h3>
        <p className="mt-1 text-xs text-gray-500 text-center">Update emergency contact information</p>

        <div className="space-y-3.5 mt-4">
          <div>
            <input type="text" placeholder="Contact Name" value={form.name} onChange={e => handleChange("name", e.target.value)} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-gray-700 outline-none transition focus:ring-2 ${errors.name ? "border-red-400 focus:border-red-500 focus:ring-red-500/15" : "border-gray-200 focus:border-[#ff5b21] focus:ring-[#ff5b21]/15"}`} />
            {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <input type="text" placeholder="Relationship" value={form.relationship} onChange={e => handleChange("relationship", e.target.value)} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-gray-700 outline-none transition focus:ring-2 ${errors.relationship ? "border-red-400 focus:border-red-500 focus:ring-red-500/15" : "border-gray-200 focus:border-[#ff5b21] focus:ring-[#ff5b21]/15"}`} />
            {errors.relationship && <p className="text-[10px] text-red-500 mt-1">{errors.relationship}</p>}
          </div>

          <div>
            <input type="text" placeholder="Contact Number" maxLength={10} value={form.phone} onChange={e => handlePhoneChange(e.target.value)} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-gray-700 outline-none transition focus:ring-2 ${errors.phone ? "border-red-400 focus:border-red-500 focus:ring-red-500/15" : "border-gray-200 focus:border-[#ff5b21] focus:ring-[#ff5b21]/15"}`} />
            {errors.phone && <p className="text-[10px] text-red-500 mt-1">{errors.phone}</p>}
          </div>

          <button type="button" disabled={!hasChanges} onClick={handleSubmit} className="w-full h-11 bg-[#ff5b21] hover:bg-[#e04f1a] text-white text-sm font-semibold rounded-xl mt-4 cursor-pointer transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            Save Changes
          </button>
        </div>
      </div>
    </div>;
}

// 8. Edit Program Details Modal

export function EditProgramModal({
  isOpen,
  onClose,
  programData,
  onSave
}) {
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true);
      try {
        const res = await getAllPrograms();
        if (res.success && res.data) {
          const list = res.data;
          setPrograms(list);

          // Try to match the initial programName to its ID
          const matched = list.find(p => p.title === programData.programName);
          if (matched) {
            setSelectedProgramId(matched.id);
          }
        }
      } catch (err) {
        console.error("Failed to load programs:", err);
      } finally {
        setLoading(false);
      }
    };
    if (isOpen) {
      fetchPrograms();
      setPaymentMode(programData.paymentMode || "Cash");
      setSelectedProgramId("");
      setErrors({});
    }
  }, [isOpen, programData]);
  if (!isOpen) return null;
  const currentProgram = programs.find(p => p.id === selectedProgramId);
  const duration = currentProgram ? currentProgram.duration : "";
  const programName = currentProgram ? currentProgram.title : "";
  const hasChanges = programName !== programData.programName || paymentMode !== programData.paymentMode;
  const handleSubmit = () => {
    const newErrors = {};
    if (!selectedProgramId) newErrors.programName = "Program selection is required";
    if (!paymentMode) newErrors.paymentMode = "Payment Mode is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    if (currentProgram) {
      onSave({
        programName: currentProgram.title,
        duration: currentProgram.duration,
        paymentMode,
        programId: selectedProgramId,
        fees: currentProgram.fees
      });
    }
    onClose();
  };
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[360px] rounded-[24px] bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button type="button" onClick={onClose} className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#0c101d] text-white hover:opacity-90 cursor-pointer transition z-10">
          <X className="h-4 w-4 stroke-[3.2px]" />
        </button>

        <h3 className="text-xl font-extrabold text-[#111827] text-center">Edit Program Details</h3>
        <p className="mt-1 text-xs text-gray-500 text-center">Update trainee program details</p>

        <div className="space-y-3.5 mt-4">
          <div>
            <select value={selectedProgramId} onChange={e => {
            setSelectedProgramId(e.target.value);
            if (errors.programName) setErrors(prev => ({
              ...prev,
              programName: ""
            }));
          }} disabled={loading} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-gray-700 outline-none bg-white transition focus:ring-2 ${errors.programName ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-[#ff5b21] focus:ring-[#ff5b21]/15"}`}>
              <option value="">-- Select Program --</option>
              {programs.filter(p => p.status === "active" || p.id === selectedProgramId).map(p => <option key={p.id} value={p.id}>
                    {p.title}
                  </option>)}
            </select>
            {errors.programName && <p className="text-[10px] text-red-500 mt-1">{errors.programName}</p>}
          </div>

          <div>
            <input type="text" placeholder="Duration" value={loading ? "Loading..." : duration || "--"} readOnly className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-xs text-gray-400 outline-none cursor-not-allowed" />
          </div>

          <div>
            <select value={paymentMode} onChange={e => {
            setPaymentMode(e.target.value);
            if (errors.paymentMode) setErrors(prev => ({
              ...prev,
              paymentMode: ""
            }));
          }} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-gray-700 outline-none bg-white transition focus:ring-2 ${errors.paymentMode ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-[#ff5b21] focus:ring-[#ff5b21]/15"}`}>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
            </select>
            {errors.paymentMode && <p className="text-[10px] text-red-500 mt-1">{errors.paymentMode}</p>}
          </div>

          <button type="button" disabled={!hasChanges} onClick={handleSubmit} className="w-full h-11 bg-[#ff5b21] hover:bg-[#e04f1a] text-white text-sm font-semibold rounded-xl mt-4 cursor-pointer transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            Save Changes
          </button>
        </div>
      </div>
    </div>;
}

// 9. Assign Program Modal

export function AssignProgramModal({
  isOpen,
  onClose,
  traineeName = "Trainee",
  onAssign
}) {
  const [programName, setProgramName] = useState("");
  const [duration, setDuration] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (isOpen) {
      setProgramName("");
      setDuration("");
      setPaymentMode("");
      setErrors({});
    }
  }, [isOpen]);
  if (!isOpen) return null;
  const handleSubmit = () => {
    const newErrors = {};
    if (!programName.trim()) newErrors.programName = "Program Name is required";
    if (!duration.trim()) newErrors.duration = "Duration is required";
    if (!paymentMode.trim()) newErrors.paymentMode = "Payment Mode is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    if (onAssign) {
      onAssign({
        programName,
        duration,
        paymentMode
      });
    }
    onClose();
  };
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[360px] rounded-[24px] bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button type="button" onClick={onClose} className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#0c101d] text-white hover:opacity-90 cursor-pointer transition z-10">
          <X className="h-4 w-4 stroke-[3.2px]" />
        </button>

        <h3 className="text-xl font-extrabold text-[#111827] text-center">Assign Program</h3>
        <p className="mt-1 text-xs text-gray-500 text-center">Assign a training program to {traineeName}</p>

        <div className="space-y-3.5 mt-4">
          <div>
            <input type="text" maxLength={50} placeholder="Program Name" value={programName} onChange={e => {
            setProgramName(e.target.value.slice(0, 50));
            if (errors.programName) setErrors(prev => ({
              ...prev,
              programName: ""
            }));
          }} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-gray-700 outline-none transition focus:ring-2 ${errors.programName ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-[#ff5b21] focus:ring-[#ff5b21]/15"}`} />
            {errors.programName && <p className="text-[10px] text-red-500 mt-1">{errors.programName}</p>}
          </div>

          <div>
            <input type="text" maxLength={20} placeholder="Duration (e.g. 6 Months)" value={duration} onChange={e => {
            setDuration(e.target.value.slice(0, 20));
            if (errors.duration) setErrors(prev => ({
              ...prev,
              duration: ""
            }));
          }} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-gray-700 outline-none transition focus:ring-2 ${errors.duration ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-[#ff5b21] focus:ring-[#ff5b21]/15"}`} />
            {errors.duration && <p className="text-[10px] text-red-500 mt-1">{errors.duration}</p>}
          </div>

          <div>
            <input type="text" maxLength={25} placeholder="Mode of Payment" value={paymentMode} onChange={e => {
            setPaymentMode(e.target.value.slice(0, 25));
            if (errors.paymentMode) setErrors(prev => ({
              ...prev,
              paymentMode: ""
            }));
          }} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-gray-700 outline-none transition focus:ring-2 ${errors.paymentMode ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-[#ff5b21] focus:ring-[#ff5b21]/15"}`} />
            {errors.paymentMode && <p className="text-[10px] text-red-500 mt-1">{errors.paymentMode}</p>}
          </div>

          <button type="button" onClick={handleSubmit} className="w-full h-11 bg-[#ff5b21] hover:bg-[#e04f1a] text-white text-sm font-semibold rounded-xl mt-4 cursor-pointer transition shadow-sm">
            Assign Program
          </button>
        </div>
      </div>
    </div>;
}