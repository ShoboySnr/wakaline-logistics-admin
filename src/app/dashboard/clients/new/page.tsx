"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import ClientForm from "@/src/components/organisms/ClientForm";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <DocumentTitle title="New Client" />
      <Link href="/dashboard/clients" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </Link>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Client</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Create a client profile for order management and billing.</p>
      </div>
      <ClientForm />
    </div>
  );
}
