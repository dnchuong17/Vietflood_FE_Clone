import { create } from "zustand";

import type { AuthProfile } from "@/features/auth/types/auth";
import type { DivisionOption } from "@/features/location/api/vietnam-divisions";
import type { ChangePasswordForm } from "@/features/profile/lib/password";

export type ProfileForm = {
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  phone: string;
  province: string;
  ward: string;
  address_line: string;
};

export type PasswordFieldName = keyof ChangePasswordForm;

type ProfileStore = {
  profile: AuthProfile | null;
  form: ProfileForm;
  passwordForm: ChangePasswordForm;
  visiblePasswords: Record<PasswordFieldName, boolean>;
  isLoading: boolean;
  isSaving: boolean;
  isChangingPassword: boolean;
  selectedProvinceCode: number | null;
  provinceOptions: DivisionOption[];
  wardOptions: DivisionOption[];
  isLoadingProvinces: boolean;
  isLoadingWards: boolean;
  setProfile: (profile: AuthProfile | null) => void;
  setForm: (form: ProfileForm) => void;
  setFormField: <T extends keyof ProfileForm>(
    field: T,
    value: ProfileForm[T],
  ) => void;
  setPasswordForm: (passwordForm: ChangePasswordForm) => void;
  setPasswordField: <T extends PasswordFieldName>(
    field: T,
    value: ChangePasswordForm[T],
  ) => void;
  resetPasswordForm: () => void;
  togglePasswordVisibility: (field: PasswordFieldName) => void;
  setLoading: (isLoading: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setChangingPassword: (isChangingPassword: boolean) => void;
  setSelectedProvinceCode: (selectedProvinceCode: number | null) => void;
  setProvinceOptions: (provinceOptions: DivisionOption[]) => void;
  setWardOptions: (wardOptions: DivisionOption[]) => void;
  setLoadingProvinces: (isLoadingProvinces: boolean) => void;
  setLoadingWards: (isLoadingWards: boolean) => void;
  handleProvinceInput: (province: string) => void;
  selectProvince: (province: DivisionOption) => void;
  selectWard: (ward: DivisionOption) => void;
};

export const EMPTY_PROFILE_FORM: ProfileForm = {
  first_name: "",
  middle_name: "",
  last_name: "",
  email: "",
  phone: "",
  province: "",
  ward: "",
  address_line: "",
};

const EMPTY_PASSWORD_FORM: ChangePasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const HIDDEN_PASSWORDS: Record<PasswordFieldName, boolean> = {
  currentPassword: false,
  newPassword: false,
  confirmPassword: false,
};

function profileToForm(profile: AuthProfile | null): ProfileForm {
  if (!profile) {
    return EMPTY_PROFILE_FORM;
  }

  return {
    first_name: profile.first_name ?? "",
    middle_name: profile.middle_name ?? "",
    last_name: profile.last_name ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    province: profile.province ?? "",
    ward: profile.ward ?? "",
    address_line: profile.address_line ?? "",
  };
}

const initialState = {
  profile: null,
  form: EMPTY_PROFILE_FORM,
  passwordForm: EMPTY_PASSWORD_FORM,
  visiblePasswords: HIDDEN_PASSWORDS,
  isLoading: true,
  isSaving: false,
  isChangingPassword: false,
  selectedProvinceCode: null,
  provinceOptions: [] as DivisionOption[],
  wardOptions: [] as DivisionOption[],
  isLoadingProvinces: false,
  isLoadingWards: false,
};

export const useProfileStore = create<ProfileStore>()((set) => ({
  ...initialState,
  setProfile: (profile) =>
    set({
      profile,
      form: profileToForm(profile),
    }),
  setForm: (form) => set({ form }),
  setFormField: (field, value) =>
    set((state) => ({ form: { ...state.form, [field]: value } })),
  setPasswordForm: (passwordForm) => set({ passwordForm }),
  setPasswordField: (field, value) =>
    set((state) => ({
      passwordForm: { ...state.passwordForm, [field]: value },
    })),
  resetPasswordForm: () => set({ passwordForm: { ...EMPTY_PASSWORD_FORM } }),
  togglePasswordVisibility: (field) =>
    set((state) => ({
      visiblePasswords: {
        ...state.visiblePasswords,
        [field]: !state.visiblePasswords[field],
      },
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setSaving: (isSaving) => set({ isSaving }),
  setChangingPassword: (isChangingPassword) => set({ isChangingPassword }),
  setSelectedProvinceCode: (selectedProvinceCode) =>
    set({ selectedProvinceCode }),
  setProvinceOptions: (provinceOptions) => set({ provinceOptions }),
  setWardOptions: (wardOptions) => set({ wardOptions }),
  setLoadingProvinces: (isLoadingProvinces) => set({ isLoadingProvinces }),
  setLoadingWards: (isLoadingWards) => set({ isLoadingWards }),
  handleProvinceInput: (province) =>
    set((state) => ({
      selectedProvinceCode: null,
      wardOptions: [],
      form: {
        ...state.form,
        province,
        ward: "",
      },
    })),
  selectProvince: (province) =>
    set((state) => ({
      selectedProvinceCode: province.code,
      wardOptions: [],
      form: {
        ...state.form,
        province: province.name,
        ward: "",
      },
    })),
  selectWard: (ward) =>
    set((state) => ({
      form: {
        ...state.form,
        ward: ward.name,
      },
    })),
}));

export function resetProfileStore() {
  useProfileStore.setState({
    ...initialState,
    form: { ...EMPTY_PROFILE_FORM },
    passwordForm: { ...EMPTY_PASSWORD_FORM },
    visiblePasswords: { ...HIDDEN_PASSWORDS },
    provinceOptions: [],
    wardOptions: [],
  });
}
