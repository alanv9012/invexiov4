import Link from "next/link";
import { loginAction } from "@/features/auth/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/input";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const error = getParamValue(params?.error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card padding="lg" className="w-full max-w-md shadow-card">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Invexio</p>
          <h1 className="mt-2 text-display text-foreground">Log in</h1>
          <p className="mt-1 text-body-sm text-muted-foreground">Access your inventory dashboard.</p>
        </div>

        {error ? <Alert variant="danger" className="mb-4">{error}</Alert> : null}

        <form action={loginAction} className="space-y-4">
          <FormField label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" required />
          </FormField>

          <FormField label="Password" htmlFor="password">
            <Input id="password" name="password" type="password" required minLength={8} />
          </FormField>

          <Button type="submit" fullWidth>
            Log in
          </Button>
        </form>

        <p className="mt-4 text-body-sm text-muted-foreground">
          No account yet?{" "}
          <Link href="/signup" className="font-medium text-foreground underline">
            Sign up
          </Link>
        </p>
      </Card>
    </main>
  );
}
