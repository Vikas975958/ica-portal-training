export default function TableScrollContainer({
  children,
  className = "",
  maxHeightClassName = "max-h-[calc(100dvh-280px)]",
  allowHorizontalScroll = true,
}) {
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
