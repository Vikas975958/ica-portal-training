export default function SectionPlaceholder({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] rounded-2xl border border-dashed border-gray-200 bg-[#fafafa] p-8 text-center">
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-gray-500 max-w-sm">{description}</p>
      )}
    </div>
  );
}
