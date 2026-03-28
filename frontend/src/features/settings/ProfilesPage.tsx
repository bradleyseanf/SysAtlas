import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CRow,
  CSpinner,
} from "@coreui/react";

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
  const [noticeTone, setNoticeTone] = useState<"info" | "danger">("info");

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
      setNoticeTone("info");
      setNotice(response.message);
      setSelectedProfileId(response.item.id);
      setFormState(buildProfileForm(response.item));
      await queryClient.invalidateQueries({ queryKey: ["settings", "access-control"] });

      if (session?.user.profile?.id === response.item.id) {
        await refreshSession();
      }
    },
    onError: (mutationError) => {
      setNoticeTone("danger");
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
    <div className="d-grid gap-4">
      <CAlert color="info" className="mb-0">
        Profiles are the clean way to assign access. Build a profile once, then assign it to the people who can sign in under
        Settings / Users.
      </CAlert>

      {accessControlQuery.isLoading ? (
        <CCard className="shadow-sm">
          <CCardBody className="py-5 text-center text-body-secondary">
            <CSpinner color="primary" className="mb-3" />
            <div>Loading access profiles...</div>
          </CCardBody>
        </CCard>
      ) : accessControlQuery.isError ? (
        <CAlert color="danger" className="mb-0">
          {accessControlQuery.error instanceof Error ? accessControlQuery.error.message : "Unable to load the access profiles."}
        </CAlert>
      ) : (
        <CRow className="g-4">
          <CCol xl={4}>
            <CCard className="h-100 shadow-sm">
              <CCardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div>
                  <p className="mb-1 fw-semibold">Access Profiles</p>
                  <p className="mb-0 small text-body-secondary">{profiles.length} profiles</p>
                </div>
                <CButton
                  color="secondary"
                  variant="outline"
                  onClick={() => {
                    setSelectedProfileId("");
                    setFormState(buildProfileForm());
                    setNotice("");
                    setNoticeTone("info");
                  }}
                >
                  New Profile
                </CButton>
              </CCardHeader>

              <CCardBody className="p-0">
                <div className="list-group list-group-flush">
                  {profiles.map((profile) => {
                    const isSelected = profile.id === (selectedProfileId || selectedProfile?.id);

                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => {
                          setSelectedProfileId(profile.id);
                          setNotice("");
                          setNoticeTone("info");
                        }}
                        className={`list-group-item list-group-item-action text-start ${isSelected ? "active" : ""}`}
                      >
                        <div className="d-flex align-items-start justify-content-between gap-3">
                          <div>
                            <div className="fw-semibold">{profile.name}</div>
                            <div className={`small ${isSelected ? "text-white-50" : "text-body-secondary"}`}>
                              {profile.description ?? "No description set."}
                            </div>
                          </div>
                          {profile.is_system_profile ? <StatusBadge label="System" tone="info" /> : null}
                        </div>

                        <div className="d-flex flex-wrap gap-2 mt-3">
                          <StatusBadge label={`${profile.permissions.length} permissions`} />
                          <StatusBadge label={`${profile.assigned_user_count} users`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol xl={8}>
            <CCard className="shadow-sm">
              <CCardHeader className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                <div>
                  <p className="mb-1 small fw-semibold text-body-secondary text-uppercase">Access Design</p>
                  <h2 className="h4 mb-2">{formState.id ? "Edit Profile" : "Create Profile"}</h2>
                  <p className="mb-0 text-body-secondary">
                    Keep profiles small and clear so admins can assign them without guessing what each person will see.
                  </p>
                </div>
                {formState.id && selectedProfile?.is_system_profile ? <StatusBadge label="System profile" tone="info" /> : null}
              </CCardHeader>

              <CCardBody>
                {notice ? (
                  <CAlert color={noticeTone} className="mb-4">
                    {notice}
                  </CAlert>
                ) : null}

                <form onSubmit={handleSubmit}>
                  <CRow className="g-3">
                    <CCol lg={5}>
                      <CFormLabel htmlFor="profile-name">Profile Name</CFormLabel>
                      <CFormInput
                        id="profile-name"
                        value={formState.name}
                        onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Identity Operators"
                        required
                      />
                    </CCol>

                    <CCol lg={7}>
                      <CFormLabel htmlFor="profile-description">Description</CFormLabel>
                      <CFormInput
                        id="profile-description"
                        value={formState.description}
                        onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
                        placeholder="Focused access for identity workflows and staged library review."
                      />
                    </CCol>
                  </CRow>

                  <div className="d-grid gap-4 mt-4">
                    {Object.entries(permissionGroups).map(([groupName, permissions]) => (
                      <CCard key={groupName} className="border-0 bg-body-tertiary">
                        <CCardHeader className="bg-transparent d-flex flex-wrap align-items-center justify-content-between gap-2">
                          <span className="fw-semibold">{groupName}</span>
                          <span className="small text-body-secondary">{permissions.length} permissions</span>
                        </CCardHeader>

                        <CCardBody>
                          <CRow className="g-3">
                            {permissions.map((permission) => {
                              const isChecked = formState.permissions.includes(permission.key);

                              return (
                                <CCol key={permission.key} lg={6}>
                                  <div className={`h-100 rounded border p-3 ${isChecked ? "border-primary bg-primary bg-opacity-10" : ""}`}>
                                    <CFormCheck
                                      id={`permission-${permission.key}`}
                                      checked={isChecked}
                                      onChange={() => togglePermission(permission.key)}
                                      label={permission.label}
                                    />
                                    <div className="mt-2 small text-body-secondary">{permission.description}</div>
                                  </div>
                                </CCol>
                              );
                            })}
                          </CRow>
                        </CCardBody>
                      </CCard>
                    ))}
                  </div>

                  <div className="mt-4">
                    <CButton type="submit" color="primary" disabled={saveProfileMutation.isPending}>
                      {saveProfileMutation.isPending ? "Saving Profile..." : formState.id ? "Update Profile" : "Create Profile"}
                    </CButton>
                  </div>
                </form>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}
    </div>
  );
}
