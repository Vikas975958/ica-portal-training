import { notFound } from "next/navigation";
import TraineeAccountShell from "@/components/training/TraineeAccountShell";
import FeesPaymentsContent from "@/components/training/FeesPaymentsContent";
import { fetchServerTrainee } from "@/api/serverActions";
export default async function TraineeFeesPage({
  params
}) {
  const {
    id
  } = await params;
  const trainee = await fetchServerTrainee(id);
  if (!trainee) {
    notFound();
  }
  return <TraineeAccountShell trainee={trainee} activeTab="fees">
      <FeesPaymentsContent trainee={trainee} />
    </TraineeAccountShell>;
}