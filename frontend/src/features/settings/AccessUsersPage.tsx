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
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormSwitch,
  CRow,
  CSpinner,
} from "@coreui/react";

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
  const [noticeTone, setNoticeTone] = useState<"info" | "danger">("info");

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
      setNoticeTone("info");
      setNotice(response.message);
      setSelectedUserId(response.item.id);
      setFormState(buildAccessUserForm(response.item));
      await queryClient.invalidateQueries({ queryKey: ["settings", "access-control"] });

      if (session?.user.id === response.item.id) {
        await refreshSession();
      }
    },
    onError: (mutationError) => {
      setNoticeTone("danger");
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
    <div className="d-grid gap-4">
      <CAlert color="info" className="mb-0">
        These users are SysAtlas access accounts. They are separate from the Users module, which represents synced organization
        users from connected systems.
      </CAlert>

      {accessControlQuery.isLoading ? (
        <CCard className="shadow-sm">
          <CCardBody className="py-5 text-center text-body-secondary">
            <CSpinner color="primary" className="mb-3" />
            <div>Loading SysAtlas access users...</div>
          </CCardBody>
        </CCard>
      ) : accessControlQuery.isError ? (
        <CAlert color="danger" className="mb-0">
          {accessControlQuery.error instanceof Error ? accessControlQuery.error.message : "Unable to load SysAtlas access users."}
        </CAlert>
      ) : (
        <CRow className="g-4">
          <CCol xl={4}>
            <CCard className="h-100 shadow-sm">
              <CCardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div>
                  <p className="mb-1 fw-semibold">Access Users</p>
                  <p className="mb-0 small text-body-secondary">{users.length} users</p>
                </div>
                <CButton
                  color="secondary"
                  variant="outline"
                  onClick={() => {
                    setSelectedUserId("");
                    setFormState(buildAccessUserForm());
                    setNotice("");
                    setNoticeTone("info");
                  }}
                >
                  New User
                </CButton>
              </CCardHeader>

              <CCardBody className="p-0">
                <div className="list-group list-group-flush">
                  {users.map((user) => {
                    const isSelected = user.id === (selectedUserId || selectedUser?.id);

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setNotice("");
                          setNoticeTone("info");
                        }}
                        className={`list-group-item list-group-item-action text-start ${isSelected ? "active" : ""}`}
                      >
                        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                          <div>
                            <div className="fw-semibold">{user.display_name ?? user.email}</div>
                            <div className={`small ${isSelected ? "text-white-50" : "text-body-secondary"}`}>{user.email}</div>
                            <div className={`small text-uppercase ${isSelected ? "text-white-50" : "text-body-secondary"}`}>
                              {user.profile?.name ?? "No profile"}
                            </div>
                          </div>

                          <div className="d-flex flex-wrap gap-2">
                            {user.is_superuser ? <StatusBadge label="Super Admin" tone="info" /> : null}
                            <StatusBadge label={user.is_active ? "Active" : "Disabled"} tone={user.is_active ? "positive" : "danger"} />
                          </div>
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
              <CCardHeader>
                <p className="mb-1 small fw-semibold text-body-secondary text-uppercase">Access Accounts</p>
                <h2 className="h4 mb-2">{formState.id ? "Edit User" : "Create User"}</h2>
                <p className="mb-0 text-body-secondary">
                  Assign a profile so every sign-in account inherits a clear and predictable access footprint.
                </p>
              </CCardHeader>

              <CCardBody>
                {notice ? (
                  <CAlert color={noticeTone} className="mb-4">
                    {notice}
                  </CAlert>
                ) : null}

                <form onSubmit={handleSubmit}>
                  <CRow className="g-3">
                    <CCol md={6}>
                      <CFormLabel htmlFor="access-user-first-name">First Name</CFormLabel>
                      <CFormInput
                        id="access-user-first-name"
                        value={formState.first_name}
                        onChange={(event) => setFormState((current) => ({ ...current, first_name: event.target.value }))}
                        placeholder="Avery"
                        required
                      />
                    </CCol>

                    <CCol md={6}>
                      <CFormLabel htmlFor="access-user-last-name">Last Name</CFormLabel>
                      <CFormInput
                        id="access-user-last-name"
                        value={formState.last_name}
                        onChange={(event) => setFormState((current) => ({ ...current, last_name: event.target.value }))}
                        placeholder="Morgan"
                        required
                      />
                    </CCol>

                    <CCol xs={12}>
                      <CFormLabel htmlFor="access-user-email">Email</CFormLabel>
                      <CFormInput
                        id="access-user-email"
                        type="email"
                        value={formState.email}
                        onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
                        placeholder="operator@company.com"
                        required
                      />
                    </CCol>

                    <CCol md={6}>
                      <CFormLabel htmlFor="access-user-profile">Access Profile</CFormLabel>
                      <CFormSelect
                        id="access-user-profile"
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
                      </CFormSelect>
                    </CCol>

                    <CCol md={6}>
                      <CFormLabel htmlFor="access-user-password">Password</CFormLabel>
                      <CFormInput
                        id="access-user-password"
                        type="password"
                        value={formState.password}
                        onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
                        placeholder={formState.id ? "Leave blank to keep the current password" : "At least 12 characters"}
                        minLength={formState.id ? undefined : 12}
                        required={!formState.id}
                      />
                    </CCol>
                  </CRow>

                  <CRow className="g-4 mt-1">
                    <CCol md={6}>
                      <CCard className="h-100 border-0 bg-body-tertiary">
                        <CCardBody>
                          <div className="d-flex align-items-start justify-content-between gap-3">
                            <div>
                              <div className="fw-semibold">User Active</div>
                              <div className="small text-body-secondary">Disable access without deleting the user.</div>
                            </div>
                            <CFormSwitch
                              checked={formState.is_active}
                              onChange={(event) => setFormState((current) => ({ ...current, is_active: event.target.checked }))}
                            />
                          </div>
                        </CCardBody>
                      </CCard>
                    </CCol>

                    <CCol md={6}>
                      <CCard className="h-100 border-0 bg-body-tertiary">
                        <CCardBody>
                          <div className="d-flex align-items-start justify-content-between gap-3">
                            <div>
                              <div className="fw-semibold">Super Admin</div>
                              <div className="small text-body-secondary">Gains full SysAtlas access across all routes.</div>
                            </div>
                            <CFormSwitch
                              checked={formState.is_superuser}
                              onChange={(event) =>
                                setFormState((current) => ({
                                  ...current,
                                  is_superuser: event.target.checked,
                                  profile_id: event.target.checked && !current.profile_id ? (platformAdminProfile?.id ?? current.profile_id) : current.profile_id,
                                }))
                              }
                            />
                          </div>
                        </CCardBody>
                      </CCard>
                    </CCol>
                  </CRow>

                  <div className="mt-4">
                    <CButton type="submit" color="primary" disabled={saveAccessUserMutation.isPending}>
                      {saveAccessUserMutation.isPending ? "Saving User..." : formState.id ? "Update User" : "Create User"}
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
