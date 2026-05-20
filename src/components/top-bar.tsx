import { logoutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-page-x py-3 md:px-page-x">
      <div>
        <p className="text-caption text-muted-foreground">Welcome back</p>
        <h1 className="text-lg font-semibold text-foreground md:text-xl">Invexio Dashboard</h1>
      </div>
      <form action={logoutAction}>
        <Button type="submit" variant="secondary" size="sm">
          Log out
        </Button>
      </form>
    </header>
  );
}
