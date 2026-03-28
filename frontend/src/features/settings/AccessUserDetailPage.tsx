import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormSwitch,
  CFormText,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
  CTable,
} from "@coreui/react";
import { useNavigate, useParams } from "react-router-dom";

import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../lib/formatters";
import { useDevModeUrlState } from "../../lib/devMode";
import { api } from "../../lib/api";
import { useAuth } from "../auth/AuthContext";
import {
  accessControlQueryKey,
  buildAccessUserForm,
  NEW_USER_ROUTE_ID,
  useAccessControlState,
} from "./accessControlShared";

export function AccessUserDetailPage() {
  const { userId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshSession, session } = useAuth();
  const { withDevMode } = useDevModeUrlState();
  const accessControlQuery = useAccessControlState();
  const [formState, setFormState] = useState(buildAccessUserForm());
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"info" | "danger">("info");

  const users = accessControlQuery.data?.users ?? [];
  const profiles = accessControlQuery.data?.profiles ?? [];
  const permissions = accessControlQuery.data?.permissions ?? [];
  const isNewUser = userId === NEW_USER_ROUTE_ID;
  const selectedUser = isNewUser ? undefined : users.find((user) => user.id === userId);
  const superAdminProfile = profiles.find((profile) => profile.is_system_profile);
  const assignableProfiles = profiles.filter((profile) => !profile.is_system_profile);
  const selectedProfileValue = formState.is_superuser ? (superAdminProfile?.id ?? formState.profile_id) : formState.profile_id;

  useEffect(() => {
    if (isNewUser) {
      setFormState(buildAccessUserForm());
      setIsEditorVisible(true);
      setNotice("");
      setNoticeTone("info");
      return;
    }

    if (!selectedUser) {
      return;
    }

    setFormState(buildAccessUserForm(selectedUser));
    setIsEditorVisible(false);
    setNotice("");
    setNoticeTone("info");
  }, [isNewUser, selectedUser]);

  const permissionRows = useMemo(
    () =>
      [...permissions]
        .sort((left, right) => {
          const byGroup = left.group.localeCompare(right.group);
          return byGroup !== 0 ? byGroup : left.label.localeCompare(right.label);
        })
        .map((permission) => ({
          ...permission,
          enabled: selectedUser?.permissions.includes(permission.key) ?? false,
        })),
    [permissions, selectedUser],
  );

  const saveAccessUserMutation = useMutation({
    mutationFn: api.saveAccessUser,
    onSuccess: async (response) => {
      setNoticeTone("info");
      setNotice(response.message);
      setFormState(buildAccessUserForm(response.item));
      setIsEditorVisible(false);
      await queryClient.invalidateQueries({ queryKey: accessControlQueryKey });

      if (session?.user.id === response.item.id) {
        await refreshSession();
      }

      navigate(withDevMode(`/settings/users/${response.item.id}`), { replace: isNewUser });
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

  function handleCloseEditor() {
    setIsEditorVisible(false);

    if (isNewUser) {
      navigate(withDevMode("/settings/users"));
      return;
    }

    if (selectedUser) {
      setFormState(buildAccessUserForm(selectedUser));
      setNotice("");
      setNoticeTone("info");
    }
  }

  if (accessControlQuery.isLoading) {
    return (
      <CCard className="shadow-sm">
        <CCardBody className="py-5 text-center text-body-secondary">
          <CSpinner color="primary" className="mb-3" />
          <div>Loading access user...</div>
        </CCardBody>
      </CCard>
    );
  }

  if (accessControlQuery.isError) {
    return (
      <CAlert color="danger" className="mb-0">
        {accessControlQuery.error instanceof Error ? accessControlQuery.error.message : "Unable to load the access user."}
      </CAlert>
    );
  }

  if (!isNewUser && !selectedUser) {
    return (
      <CCard className="shadow-sm">
        <CCardBody className="d-grid gap-3">
          <CAlert color="warning" className="mb-0">
            The requested access user could not be found.
          </CAlert>
          <div>
            <CButton color="secondary" variant="outline" onClick={() => navigate(withDevMode("/settings/users"))}>
              Back to Users
            </CButton>
          </div>
        </CCardBody>
      </CCard>
    );
  }

  return (
    <div className="d-grid gap-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <CButton color="secondary" variant="outline" onClick={() => navigate(withDevMode("/settings/users"))}>
          Back to Users
        </CButton>
        <CButton color="primary" onClick={() => setIsEditorVisible(true)}>
          {selectedUser ? "Edit User" : "Create User"}
        </CButton>
      </div>

      {notice ? (
        <CAlert color={noticeTone} className="mb-0">
          {notice}
        </CAlert>
      ) : null}

      <CCard className="shadow-sm">
        <CCardHeader className="d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div>
            <p className="mb-1 small fw-semibold text-body-secondary text-uppercase">Access User</p>
            <h2 className="h4 mb-2">{selectedUser?.display_name ?? "New User"}</h2>
            <p className="mb-0 text-body-secondary">Review the account details here, then use the centered editor to make changes.</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {selectedUser?.is_superuser ? <StatusBadge label="Super Admin" tone="info" /> : null}
            {selectedUser ? (
              <StatusBadge label={selectedUser.is_active ? "Active" : "Disabled"} tone={selectedUser.is_active ? "positive" : "danger"} />
            ) : null}
            <CBadge color="secondary">{selectedUser?.permissions.length ?? 0} effective permissions</CBadge>
          </div>
        </CCardHeader>

        <CCardBody className="p-0">
          <CTable responsive className="mb-0">
            <tbody>
              <tr>
                <th scope="row" style={{ width: "220px" }}>
                  User ID
                </th>
                <td>{selectedUser?.id ?? "Will be created after save"}</td>
              </tr>
              <tr>
                <th scope="row">Full Name</th>
                <td>{selectedUser?.display_name ?? "Not set"}</td>
              </tr>
              <tr>
                <th scope="row">Email</th>
                <td>{selectedUser?.email ?? "Not set"}</td>
              </tr>
              <tr>
                <th scope="row">Assigned Profile</th>
                <td>
                  {selectedUser?.profile ? (
                    <CButton
                      color="link"
                      className="p-0 text-decoration-none"
                      onClick={() => navigate(withDevMode(`/settings/profiles/${selectedUser.profile?.id}`))}
                    >
                      {selectedUser.profile.name}
                    </CButton>
                  ) : (
                    "No profile"
                  )}
                </td>
              </tr>
              <tr>
                <th scope="row">Created</th>
                <td>{selectedUser ? formatDateTime(selectedUser.created_at) : "Not created yet"}</td>
              </tr>
              <tr>
                <th scope="row">Updated</th>
                <td>{selectedUser ? formatDateTime(selectedUser.updated_at) : "Not created yet"}</td>
              </tr>
            </tbody>
          </CTable>
        </CCardBody>
      </CCard>

      <CCard className="shadow-sm">
        <CCardHeader>
          <p className="mb-1 fw-semibold">Effective Access</p>
          <p className="mb-0 text-body-secondary">Permissions inherited from the assigned profile appear here as a read-only list.</p>
        </CCardHeader>

        <CCardBody className="p-0">
          <CTable hover responsive className="mb-0 align-middle">
            <thead>
              <tr>
                <th>Permission</th>
                <th>Group</th>
                <th>Description</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {permissionRows.map((permission) => (
                <tr key={permission.key}>
                  <td>
                    <div className="fw-semibold">{permission.label}</div>
                    <div className="small text-body-secondary">{permission.key}</div>
                  </td>
                  <td>{permission.group}</td>
                  <td>{permission.description}</td>
                  <td>
                    <StatusBadge label={permission.enabled ? "On" : "Off"} tone={permission.enabled ? "positive" : "neutral"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </CTable>
        </CCardBody>
      </CCard>

      <CModal alignment="center" visible={isEditorVisible} onClose={handleCloseEditor}>
        <form onSubmit={handleSubmit}>
          <CModalHeader>
            <CModalTitle>{formState.id ? "Edit User" : "Create User"}</CModalTitle>
          </CModalHeader>
          <CModalBody className="d-grid gap-3">
            {noticeTone === "danger" && notice ? (
              <CAlert color="danger" className="mb-0">
                {notice}
              </CAlert>
            ) : null}

            <div>
              <CFormLabel htmlFor="access-user-first-name">First Name</CFormLabel>
              <CFormInput
                id="access-user-first-name"
                value={formState.first_name}
                onChange={(event) => setFormState((current) => ({ ...current, first_name: event.target.value }))}
                placeholder="Avery"
                required
              />
            </div>

            <div>
              <CFormLabel htmlFor="access-user-last-name">Last Name</CFormLabel>
              <CFormInput
                id="access-user-last-name"
                value={formState.last_name}
                onChange={(event) => setFormState((current) => ({ ...current, last_name: event.target.value }))}
                placeholder="Morgan"
                required
              />
            </div>

            <div>
              <CFormLabel htmlFor="access-user-email">Email</CFormLabel>
              <CFormInput
                id="access-user-email"
                type="email"
                value={formState.email}
                onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
                placeholder="operator@company.com"
                required
              />
            </div>

            <div>
              <CFormLabel htmlFor="access-user-profile">Access Profile</CFormLabel>
              <CFormSelect
                id="access-user-profile"
                value={selectedProfileValue}
                onChange={(event) => setFormState((current) => ({ ...current, profile_id: event.target.value }))}
                disabled={formState.is_superuser}
                required
              >
                {formState.is_superuser ? (
                  superAdminProfile ? (
                    <option value={superAdminProfile.id}>{superAdminProfile.name}</option>
                  ) : (
                    <option value="">Super Admin</option>
                  )
                ) : (
                  <>
                    <option value="">Select a profile</option>
                    {assignableProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                  </>
                )}
              </CFormSelect>
              {formState.is_superuser ? (
                <CFormText>Reserved for the first user who initialized this SysAtlas instance.</CFormText>
              ) : null}
            </div>

            <div>
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
            </div>

            <div className="rounded border bg-body-tertiary p-3">
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
            </div>

            {formState.is_superuser ? (
              <div className="rounded border bg-body-tertiary p-3">
                <div className="fw-semibold">Super Admin</div>
                <div className="small text-body-secondary">Locked to the first user who created this SysAtlas instance.</div>
              </div>
            ) : null}
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="outline" onClick={handleCloseEditor}>
              Cancel
            </CButton>
            <CButton type="submit" color="primary" disabled={saveAccessUserMutation.isPending}>
              {saveAccessUserMutation.isPending ? "Saving User..." : formState.id ? "Update User" : "Create User"}
            </CButton>
          </CModalFooter>
        </form>
      </CModal>
    </div>
  );
}
