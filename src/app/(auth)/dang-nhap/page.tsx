import { AuthFormCard } from "@/features/auth/components/auth-form-card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = {
  title: "Đăng nhập | VietFlood",
};

export default function LoginPage() {
  return (
    <AuthFormCard
      mode="login"
      title="Đăng nhập"
      description="Tiếp tục theo dõi thông tin và quản lý hoạt động của bạn trên VietFlood."
    >
      <LoginForm />
    </AuthFormCard>
  );
}
