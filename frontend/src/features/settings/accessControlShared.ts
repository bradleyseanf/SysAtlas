import { useQuery } from "@tanstack/react-query";

import { api } from "../../lib/api";
import type { AccessProfile, AccessUser } from "../../types/api";

export const accessControlQueryKey = ["settings", "access-control"] as const;
export const NEW_PROFILE_ROUTE_ID = "new";
export const NEW_USER_ROUTE_ID = "new";

export type ProfileFormState = {
  id?: string;
  name: string;
  permissions: string[];
};

export type AccessUserFormState = {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  profile_id: string;
  is_active: boolean;
  is_superuser: boolean;
};

export function useAccessControlState() {
  return useQuery({
    queryKey: accessControlQueryKey,
    queryFn: api.getAccessControl,
  });
}

export function buildProfileForm(profile?: AccessProfile): ProfileFormState {
  return {
    id: profile?.id,
    name: profile?.name ?? "",
    permissions: profile?.permissions ?? [],
  };
}

export function buildAccessUserForm(user?: AccessUser): AccessUserFormState {
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
