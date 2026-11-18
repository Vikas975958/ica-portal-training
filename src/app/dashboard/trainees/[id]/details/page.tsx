import { notFound } from "next/navigation";
import TraineeAccountShell from "@/components/training/TraineeAccountShell";
import TraineeDetailsContent from "@/components/training/TraineeDetailsContent";
import { fetchServerTrainee } from "@/lib/api/serverActions";

interface TraineeDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function TraineeDetailsPage({ params }: TraineeDetailsPageProps) {
  const { id } = await params;
  const trainee = await fetchServerTrainee(id);

  if (!trainee) {
    notFound();
  }

  return (
    <TraineeAccountShell trainee={trainee} activeTab="details">
      <TraineeDetailsContent trainee={trainee} />
    </TraineeAccountShell>
  );
}
