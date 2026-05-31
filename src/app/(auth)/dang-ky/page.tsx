import { AuthFormCard } from "@/features/auth/components/auth-form-card";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata = {
  title: "Register | VietFlood Insight",
};

export default function RegisterPage() {
  return (
    <AuthFormCard
      title="Create citizen account"
      description="Register to create reports, view your reports, and share live location when needed."
    >
      <RegisterForm />
    </AuthFormCard>
  );
}
