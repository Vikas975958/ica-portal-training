"use client";

import { useRouter } from "next/navigation";
import AddTraineeView from "@/components/AddTraineeView";
export default function AddTraineePage() {
  const router = useRouter();
  return <AddTraineeView onBackToStudents={() => router.push("/dashboard/trainees")} />;
}