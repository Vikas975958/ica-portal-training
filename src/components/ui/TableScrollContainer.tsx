import type { ReactNode } from "react";

interface TableScrollContainerProps {
  children: ReactNode;
  className?: string;
  maxHeightClassName?: string;
  allowHorizontalScroll?: boolean;
}

export default function TableScrollContainer({
  children,
  className = "",
  maxHeightClassName = "max-h-[calc(100dvh-280px)]",
  allowHorizontalScroll = true,
}: TableScrollContainerProps) {
  const overflowClass = allowHorizontalScroll
    ? "overflow-auto"
    : "overflow-y-auto overflow-x-hidden";

  return (
    <div
      className={`relative w-full ${overflowClass} no-scrollbar ${maxHeightClassName} ${className}`}
    >
      {children}
    </div>
  );
}
