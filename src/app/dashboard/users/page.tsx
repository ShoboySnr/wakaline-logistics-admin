"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { KeyRound, Pencil, Plus, Search, Shield, ShieldCheck, Trash2, UserCog, Users } from "lucide-react";
import { UserFilters, useDeleteUser, useSaveUser, useToggleAdmin, useUpdateUserPassword, useUsers } from "@/src/api/users";
import { formatDate } from "@/src/helpers/format";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import Modal from "@/src/components/atoms/Modal";
import Pagination from "@/src/components/molecules/Pagination";
import StatCard from "@/src/components/molecules/StatCard";
import { AdminUserRow } from "@/src/types";

interface UserFormValues { name: string; email: string; phone: string; password: string; password_confirmation: string; is_admin: boolean }

function UserModal({ user, onClose }: { user: AdminUserRow | "new" | null; onClose: () => void }) {
  const notify = useNotify();
  const editing = user && user !== "new" ? user : undefined;
  const saveUser = useSaveUser(editing?.id);
  const { register, handleSubmit, formState: { errors } } = useForm<UserFormValues>({
    defaultValues: {
      name: editing?.name ?? "",
      email: editing?.email ?? "",
      phone: editing?.phone ?? "",
      is_admin: editing?.is_admin ?? false,
    },
  });

  const onSubmit = async (values: UserFormValues) => {
    try {
      const body: Record<string, unknown> = { name: values.name, email: values.email, phone: values.phone, is_admin: values.is_admin };
      if (!editing) {
        body.password = values.password;
        body.password_confirmation = values.password_confirmation;
      }
      await saveUser.mutateAsync(body);
      notify.success(editing ? "User updated" : "User created");
      onClose();
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  return (
    <Modal
      open={user !== null}
      onClose={onClose}
      title={editing ? "Edit User" : "New User"}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" form="user-form" className="btn-primary" disabled={saveUser.isPending}>
            {saveUser.isPending ? "Saving..." : editing ? "Update" : "Create"}
          </button>
        </div>
      }
    >
      <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Name <span className="text-red-500">*</span></label>
          <input className="input" {...register("name", { required: true })} />
          {errors.name && <p className="mt-1 text-xs text-red-600">Name is required</p>}
        </div>
        <div>
          <label className="label">Email <span className="text-red-500">*</span></label>
          <input type="email" className="input" {...register("email", { required: true })} />
          {errors.email && <p className="mt-1 text-xs text-red-600">Email is required</p>}
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" {...register("phone")} />
        </div>
        {!editing && (
          <>
            <div>
              <label className="label">Password <span className="text-red-500">*</span></label>
              <input type="password" className="input" {...register("password", { required: !editing, minLength: 6 })} />
              {errors.password && <p className="mt-1 text-xs text-red-600">At least 6 characters</p>}
            </div>
            <div>
              <label className="label">Confirm Password <span className="text-red-500">*</span></label>
              <input type="password" className="input" {...register("password_confirmation", { required: !editing })} />
            </div>
          </>
        )}
        <label className="sm:col-span-2 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" className="accent-primary" {...register("is_admin")} />
          Super-admin access
        </label>
      </form>
    </Modal>
  );
}

function PasswordModal({ user, onClose }: { user: AdminUserRow | null; onClose: () => void }) {
  const notify = useNotify();
  const updatePassword = useUpdateUserPassword(user?.id ?? 0);
  const { register, handleSubmit, formState: { errors } } = useForm<{ password: string; password_confirmation: string }>();

  const onSubmit = async (values: { password: string; password_confirmation: string }) => {
    try {
      const res = await updatePassword.mutateAsync(values);
      notify.success(res.message);
      onClose();
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  return (
    <Modal
      open={user !== null}
      onClose={onClose}
      title={`Reset password · ${user?.name ?? ""}`}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" form="password-form" className="btn-primary" disabled={updatePassword.isPending}>
            {updatePassword.isPending ? "Saving..." : "Update password"}
          </button>
        </div>
      }
    >
      <form id="password-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <div>
          <label className="label">New Password</label>
          <input type="password" className="input" {...register("password", { required: true, minLength: 6 })} />
          {errors.password && <p className="mt-1 text-xs text-red-600">At least 6 characters</p>}
        </div>
        <div>
          <label className="label">Confirm Password</label>
          <input type="password" className="input" {...register("password_confirmation", { required: true })} />
        </div>
      </form>
    </Modal>
  );
}

function UsersContent() {
  const notify = useNotify();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [editUser, setEditUser] = useState<AdminUserRow | "new" | null>(null);
  const [passwordUser, setPasswordUser] = useState<AdminUserRow | null>(null);

  const filters: UserFilters = { page, search: search || undefined, role: role || undefined };
  const { data, isLoading, isFetching } = useUsers(filters);
  const toggleAdmin = useToggleAdmin();
  const deleteUser = useDeleteUser();

  const handleToggle = async (u: AdminUserRow) => {
    try {
      const res = await toggleAdmin.mutateAsync(u.id);
      notify.success(res.message ?? "Updated");
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const handleDelete = async (u: AdminUserRow) => {
    if (!confirm(`Delete ${u.name}?`)) return;
    try {
      const res = await deleteUser.mutateAsync(u.id);
      notify.success(res.message);
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <DocumentTitle title="Users" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Admin console accounts and their access.</p>
        </div>
        <button onClick={() => setEditUser("new")} className="btn-primary">
          <Plus className="w-4 h-4" /> New User
        </button>
      </div>

      {data && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Users" value={data.stats.total} icon={Users} gradient="from-blue-500 to-blue-600" />
          <StatCard label="Super-admins" value={data.stats.admins} icon={ShieldCheck} gradient="from-rose-400 to-primary" />
          <StatCard label="Staff" value={data.stats.staff} icon={UserCog} gradient="from-gray-500 to-gray-600" />
        </div>
      )}

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search name, email, phone..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            <option value="">All roles</option>
            <option value="admin">Super-admins</option>
            <option value="staff">Staff</option>
          </select>
        </div>

        {isLoading ? (
          <LoadingSpinner fullScreen={false} />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${isFetching ? "opacity-60" : ""}`}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  {["Name", "Contact", "Role", "Joined", ""].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data?.data.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{u.name}</span>
                      {u.is_self && <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-primary/10 text-primary">You</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 dark:text-gray-100">{u.email}</p>
                      {u.phone && <p className="text-xs text-gray-500">{u.phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${u.is_admin ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>
                        {u.is_admin ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                        {u.is_admin ? "Super-admin" : "Staff"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => handleToggle(u)} disabled={u.is_self && u.is_admin} className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed" title="Toggle admin">
                          <UserCog className="w-4 h-4" />
                        </button>
                        <button onClick={() => setPasswordUser(u)} className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700" title="Reset password">
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditUser(u)} className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(u)} disabled={u.is_self} className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && <Pagination meta={data.meta} onChange={setPage} />}
      </div>

      <UserModal user={editUser} onClose={() => setEditUser(null)} />
      <PasswordModal user={passwordUser} onClose={() => setPasswordUser(null)} />
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <UsersContent />
    </Suspense>
  );
}
