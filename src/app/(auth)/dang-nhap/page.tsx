import { AuthFormCard } from "@/features/auth/components/auth-form-card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = {
  title: "Đăng nhập | VietFlood",
};

export default function LoginPage() {
  return (
    <AuthFormCard
      title="Đăng nhập"
      description="Truy cập VietFlood bằng tài khoản người dân, đội cứu trợ hoặc quản trị viên."
    >
      <LoginForm />
    </AuthFormCard>
  );
}
