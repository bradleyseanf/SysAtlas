import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CAlert,
  CBadge,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CFormInput,
  CFormLabel,
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
import { isHostedStaticDemoMode } from "../../lib/runtimeMode";
import { useAuth } from "../auth/AuthContext";
import { accessControlQueryKey, buildProfileForm, NEW_PROFILE_ROUTE_ID, useAccessControlState } from "./accessControlShared";

export function ProfileDetailPage() {
  const isStaticDemo = isHostedStaticDemoMode();
  const { profileId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshSession, session } = useAuth();
  const { withDevMode } = useDevModeUrlState();
  const accessControlQuery = useAccessControlState();
  const [formState, setFormState] = useState(buildProfileForm());
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"info" | "danger">("info");

  const profiles = accessControlQuery.data?.profiles ?? [];
  const permissions = accessControlQuery.data?.permissions ?? [];
  const isNewProfile = profileId === NEW_PROFILE_ROUTE_ID;
  const selectedProfile = isNewProfile ? undefined : profiles.find((profile) => profile.id === profileId);
  const isLockedProfile = selectedProfile?.is_system_profile ?? false;

  useEffect(() => {
    if (isNewProfile) {
      setFormState(buildProfileForm());
      setNotice("");
      setNoticeTone("info");
      return;
    }

    if (!selectedProfile) {
      return;
    }

    setFormState(buildProfileForm(selectedProfile));
    setNotice("");
    setNoticeTone("info");
  }, [isNewProfile, selectedProfile]);

  const sortedPermissions = useMemo(
    () =>
      [...permissions].sort((left, right) => {
        const byGroup = left.group.localeCompare(right.group);
        return byGroup !== 0 ? byGroup : left.label.localeCompare(right.label);
      }),
    [permissions],
  );

  const saveProfileMutation = useMutation({
    mutationFn: api.saveAccessProfile,
    onSuccess: async (response) => {
      setNoticeTone("info");
      setNotice(response.message);
      setFormState(buildProfileForm(response.item));
      setIsEditorVisible(false);
      await queryClient.invalidateQueries({ queryKey: accessControlQueryKey });

      if (session?.user.profile?.id === response.item.id) {
        await refreshSession();
      }

      navigate(withDevMode(`/settings/profiles/${response.item.id}`), { replace: isNewProfile });
    },
    onError: (mutationError) => {
      setNoticeTone("danger");
      setNotice(mutationError instanceof Error ? mutationError.message : "Unable to save the access profile.");
    },
  });

  function togglePermission(permissionKey: string, enabled: boolean) {
    if (isLockedProfile) {
      return;
    }

    setFormState((current) => {
      const currentSet = new Set(current.permissions);
      if (enabled) {
        currentSet.add(permissionKey);
      } else {
        currentSet.delete(permissionKey);
      }

      return {
        ...current,
        permissions: permissions
          .filter((permission) => currentSet.has(permission.key))
          .map((permission) => permission.key),
      };
    });
  }

  function handleSaveProfile(event?: FormEvent) {
    event?.preventDefault();

    if (isLockedProfile) {
      return;
    }

    setNotice("");
    saveProfileMutation.mutate({
      ...formState,
      description: "",
    });
  }

  function handleCloseEditor() {
    setIsEditorVisible(false);

    if (isNewProfile) {
      navigate(withDevMode("/settings/profiles"));
      return;
    }

    if (selectedProfile) {
      setFormState(buildProfileForm(selectedProfile));
      setNotice("");
      setNoticeTone("info");
    }
  }

  if (accessControlQuery.isLoading) {
    return (
      <CCard className="shadow-sm">
        <CCardBody className="py-5 text-center text-body-secondary">
          <CSpinner color="primary" className="mb-3" />
          <div>Loading access profile...</div>
        </CCardBody>
      </CCard>
    );
  }

  if (accessControlQuery.isError) {
    return (
      <CAlert color="danger" className="mb-0">
        {accessControlQuery.error instanceof Error ? accessControlQuery.error.message : "Unable to load the access profile."}
      </CAlert>
    );
  }

  if (!isNewProfile && !selectedProfile) {
    return (
      <CCard className="shadow-sm">
        <CCardBody className="d-grid gap-3">
          <CAlert color="warning" className="mb-0">
            The requested profile could not be found.
          </CAlert>
          <div>
            <CButton color="secondary" variant="outline" onClick={() => navigate(withDevMode("/settings/profiles"))}>
              Back to Profiles
            </CButton>
          </div>
        </CCardBody>
      </CCard>
    );
  }

  return (
    <div className="d-grid gap-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <CButton color="secondary" variant="outline" onClick={() => navigate(withDevMode("/settings/profiles"))}>
          Back to Profiles
        </CButton>
        {!isLockedProfile ? (
          <div className="d-flex flex-wrap gap-2">
            <CButton color="secondary" variant="outline" disabled={isStaticDemo} onClick={() => setIsEditorVisible(true)}>
              {formState.id ? "Edit Details" : "Set Details"}
            </CButton>
            <CButton
              color="primary"
              onClick={() => handleSaveProfile()}
              disabled={isStaticDemo || saveProfileMutation.isPending || !formState.name.trim() || formState.permissions.length === 0}
            >
              {saveProfileMutation.isPending ? "Saving Profile..." : formState.id ? "Save Profile" : "Create Profile"}
            </CButton>
          </div>
        ) : null}
      </div>

      {notice ? (
        <CAlert color={noticeTone} className="mb-0">
          {notice}
        </CAlert>
      ) : isStaticDemo ? (
        <CAlert color="info" className="mb-0">
          Hosted Vercel access is read-only. Profile edits are disabled in static demo mode.
        </CAlert>
      ) : null}

      <CCard className="shadow-sm">
        <CCardHeader className="d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div>
            <p className="mb-1 small fw-semibold text-body-secondary text-uppercase">Access Profile</p>
            <h2 className="h4 mb-2">{formState.name || "New Profile"}</h2>
            <p className="mb-0 text-body-secondary">
              {isLockedProfile
                ? "The Super Admin profile is reserved for the instance creator and cannot be changed."
                : "Use the permission list below to decide what this profile can access."}
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {isLockedProfile ? <StatusBadge label="Locked" tone="info" /> : <CBadge color="light" textColor="dark">Custom</CBadge>}
            <CBadge color="secondary">{formState.permissions.length} permissions</CBadge>
            <CBadge color="secondary">{selectedProfile?.assigned_user_count ?? 0} assigned users</CBadge>
          </div>
        </CCardHeader>

        <CCardBody className="p-0">
          <CTable responsive className="mb-0">
            <tbody>
              <tr>
                <th scope="row" style={{ width: "220px" }}>
                  Profile ID
                </th>
                <td>{selectedProfile?.id ?? "Will be created after save"}</td>
              </tr>
              <tr>
                <th scope="row">Profile Name</th>
                <td>{formState.name || "Not set"}</td>
              </tr>
              <tr>
                <th scope="row">Created</th>
                <td>{selectedProfile ? formatDateTime(selectedProfile.created_at) : "Not created yet"}</td>
              </tr>
              <tr>
                <th scope="row">Updated</th>
                <td>{selectedProfile ? formatDateTime(selectedProfile.updated_at) : "Not created yet"}</td>
              </tr>
            </tbody>
          </CTable>
        </CCardBody>
      </CCard>

      <CCard className="shadow-sm">
        <CCardHeader className="d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div>
            <p className="mb-1 fw-semibold">Permissions</p>
            <p className="mb-0 text-body-secondary">Set each permission to On or Off for this profile.</p>
          </div>
          {!isLockedProfile ? <CBadge color="light" textColor="dark">Button Controls</CBadge> : null}
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
              {sortedPermissions.map((permission) => {
                const isEnabled = formState.permissions.includes(permission.key);

                return (
                  <tr key={permission.key}>
                    <td>
                      <div className="fw-semibold">{permission.label}</div>
                    </td>
                    <td>{permission.group}</td>
                    <td>{permission.description}</td>
                    <td>
                      {isLockedProfile ? (
                        <StatusBadge label={isEnabled ? "On" : "Off"} tone={isEnabled ? "positive" : "neutral"} />
                      ) : (
                        <CButtonGroup size="sm" role="group" aria-label={`Access toggle for ${permission.label}`}>
                          <CButton
                            color={isEnabled ? "primary" : "secondary"}
                            variant={isEnabled ? undefined : "outline"}
                            disabled={isStaticDemo}
                            onClick={() => togglePermission(permission.key, true)}
                          >
                            On
                          </CButton>
                          <CButton
                            color={!isEnabled ? "dark" : "secondary"}
                            variant={!isEnabled ? undefined : "outline"}
                            disabled={isStaticDemo}
                            onClick={() => togglePermission(permission.key, false)}
                          >
                            Off
                          </CButton>
                        </CButtonGroup>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </CTable>
        </CCardBody>
      </CCard>

      <CModal alignment="center" visible={isEditorVisible && !isStaticDemo} onClose={handleCloseEditor}>
        <form onSubmit={handleSaveProfile}>
          <CModalHeader>
            <CModalTitle>{formState.id ? "Edit Profile Details" : "Create Profile"}</CModalTitle>
          </CModalHeader>
          <CModalBody className="d-grid gap-3">
            {noticeTone === "danger" && notice ? (
              <CAlert color="danger" className="mb-0">
                {notice}
              </CAlert>
            ) : null}

            <div>
              <CFormLabel htmlFor="profile-name">Profile Name</CFormLabel>
              <CFormInput
                id="profile-name"
                value={formState.name}
                onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                placeholder="Operations"
                required
              />
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="outline" onClick={handleCloseEditor}>
              Cancel
            </CButton>
            <CButton type="submit" color="primary" disabled={saveProfileMutation.isPending || formState.permissions.length === 0}>
              {saveProfileMutation.isPending ? "Saving Profile..." : formState.id ? "Save Profile" : "Create Profile"}
            </CButton>
          </CModalFooter>
        </form>
      </CModal>
    </div>
  );
}
