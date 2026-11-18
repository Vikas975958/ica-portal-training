import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BreadcrumbProps {
  backText: string;
  currentText?: string;
  onBack?: () => void;
  backHref?: string;
  separator?: string;
  withBottomMargin?: boolean;
}

export default function Breadcrumb({
  backText,
  currentText,
  onBack,
  backHref,
  separator = "|",
  withBottomMargin = true,
}: BreadcrumbProps) {
  const content = (
    <>
      <svg width="7" height="11" viewBox="0 0 7 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#ff5b21] shrink-0 mr-1.5 stroke-[2.2] [stroke-linecap:round] [stroke-linejoin:round]">
        <path d="M5.5 9.5L1.5 5.5L5.5 1.5" stroke="currentColor"/>
      </svg>
      <span className="text-[#2c2c2c]">{backText}</span>
    </>
  );

  const buttonClass =
    "flex items-center gap-1 text-gray-850 hover:text-gray-900 transition cursor-pointer outline-none focus:outline-none select-none";

  return (
    <div
      className={`flex items-center gap-2 text-xs font-semibold select-none ${
        withBottomMargin ? "mb-5" : ""
      }`}
    >
      {backHref ? (
        <Link href={backHref} className={buttonClass}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onBack} className={buttonClass}>
          {content}
        </button>
      )}
      {currentText && (
        <>
          <span className="text-gray-300">{separator}</span>
          <span className="text-[#ff5b21]">{currentText}</span>
        </>
      )}
    </div>
  );
}

