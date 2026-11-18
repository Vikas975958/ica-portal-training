import { redirect } from "next/navigation";

interface TraineeIndexPageProps {
  params: Promise<{ id: string }>;
}

export default async function TraineeIndexPage({ params }: TraineeIndexPageProps) {
  const { id } = await params;
  redirect(`/dashboard/trainees/${id}/details`);
}
