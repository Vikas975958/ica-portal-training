import { notFound } from "next/navigation";
import TraineeAccountShell from "@/components/training/TraineeAccountShell";
import PlacementDetailsContent from "@/components/training/PlacementDetailsContent";
import { fetchServerTrainee } from "@/api/serverActions";
export default async function TraineePlacementPage({
  params
}) {
  const {
    id
  } = await params;
  const trainee = await fetchServerTrainee(id);
  if (!trainee) {
    notFound();
  }
  return <TraineeAccountShell trainee={trainee} activeTab="placement">
      <PlacementDetailsContent trainee={trainee} />
    </TraineeAccountShell>;
}