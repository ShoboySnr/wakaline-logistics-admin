"use client";

import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { updateAdminPassword, updateProfile } from "@/src/api/auth";
import { ApiError, errorMessage } from "@/src/helpers/request";
import { useStore } from "@/src/store";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import Panel from "@/src/components/organisms/client/Panel";

interface ProfileValues { name: string; email: string; phone: string }
interface PasswordValues { current_password: string; password: string; password_confirmation: string }

function ProfileForm() {
  const notify = useNotify();
  const { user, setUser } = useStore();
  const { register, handleSubmit, setError, formState: { errors } } = useForm<ProfileValues>({
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" },
  });

  const mutation = useMutation({
    mutationFn: (body: ProfileValues) => updateProfile(body),
    onSuccess: (res) => {
      if (res.data) setUser(res.data);
      notify.success("Profile updated successfully");
    },
    onError: (e) => {
      if (e instanceof ApiError && e.errors) Object.entries(e.errors).forEach(([f, m]) => setError(f as keyof ProfileValues, { message: m[0] }));
      notify.error(errorMessage(e));
    },
  });

  return (
    <Panel title="Profile Information">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Name</label>
          <input className="input" {...register("name", { required: "Name is required" })} />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" {...register("email", { required: "Email is required" })} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" {...register("phone")} />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save changes"}</button>
        </div>
      </form>
    </Panel>
  );
}

function PasswordForm() {
  const notify = useNotify();
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<PasswordValues>();

  const mutation = useMutation({
    mutationFn: (body: PasswordValues) => updateAdminPassword(body),
    onSuccess: (res) => { notify.success(res.message); reset(); },
    onError: (e) => {
      if (e instanceof ApiError && e.errors) Object.entries(e.errors).forEach(([f, m]) => setError(f as keyof PasswordValues, { message: m[0] }));
      notify.error(errorMessage(e));
    },
  });

  return (
    <Panel title="Change Password">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Current Password</label>
          <input type="password" className="input" {...register("current_password", { required: "Current password is required" })} />
          {errors.current_password && <p className="mt-1 text-xs text-red-600">{errors.current_password.message}</p>}
        </div>
        <div>
          <label className="label">New Password</label>
          <input type="password" className="input" {...register("password", { required: "New password is required", minLength: { value: 8, message: "At least 8 characters" } })} />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>
        <div>
          <label className="label">Confirm New Password</label>
          <input type="password" className="input" {...register("password_confirmation", { required: "Please confirm" })} />
          {errors.password_confirmation && <p className="mt-1 text-xs text-red-600">{errors.password_confirmation.message}</p>}
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Change password"}</button>
        </div>
      </form>
    </Panel>
  );
}

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <DocumentTitle title="Profile" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Your account details and password.</p>
      </div>
      <ProfileForm />
      <PasswordForm />
    </div>
  );
}
