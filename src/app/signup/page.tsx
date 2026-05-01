import Link from "next/link";
import { signupAction } from "@/features/auth/actions";

type SignupPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const error = getParamValue(params?.error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Invexio</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Create account</h1>
          <p className="mt-1 text-sm text-slate-600">Start managing your inventory in one place.</p>
        </div>

        {error ? (
          <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <form action={signupAction} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              minLength={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Create account
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-slate-900 underline">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
