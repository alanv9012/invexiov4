import { LoginForm } from "@/features/auth/login-form";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card padding="lg" className="w-full max-w-md animate-page-enter shadow-card">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Invexio</p>
          <h1 className="mt-2 text-display text-foreground">Log in</h1>
          <p className="mt-1 text-body-sm text-muted-foreground">Access your inventory dashboard.</p>
        </div>

        <LoginForm />
      </Card>
    </main>
  );
}
