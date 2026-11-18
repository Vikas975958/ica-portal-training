import { notFound } from "next/navigation";
import TraineeAccountShell from "@/components/training/TraineeAccountShell";
import FeesPaymentsContent from "@/components/training/FeesPaymentsContent";
import { fetchServerTrainee } from "@/lib/api/serverActions";

interface TraineeFeesPageProps {
  params: Promise<{ id: string }>;
}

export default async function TraineeFeesPage({ params }: TraineeFeesPageProps) {
  const { id } = await params;
  const trainee = await fetchServerTrainee(id);

  if (!trainee) {
    notFound();
  }

  return (
    <TraineeAccountShell trainee={trainee} activeTab="fees">
      <FeesPaymentsContent trainee={trainee} />
    </TraineeAccountShell>
  );
}
