"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useBike } from "@/src/api/bikes";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import BikeForm from "@/src/components/organisms/BikeForm";

export default function EditBikePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: bike, isLoading } = useBike(id);

  return (
    <div className="space-y-6">
      <DocumentTitle title={bike ? `Edit ${bike.bike_number}` : "Edit Bike"} />
      <Link href={`/dashboard/bikes/${id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Bike
      </Link>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Bike</h1>
      </div>
      {isLoading || !bike ? <LoadingSpinner fullScreen={false} /> : <BikeForm bike={bike} />}
    </div>
  );
}
