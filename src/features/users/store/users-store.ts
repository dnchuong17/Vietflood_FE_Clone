import { create } from "zustand";

import { normalizeRole } from "../../auth/lib/roles";
import type { FloodReport } from "../../reports/api/reports";
import type { ManagedUser, UserUpdateValues } from "../api/users";

type UsersStore = {
  users: ManagedUser[];
  query: string;
  roleFilter: "all" | string;
  selectedUser: ManagedUser | null;
  selectedUserReports: FloodReport[];
  form: UserUpdateValues;
  lastSyncedAt: string | null;
  isLoading: boolean;
  isSaving: boolean;
  isSavingRole: boolean;
  isLoadingSelectedUserReports: boolean;
  selectedUserReportsError: string | null;
  setUsers: (users: ManagedUser[]) => void;
  setQuery: (query: string) => void;
  setRoleFilter: (roleFilter: "all" | string) => void;
  selectUser: (user: ManagedUser | null) => void;
  setSelectedUserReports: (reports: FloodReport[]) => void;
  setLoadingSelectedUserReports: (isLoading: boolean) => void;
  setSelectedUserReportsError: (error: string | null) => void;
  setLastSyncedAt: (lastSyncedAt: string | null) => void;
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
  selectedUserReports: [] as FloodReport[],
  form: {} as UserUpdateValues,
  lastSyncedAt: null,
  isLoading: true,
  isSaving: false,
  isSavingRole: false,
  isLoadingSelectedUserReports: false,
  selectedUserReportsError: null,
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
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
  selectUser: (selectedUser) =>
    set({
      selectedUser,
      form: selectedUser ? toUserForm(selectedUser) : {},
      selectedUserReports: [],
      selectedUserReportsError: null,
      isLoadingSelectedUserReports: false,
    }),
  setSelectedUserReports: (selectedUserReports) =>
    set({ selectedUserReports }),
  setLoadingSelectedUserReports: (isLoadingSelectedUserReports) =>
    set({ isLoadingSelectedUserReports }),
  setSelectedUserReportsError: (selectedUserReportsError) =>
    set({ selectedUserReportsError }),
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
    selectedUserReports: [],
    selectedUserReportsError: null,
  });
}
