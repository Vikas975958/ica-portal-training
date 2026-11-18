import { redirect } from "next/navigation";
export default async function TraineeIndexPage({
  params
}) {
  const {
    id
  } = await params;
  redirect(`/dashboard/trainees/${id}/details`);
}