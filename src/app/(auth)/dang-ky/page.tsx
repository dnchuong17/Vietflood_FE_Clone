import { AuthFormCard } from "@/features/auth/components/auth-form-card";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata = {
  title: "Đăng ký | VietFlood",
};

export default function RegisterPage() {
  return (
    <AuthFormCard
      title="Tạo tài khoản người dân"
      description="Đăng ký để tạo báo cáo, xem báo cáo của bạn và chia sẻ vị trí trực tiếp khi cần."
    >
      <RegisterForm />
    </AuthFormCard>
  );
}
