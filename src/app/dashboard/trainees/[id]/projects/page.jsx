import { notFound } from "next/navigation";
import TraineeAccountShell from "@/components/training/TraineeAccountShell";
import ProjectsTasksContent from "@/components/training/ProjectsTasksContent";
import { fetchServerTrainee } from "@/api/serverActions";
export default async function TraineeProjectsPage({
  params
}) {
  const {
    id
  } = await params;
  const trainee = await fetchServerTrainee(id);
  if (!trainee) {
    notFound();
  }
  return <TraineeAccountShell trainee={trainee} activeTab="projects">
      <ProjectsTasksContent trainee={trainee} />
    </TraineeAccountShell>;
}