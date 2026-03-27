import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { StatusBadge } from "../../components/StatusBadge";
import { api } from "../../lib/api";
import type { AccessUser } from "../../types/api";
import { useAuth } from "../auth/AuthContext";

type AccessUserFormState = {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  profile_id: string;
  is_active: boolean;
  is_superuser: boolean;
};

function buildAccessUserForm(user?: AccessUser): AccessUserFormState {
  return {
    id: user?.id,
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    email: user?.email ?? "",
    password: "",
    profile_id: user?.profile?.id ?? "",
    is_active: user?.is_active ?? true,
    is_superuser: user?.is_superuser ?? false,
  };
}

export function AccessUsersPage() {
  const queryClient = useQueryClient();
  const { refreshSession, session } = useAuth();
  const accessControlQuery = useQuery({
    queryKey: ["settings", "access-control"],
    queryFn: api.getAccessControl,
  });
  const [selectedUserId, setSelectedUserId] = useState("");
  const [formState, setFormState] = useState<AccessUserFormState>(buildAccessUserForm());
  const [notice, setNotice] = useState("");

  const users = accessControlQuery.data?.users ?? [];
  const profiles = accessControlQuery.data?.profiles ?? [];
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];
  const platformAdminProfile = profiles.find((profile) => profile.name === "Platform Admin");

  useEffect(() => {
    if (!users.length) {
      return;
    }

    setSelectedUserId((current) => current || users[0]?.id || "");
  }, [users]);

  useEffect(() => {
    if (!selectedUser) {
      return;
    }

    setFormState(buildAccessUserForm(selectedUser));
  }, [selectedUser]);

  const saveAccessUserMutation = useMutation({
    mutationFn: api.saveAccessUser,
    onSuccess: async (response) => {
      setNotice(response.message);
      setSelectedUserId(response.item.id);
      setFormState(buildAccessUserForm(response.item));
      await queryClient.invalidateQueries({ queryKey: ["settings", "access-control"] });

      if (session?.user.id === response.item.id) {
        await refreshSession();
      }
    },
    onError: (mutationError) => {
      setNotice(mutationError instanceof Error ? mutationError.message : "Unable to save the SysAtlas user.");
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    saveAccessUserMutation.mutate({
      ...formState,
      password: formState.password || undefined,
      profile_id: formState.profile_id || undefined,
    });
  }

  return (
    <div className="space-y-6">
      <section className="atlas-note rounded-[28px] p-5 text-sm leading-7">
        These users are SysAtlas access accounts. They are separate from the Users module, which represents synced organization users from connected systems.
      </section>

      {accessControlQuery.isLoading ? (
        <section className="atlas-panel rounded-[28px] px-5 py-12 text-center text-sm text-atlas-muted">
          Loading SysAtlas access users...
        </section>
      ) : accessControlQuery.isError ? (
        <section className="atlas-error rounded-[28px] px-5 py-5 text-sm leading-6">
          {accessControlQuery.error instanceof Error ? accessControlQuery.error.message : "Unable to load SysAtlas access users."}
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <section className="atlas-panel rounded-[30px] p-4">
            <div className="flex items-center justify-between gap-3 px-2 py-2">
              <div>
                <p className="text-sm font-semibold text-atlas">Access Users</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-atlas-dim">{users.length} users</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedUserId("");
                  setFormState(buildAccessUserForm());
                  setNotice("");
                }}
                className="atlas-secondary-button rounded-2xl px-4 py-2 text-sm font-semibold"
              >
                New User
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {users.map((user) => {
                const isSelected = user.id === (selectedUserId || selectedUser?.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setNotice("");
                    }}
                    className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                      isSelected
                        ? "border-[rgba(201,74,99,0.26)] bg-[rgba(201,74,99,0.08)]"
                        : "border-[rgba(23,32,42,0.08)] bg-[rgba(255,255,255,0.72)] hover:border-[rgba(23,32,42,0.14)]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-atlas">{user.display_name ?? user.email}</p>
                        <p className="mt-1 text-sm text-atlas-muted">{user.email}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-atlas-dim">{user.profile?.name ?? "No profile"}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {user.is_superuser ? <StatusBadge label="Super Admin" tone="info" /> : null}
                        <StatusBadge label={user.is_active ? "Active" : "Disabled"} tone={user.is_active ? "positive" : "danger"} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="atlas-panel rounded-[30px] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-atlas-accent-soft text-[0.74rem] font-semibold uppercase tracking-[0.18em]">Access Accounts</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-atlas">
                  {formState.id ? "Edit User" : "Create User"}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-atlas-muted">
                  Assign a profile so every sign-in account inherits a clear and predictable access footprint.
                </p>
              </div>
            </div>

            {notice ? <div className="atlas-pill-accent mt-5 rounded-[24px] px-4 py-3 text-sm">{notice}</div> : null}

            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-atlas-soft">First Name</span>
                  <input
                    className="atlas-field w-full rounded-2xl px-4 py-3"
                    value={formState.first_name}
                    onChange={(event) => setFormState((current) => ({ ...current, first_name: event.target.value }))}
                    placeholder="Avery"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-atlas-soft">Last Name</span>
                  <input
                    className="atlas-field w-full rounded-2xl px-4 py-3"
                    value={formState.last_name}
                    onChange={(event) => setFormState((current) => ({ ...current, last_name: event.target.value }))}
                    placeholder="Morgan"
                    required
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-atlas-soft">Email</span>
                  <input
                    className="atlas-field w-full rounded-2xl px-4 py-3"
                    type="email"
                    value={formState.email}
                    onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
                    placeholder="operator@company.com"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-atlas-soft">Access Profile</span>
                  <select
                    className="atlas-field w-full rounded-2xl px-4 py-3"
                    value={formState.profile_id}
                    onChange={(event) => setFormState((current) => ({ ...current, profile_id: event.target.value }))}
                    required
                  >
                    <option value="">Select a profile</option>
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-atlas-soft">Password</span>
                  <input
                    className="atlas-field w-full rounded-2xl px-4 py-3"
                    type="password"
                    value={formState.password}
                    onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
                    placeholder={formState.id ? "Leave blank to keep the current password" : "At least 12 characters"}
                    minLength={formState.id ? undefined : 12}
                    required={!formState.id}
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="atlas-panel-soft flex items-center justify-between rounded-[24px] px-4 py-4">
                  <span>
                    <span className="block text-sm font-semibold text-atlas">User Active</span>
                    <span className="mt-1 block text-sm leading-6 text-atlas-muted">Disable access without deleting the user.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={formState.is_active}
                    onChange={(event) => setFormState((current) => ({ ...current, is_active: event.target.checked }))}
                    className="h-4 w-4 rounded border-[rgba(23,32,42,0.18)] text-[var(--atlas-accent)] focus:ring-[var(--atlas-accent)]"
                  />
                </label>

                <label className="atlas-panel-soft flex items-center justify-between rounded-[24px] px-4 py-4">
                  <span>
                    <span className="block text-sm font-semibold text-atlas">Super Admin</span>
                    <span className="mt-1 block text-sm leading-6 text-atlas-muted">Gains full SysAtlas access across all routes.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={formState.is_superuser}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        is_superuser: event.target.checked,
                        profile_id: event.target.checked && !current.profile_id ? (platformAdminProfile?.id ?? current.profile_id) : current.profile_id,
                      }))
                    }
                    className="h-4 w-4 rounded border-[rgba(23,32,42,0.18)] text-[var(--atlas-accent)] focus:ring-[var(--atlas-accent)]"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={saveAccessUserMutation.isPending}
                className="atlas-primary-button rounded-2xl px-5 py-3 text-sm font-semibold"
              >
                {saveAccessUserMutation.isPending ? "Saving User..." : formState.id ? "Update User" : "Create User"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
