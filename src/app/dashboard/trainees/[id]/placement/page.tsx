import { notFound } from "next/navigation";
import TraineeAccountShell from "@/components/training/TraineeAccountShell";
import PlacementDetailsContent from "@/components/training/PlacementDetailsContent";
import { fetchServerTrainee } from "@/lib/api/serverActions";

interface TraineePlacementPageProps {
  params: Promise<{ id: string }>;
}

export default async function TraineePlacementPage({ params }: TraineePlacementPageProps) {
  const { id } = await params;
  const trainee = await fetchServerTrainee(id);

  if (!trainee) {
    notFound();
  }

  return (
    <TraineeAccountShell trainee={trainee} activeTab="placement">
      <PlacementDetailsContent trainee={trainee} />
    </TraineeAccountShell>
  );
}
