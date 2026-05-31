import { AuthFormCard } from "@/features/auth/components/auth-form-card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = {
  title: "Sign in | VietFlood Insight",
};

export default function LoginPage() {
  return (
    <AuthFormCard
      title="Sign in"
      description="Access VietFlood with a citizen, relief, or admin account."
    >
      <LoginForm />
    </AuthFormCard>
  );
}
