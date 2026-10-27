"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useClient } from "@/src/api/clients";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import ClientForm from "@/src/components/organisms/ClientForm";

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: client, isLoading } = useClient(id);

  if (isLoading) return <LoadingSpinner />;
  if (!client) {
    return (
      <div className="card p-8 text-center text-gray-600 dark:text-gray-300">
        Client not found. <Link href="/dashboard/clients" className="text-primary hover:underline">Back to clients</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DocumentTitle title={`Edit ${client.name}`} />
      <Link href={`/dashboard/clients/${client.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Client
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit {client.name}</h1>
      <ClientForm client={client} />
    </div>
  );
}
