import { AuthFormCard } from "@/features/auth/components/auth-form-card";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata = {
  title: "Đăng ký | VietFlood",
};

export default function RegisterPage() {
  return (
    <AuthFormCard
      mode="register"
      title="Tạo tài khoản"
      description="Tạo tài khoản người dân để báo cáo tình hình và nhận hỗ trợ khi cần."
    >
      <RegisterForm />
    </AuthFormCard>
  );
}
