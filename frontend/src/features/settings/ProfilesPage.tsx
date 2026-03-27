import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { StatusBadge } from "../../components/StatusBadge";
import { api } from "../../lib/api";
import type { AccessProfile, PermissionDefinition } from "../../types/api";
import { useAuth } from "../auth/AuthContext";

type ProfileFormState = {
  id?: string;
  name: string;
  description: string;
  permissions: string[];
};

function buildProfileForm(profile?: AccessProfile): ProfileFormState {
  return {
    id: profile?.id,
    name: profile?.name ?? "",
    description: profile?.description ?? "",
    permissions: profile?.permissions ?? [],
  };
}

export function ProfilesPage() {
  const queryClient = useQueryClient();
  const { refreshSession, session } = useAuth();
  const accessControlQuery = useQuery({
    queryKey: ["settings", "access-control"],
    queryFn: api.getAccessControl,
  });
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [formState, setFormState] = useState<ProfileFormState>(buildProfileForm());
  const [notice, setNotice] = useState("");

  const profiles = accessControlQuery.data?.profiles ?? [];
  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0];

  useEffect(() => {
    if (!profiles.length) {
      return;
    }

    setSelectedProfileId((current) => current || profiles[0]?.id || "");
  }, [profiles]);

  useEffect(() => {
    if (!selectedProfile) {
      return;
    }

    setFormState(buildProfileForm(selectedProfile));
  }, [selectedProfile]);

  const saveProfileMutation = useMutation({
    mutationFn: api.saveAccessProfile,
    onSuccess: async (response) => {
      setNotice(response.message);
      setSelectedProfileId(response.item.id);
      setFormState(buildProfileForm(response.item));
      await queryClient.invalidateQueries({ queryKey: ["settings", "access-control"] });

      if (session?.user.profile?.id === response.item.id) {
        await refreshSession();
      }
    },
    onError: (mutationError) => {
      setNotice(mutationError instanceof Error ? mutationError.message : "Unable to save the access profile.");
    },
  });

  const permissionGroups: Record<string, PermissionDefinition[]> = {};
  for (const permission of accessControlQuery.data?.permissions ?? []) {
    permissionGroups[permission.group] = [...(permissionGroups[permission.group] ?? []), permission];
  }

  function togglePermission(permissionKey: string) {
    setFormState((current) => ({
      ...current,
      permissions: current.permissions.includes(permissionKey)
        ? current.permissions.filter((item) => item !== permissionKey)
        : [...current.permissions, permissionKey],
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    saveProfileMutation.mutate(formState);
  }

  return (
    <div className="space-y-6">
      <section className="atlas-note rounded-[28px] p-5 text-sm leading-7">
        Profiles are the clean way to assign access. Build a profile once, then assign it to the people who can sign in under Settings / Users.
      </section>

      {accessControlQuery.isLoading ? (
        <section className="atlas-panel rounded-[28px] px-5 py-12 text-center text-sm text-atlas-muted">
          Loading access profiles...
        </section>
      ) : accessControlQuery.isError ? (
        <section className="atlas-error rounded-[28px] px-5 py-5 text-sm leading-6">
          {accessControlQuery.error instanceof Error ? accessControlQuery.error.message : "Unable to load the access profiles."}
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <section className="atlas-panel rounded-[30px] p-4">
            <div className="flex items-center justify-between gap-3 px-2 py-2">
              <div>
                <p className="text-sm font-semibold text-atlas">Access Profiles</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-atlas-dim">{profiles.length} profiles</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedProfileId("");
                  setFormState(buildProfileForm());
                  setNotice("");
                }}
                className="atlas-secondary-button rounded-2xl px-4 py-2 text-sm font-semibold"
              >
                New Profile
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {profiles.map((profile) => {
                const isSelected = profile.id === (selectedProfileId || selectedProfile?.id);
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => {
                      setSelectedProfileId(profile.id);
                      setNotice("");
                    }}
                    className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                      isSelected
                        ? "border-[rgba(201,74,99,0.26)] bg-[rgba(201,74,99,0.08)]"
                        : "border-[rgba(23,32,42,0.08)] bg-[rgba(255,255,255,0.72)] hover:border-[rgba(23,32,42,0.14)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-atlas">{profile.name}</p>
                        <p className="mt-2 text-sm leading-6 text-atlas-muted">{profile.description ?? "No description set."}</p>
                      </div>
                      {profile.is_system_profile ? <StatusBadge label="System" tone="info" /> : null}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <StatusBadge label={`${profile.permissions.length} permissions`} tone="neutral" />
                      <StatusBadge label={`${profile.assigned_user_count} users`} tone="neutral" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="atlas-panel rounded-[30px] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-atlas-accent-soft text-[0.74rem] font-semibold uppercase tracking-[0.18em]">Access Design</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-atlas">
                  {formState.id ? "Edit Profile" : "Create Profile"}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-atlas-muted">
                  Keep profiles small and clear so admins can assign them without guessing what each person will see.
                </p>
              </div>
              {formState.id && selectedProfile?.is_system_profile ? <StatusBadge label="System profile" tone="info" /> : null}
            </div>

            {notice ? <div className="atlas-pill-accent mt-5 rounded-[24px] px-4 py-3 text-sm">{notice}</div> : null}

            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-atlas-soft">Profile Name</span>
                  <input
                    className="atlas-field w-full rounded-2xl px-4 py-3"
                    value={formState.name}
                    onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Identity Operators"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-atlas-soft">Description</span>
                  <input
                    className="atlas-field w-full rounded-2xl px-4 py-3"
                    value={formState.description}
                    onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Focused access for identity workflows and staged library review."
                  />
                </label>
              </div>

              <div className="space-y-5">
                {Object.entries(permissionGroups).map(([groupName, permissions]) => (
                  <section key={groupName} className="atlas-panel-soft rounded-[28px] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-atlas">{groupName}</p>
                      <span className="text-xs uppercase tracking-[0.16em] text-atlas-dim">{permissions.length} permissions</span>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      {permissions.map((permission) => {
                        const isChecked = formState.permissions.includes(permission.key);
                        return (
                          <label
                            key={permission.key}
                            className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${
                              isChecked
                                ? "border-[rgba(201,74,99,0.24)] bg-[rgba(201,74,99,0.08)]"
                                : "border-[rgba(23,32,42,0.08)] bg-white/72 hover:border-[rgba(23,32,42,0.14)]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(permission.key)}
                              className="mt-1 h-4 w-4 rounded border-[rgba(23,32,42,0.18)] text-[var(--atlas-accent)] focus:ring-[var(--atlas-accent)]"
                            />
                            <span>
                              <span className="block text-sm font-semibold text-atlas">{permission.label}</span>
                              <span className="mt-1 block text-sm leading-6 text-atlas-muted">{permission.description}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>

              <button
                type="submit"
                disabled={saveProfileMutation.isPending}
                className="atlas-primary-button rounded-2xl px-5 py-3 text-sm font-semibold"
              >
                {saveProfileMutation.isPending ? "Saving Profile..." : formState.id ? "Update Profile" : "Create Profile"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
