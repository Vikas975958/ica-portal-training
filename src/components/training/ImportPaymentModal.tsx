"use client";
import React, { useState, useRef } from "react";
import { X, Upload, CheckCircle2, Download, FileSpreadsheet } from "lucide-react";
import { downloadTransactionsTemplate } from "@/lib/api/get";
import { toast } from "react-toastify";

interface ImportPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<boolean>;
}

export function ImportPaymentModal({
  isOpen,
  onClose,
  onImport,
}: ImportPaymentModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedFile(null);
    setFileName("");
    setError("");
    setSuccessMsg("");
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file extension
    const validExtensions = [".csv", ".xlsx", ".xls"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setError("Please select a valid CSV or Excel file (.csv, .xlsx, .xls).");
      setSelectedFile(null);
      setFileName("");
      return;
    }

    setFileName(file.name);
    setSelectedFile(file);
    setError("");
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadTransactionsTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "transactions_import_template.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Import template downloaded!");
    } catch (err: any) {
      toast.error("Failed to download template.");
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) {
      setError("Please select a file to import.");
      return;
    }

    setIsImporting(true);
    setError("");
    const success = await onImport(selectedFile);
    setIsImporting(false);

    if (success) {
      setSuccessMsg("Payments imported successfully!");
      setTimeout(() => {
        handleClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px] animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-[500px] rounded-[24px] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#0c101d] text-white hover:opacity-90 cursor-pointer transition z-10"
          aria-label="Close import modal"
        >
          <X className="h-4 w-4 stroke-[3.2px]" />
        </button>

        {/* Modal Header */}
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff5b21]/10 text-[#ff5b21]">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <h3 className="text-2xl font-extrabold text-[#1f1f1f]">Import Payments</h3>
          <p className="mt-1 text-xs text-[#8c8c8c]">
            Upload CSV or XLSX file to bulk add transactions
          </p>
        </div>

        {/* Main Content */}
        <div className="mt-5 space-y-4">
          {successMsg ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
              <CheckCircle2 className="h-12 w-12 text-green-500 animate-bounce" />
              <p className="text-sm font-bold text-gray-800">{successMsg}</p>
            </div>
          ) : (
            <>
              {/* File Upload Drop Zone */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e2e8f0] bg-[#fafafa] p-5 text-center transition hover:border-[#ff5b21] hover:bg-[#fff9f6] cursor-pointer"
              >
                <Upload className="h-8 w-8 text-[#ff5b21] mb-2" />
                <p className="text-sm font-bold text-[#1f1f1f] max-w-[320px] truncate">
                  {fileName ? fileName : "Click to select or drop CSV or XLSX file"}
                </p>
                <p className="mt-1 text-[11px] text-[#8c8c8c]">
                  Supported formats: .csv, .xlsx, .xls
                </p>
              </div>

              {error && (
                <p className="text-xs font-semibold text-red-500 text-center">{error}</p>
              )}

              {/* Import template */}
              <div className="flex items-center pt-1 justify-between">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ff5b21] hover:underline cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download CSV / XLSX Template
                </button>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs font-semibold text-red-500 hover:underline cursor-pointer"
                  >
                    Clear Selected File
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedFile || isImporting}
                  onClick={handleConfirmImport}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition cursor-pointer ${
                    selectedFile && !isImporting
                      ? "bg-[#ff5b21] hover:bg-[#e04f1a]"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  {isImporting ? "Importing Payments..." : "Import"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

