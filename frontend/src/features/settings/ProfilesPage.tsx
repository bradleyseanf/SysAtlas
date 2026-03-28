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
  CListGroup,
  CListGroupItem,
  CRow,
  CSpinner,
} from "@coreui/react";

import { StatusBadge } from "../../components/StatusBadge";
import { api } from "../../lib/api";
import type { AccessProfile, PermissionDefinition } from "../../types/api";
import { useAuth } from "../auth/AuthContext";

const NEW_PROFILE_ID = "__new__";

type ProfileFormState = {
  id?: string;
  name: string;
  permissions: string[];
};

function buildProfileForm(profile?: AccessProfile): ProfileFormState {
  return {
    id: profile?.id,
    name: profile?.name ?? "",
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
  const defaultSelectedProfile = profiles.find((profile) => !profile.is_system_profile) ?? profiles[0];
  const selectedProfile =
    selectedProfileId && selectedProfileId !== NEW_PROFILE_ID
      ? profiles.find((profile) => profile.id === selectedProfileId)
      : undefined;
  const isLockedProfile = Boolean(formState.id && selectedProfile?.is_system_profile);

  useEffect(() => {
    if (!profiles.length) {
      return;
    }

    setSelectedProfileId((current) => current || defaultSelectedProfile?.id || "");
  }, [defaultSelectedProfile, profiles]);

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
    if (isLockedProfile) {
      return;
    }

    setFormState((current) => ({
      ...current,
      permissions: current.permissions.includes(permissionKey)
        ? current.permissions.filter((item) => item !== permissionKey)
        : [...current.permissions, permissionKey],
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLockedProfile) {
      return;
    }

    setNotice("");
    saveProfileMutation.mutate({
      ...formState,
      description: "",
    });
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
                    setSelectedProfileId(NEW_PROFILE_ID);
                    setFormState(buildProfileForm());
                    setNotice("");
                    setNoticeTone("info");
                  }}
                >
                  New Profile
                </CButton>
              </CCardHeader>

              <CCardBody className="p-0">
                <CListGroup flush>
                  {profiles.map((profile) => {
                    const isSelected = profile.id === selectedProfile?.id;

                    return (
                      <CListGroupItem
                        key={profile.id}
                        as="button"
                        active={isSelected}
                        onClick={() => {
                          setSelectedProfileId(profile.id);
                          setNotice("");
                          setNoticeTone("info");
                        }}
                        className="text-start"
                      >
                        <div className="d-flex align-items-center justify-content-between gap-3">
                          <div className="fw-semibold">{profile.name}</div>
                          {profile.is_system_profile ? <StatusBadge label="Locked" tone="info" /> : null}
                        </div>
                      </CListGroupItem>
                    );
                  })}
                </CListGroup>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol xl={8}>
            <CCard className="shadow-sm">
              <CCardHeader className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                <div>
                  <p className="mb-1 small fw-semibold text-body-secondary text-uppercase">Access Design</p>
                  <h2 className="h4 mb-2">{isLockedProfile ? "Locked Profile" : formState.id ? "Edit Profile" : "Create Profile"}</h2>
                  <p className="mb-0 text-body-secondary">
                    {isLockedProfile
                      ? "Super Admin stays attached to the instance creator and always keeps full access."
                      : "Adjust the access footprint here, then assign the profile from Settings / Users."}
                  </p>
                </div>
                {isLockedProfile ? <StatusBadge label="Locked" tone="info" /> : null}
              </CCardHeader>

              <CCardBody>
                {notice ? (
                  <CAlert color={noticeTone} className="mb-4">
                    {notice}
                  </CAlert>
                ) : null}

                {isLockedProfile ? (
                  <CAlert color="secondary" className="mb-4">
                    Super Admin is reserved for the first user who initializes the instance.
                  </CAlert>
                ) : null}

                <form onSubmit={handleSubmit}>
                  <CRow className="g-3">
                    <CCol lg={6}>
                      <CFormLabel htmlFor="profile-name">Profile Name</CFormLabel>
                      <CFormInput
                        id="profile-name"
                        value={formState.name}
                        onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Operations"
                        disabled={isLockedProfile}
                        required
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
                                      disabled={isLockedProfile}
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

                  {!isLockedProfile ? (
                    <div className="mt-4">
                      <CButton type="submit" color="primary" disabled={saveProfileMutation.isPending}>
                        {saveProfileMutation.isPending ? "Saving Profile..." : formState.id ? "Update Profile" : "Create Profile"}
                      </CButton>
                    </div>
                  ) : null}
                </form>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}
    </div>
  );
}
