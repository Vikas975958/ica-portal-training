import { notFound } from "next/navigation";
import TraineeAccountShell from "@/components/training/TraineeAccountShell";
import NotesContent from "@/components/training/NotesContent";
import { fetchServerTrainee } from "@/api/serverActions";
export default async function TraineeNotesPage({
  params
}) {
  const {
    id
  } = await params;
  const trainee = await fetchServerTrainee(id);
  if (!trainee) {
    notFound();
  }
  return <TraineeAccountShell trainee={trainee} activeTab="notes">
      <NotesContent trainee={trainee} />
    </TraineeAccountShell>;
}