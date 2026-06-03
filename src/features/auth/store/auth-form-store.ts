import { create } from "zustand";

export type LoginFormState = {
  loginName: string;
  secret: string;
};

export type RegisterFormState = {
  username: string;
  password: string;
  email: string;
  phone: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  province: string;
  ward: string;
  address_line: string;
};

type AuthFormStoreState = {
  login: LoginFormState;
  register: RegisterFormState;
  isLoginSubmitting: boolean;
  isRegisterSubmitting: boolean;
};

type AuthFormStore = AuthFormStoreState & {
  setLoginField: (field: keyof LoginFormState, value: string) => void;
  setRegisterField: (field: keyof RegisterFormState, value: string) => void;
  setLoginSubmitting: (isSubmitting: boolean) => void;
  setRegisterSubmitting: (isSubmitting: boolean) => void;
  resetLoginForm: () => void;
  resetRegisterForm: () => void;
};

export function createInitialLoginFormState(): LoginFormState {
  return {
    loginName: "",
    secret: "",
  };
}

export function createInitialRegisterFormState(): RegisterFormState {
  return {
    username: "",
    password: "",
    email: "",
    phone: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    province: "",
    ward: "",
    address_line: "",
  };
}

export function createInitialAuthFormState(): AuthFormStoreState {
  return {
    login: createInitialLoginFormState(),
    register: createInitialRegisterFormState(),
    isLoginSubmitting: false,
    isRegisterSubmitting: false,
  };
}

const initialState = createInitialAuthFormState();

export const useAuthFormStore = create<AuthFormStore>()((set) => ({
  ...initialState,
  setLoginField: (field, value) =>
    set((state) => ({
      login: {
        ...state.login,
        [field]: value,
      },
    })),
  setRegisterField: (field, value) =>
    set((state) => ({
      register: {
        ...state.register,
        [field]: value,
      },
    })),
  setLoginSubmitting: (isLoginSubmitting) => set({ isLoginSubmitting }),
  setRegisterSubmitting: (isRegisterSubmitting) => set({ isRegisterSubmitting }),
  resetLoginForm: () =>
    set({
      login: createInitialLoginFormState(),
      isLoginSubmitting: false,
    }),
  resetRegisterForm: () =>
    set({
      register: createInitialRegisterFormState(),
      isRegisterSubmitting: false,
    }),
}));

export function resetAuthFormStore() {
  useAuthFormStore.setState(createInitialAuthFormState());
}
