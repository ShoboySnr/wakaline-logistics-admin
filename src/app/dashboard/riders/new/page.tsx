"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import RiderForm from "@/src/components/organisms/RiderForm";

export default function NewRiderPage() {
  return (
    <div className="space-y-6">
      <DocumentTitle title="New Rider" />
      <Link href="/dashboard/riders" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Riders
      </Link>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Rider</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Register a dispatch rider and their documents.</p>
      </div>
      <RiderForm />
    </div>
  );
}
