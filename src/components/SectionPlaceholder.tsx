interface SectionPlaceholderProps {
  title: string;
  description: string;
}

export default function SectionPlaceholder({ title, description }: SectionPlaceholderProps) {
  return (
    <div className="mx-auto w-full max-w-4xl rounded-2xl border border-[#dddddd] bg-white p-8 text-center">
      <h1 className="text-3xl font-bold text-[#1f1f1f]">{title}</h1>
      <p className="mt-3 text-sm text-[#717171]">{description}</p>
    </div>
  );
}
