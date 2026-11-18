import { notFound } from "next/navigation";
import TraineeAccountShell from "@/components/training/TraineeAccountShell";
import ProjectsTasksContent from "@/components/training/ProjectsTasksContent";
import { fetchServerTrainee } from "@/lib/api/serverActions";

interface TraineeProjectsPageProps {
  params: Promise<{ id: string }>;
}

export default async function TraineeProjectsPage({ params }: TraineeProjectsPageProps) {
  const { id } = await params;
  const trainee = await fetchServerTrainee(id);

  if (!trainee) {
    notFound();
  }

  return (
    <TraineeAccountShell trainee={trainee} activeTab="projects">
      <ProjectsTasksContent trainee={trainee} />
    </TraineeAccountShell>
  );
}
