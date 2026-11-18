"use client";

import React from "react";

const sizeMap = {
  xs: { box: "h-3.5 w-3.5", stroke: 3.5, dot: "h-1.5 w-1.5" },
  sm: { box: "h-5 w-5", stroke: 4, dot: "h-2 w-2" },
  md: { box: "h-8 w-8", stroke: 4.5, dot: "h-2.5 w-2.5" },
  lg: { box: "h-12 w-12", stroke: 5, dot: "h-3.5 w-3.5" },
  xl: { box: "h-16 w-16", stroke: 5.5, dot: "h-4.5 w-4.5" },
};

/**
 * Modern SVG Spinner / Loader using primary color #FE5200
 */
export function Loader({
  size = "md",
  color = "#FE5200",
  className = "",
  variant = "spinner",
  label,
}) {
  const currentSize = sizeMap[size] || sizeMap.md;

  if (variant === "dots") {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <span
          className={`${currentSize.dot} rounded-full animate-bounce`}
          style={{ backgroundColor: color, animationDelay: "0ms" }}
        />
        <span
          className={`${currentSize.dot} rounded-full animate-bounce`}
          style={{ backgroundColor: color, animationDelay: "150ms" }}
        />
        <span
          className={`${currentSize.dot} rounded-full animate-bounce`}
          style={{ backgroundColor: color, animationDelay: "300ms" }}
        />
        {label && (
          <span className="ml-2 text-xs font-semibold text-gray-600">
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center justify-center gap-2 ${className}`}>
      <svg
        className={`animate-spin ${currentSize.box}`}
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          stroke={color}
          strokeOpacity="0.2"
          strokeWidth={currentSize.stroke}
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          stroke={color}
          strokeWidth={currentSize.stroke}
          strokeLinecap="round"
          strokeDasharray="90 150"
        />
      </svg>
      {label && (
        <span className="text-xs font-semibold text-gray-600 select-none animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * Single Skeleton line / box
 */
export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-gray-200/80 rounded-lg ${className}`}
    />
  );
}

/**
 * Table Row Skeleton Loader
 */
export function TableSkeleton({
  rows = 5,
  cols = 7,
}) {
  return (
    <>
      {[...Array(rows)].map((_, rIdx) => (
        <tr
          key={`skeleton-row-${rIdx}`}
          className="border-b border-gray-100 animate-pulse"
        >
          <td className="px-5 py-4 text-center">
            <Skeleton className="h-4 w-4 mx-auto" />
          </td>
          <td className="px-5 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-2.5 w-24" />
              </div>
            </div>
          </td>
          {[...Array(cols - 2)].map((_, cIdx) => (
            <td key={`skeleton-col-${cIdx}`} className="px-5 py-4">
              <Skeleton className="h-3.5 w-20" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * Full Page or Container Overlay Loader
 */
export function PageLoader({
  label = "Loading...",
  fullScreen = true,
}) {
  return (
    <div
      className={`${
        fullScreen ? "fixed inset-0 z-50" : "absolute inset-0 z-30"
      } flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs transition-all duration-200 select-none`}
    >
      <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white border border-gray-100 shadow-xl gap-3.5 animate-in fade-in zoom-in-95 duration-200">
        <Loader size="lg" color="#FE5200" />
        <span className="text-xs font-bold text-gray-800 tracking-wide">
          {label}
        </span>
      </div>
    </div>
  );
}

/**
 * Table Grid Spinner Placeholder
 */
export function TableLoader({ label = "Loading data..." }) {
  return (
    <div className="w-full py-16 flex flex-col items-center justify-center gap-3 bg-white select-none">
      <Loader size="lg" color="#FE5200" />
      <p className="text-xs font-semibold text-gray-500">{label}</p>
    </div>
  );
}

/**
 * Inline Button Spinner
 */
export function ButtonLoader({
  text,
  size = "sm",
  color = "#ffffff",
}) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <Loader size={size} color={color} />
      {text && <span>{text}</span>}
    </span>
  );
}

export default Loader;
