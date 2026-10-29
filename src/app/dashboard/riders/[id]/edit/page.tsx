"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRider } from "@/src/api/riders";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import RiderForm from "@/src/components/organisms/RiderForm";

export default function EditRiderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: rider, isLoading } = useRider(id);

  return (
    <div className="space-y-6">
      <DocumentTitle title={rider ? `Edit ${rider.name}` : "Edit Rider"} />
      <Link href={`/dashboard/riders/${id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Rider
      </Link>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Rider</h1>
      </div>
      {isLoading || !rider ? <LoadingSpinner fullScreen={false} /> : <RiderForm rider={rider} />}
    </div>
  );
}
