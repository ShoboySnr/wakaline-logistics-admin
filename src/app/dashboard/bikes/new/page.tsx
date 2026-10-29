"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import BikeForm from "@/src/components/organisms/BikeForm";

export default function NewBikePage() {
  return (
    <div className="space-y-6">
      <DocumentTitle title="New Bike" />
      <Link href="/dashboard/bikes" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Bikes
      </Link>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Bike</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Register a bike, its documents and assignment.</p>
      </div>
      <BikeForm />
    </div>
  );
}
