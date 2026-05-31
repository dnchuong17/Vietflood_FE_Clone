import { create } from "zustand";

import { normalizeRole } from "../../auth/lib/roles";
import type { ManagedUser, UserUpdateValues } from "../api/users";

type UsersStore = {
  users: ManagedUser[];
  query: string;
  roleFilter: "all" | string;
  selectedUser: ManagedUser | null;
  form: UserUpdateValues;
  isLoading: boolean;
  isSaving: boolean;
  isSavingRole: boolean;
  setUsers: (users: ManagedUser[]) => void;
  setQuery: (query: string) => void;
  setRoleFilter: (roleFilter: "all" | string) => void;
  selectUser: (user: ManagedUser | null) => void;
  setField: <T extends keyof UserUpdateValues>(
    field: T,
    value: UserUpdateValues[T],
  ) => void;
  setLoading: (isLoading: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setSavingRole: (isSavingRole: boolean) => void;
};

const initialState = {
  users: [] as ManagedUser[],
  query: "",
  roleFilter: "all",
  selectedUser: null,
  form: {} as UserUpdateValues,
  isLoading: true,
  isSaving: false,
  isSavingRole: false,
};

function toUserForm(user: ManagedUser): UserUpdateValues {
  return {
    first_name: user.first_name ?? "",
    middle_name: user.middle_name ?? "",
    last_name: user.last_name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    province: user.province ?? "",
    ward: user.ward ?? "",
    address_line: user.address_line ?? "",
    role: normalizeRole(user.role) ?? "citizen",
  };
}

export const useUsersStore = create<UsersStore>()((set) => ({
  ...initialState,
  setUsers: (users) => set({ users }),
  setQuery: (query) => set({ query }),
  setRoleFilter: (roleFilter) => set({ roleFilter }),
  selectUser: (selectedUser) =>
    set({
      selectedUser,
      form: selectedUser ? toUserForm(selectedUser) : {},
    }),
  setField: (field, value) =>
    set((state) => ({ form: { ...state.form, [field]: value } })),
  setLoading: (isLoading) => set({ isLoading }),
  setSaving: (isSaving) => set({ isSaving }),
  setSavingRole: (isSavingRole) => set({ isSavingRole }),
}));

export function resetUsersStore() {
  useUsersStore.setState({
    ...initialState,
    form: {},
  });
}
