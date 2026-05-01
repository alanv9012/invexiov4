export function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-6">
      <div>
        <p className="text-sm text-slate-500">Welcome back</p>
        <h1 className="text-lg font-semibold text-slate-900 md:text-xl">Invexio Dashboard</h1>
      </div>
      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
        Starter UI
      </div>
    </header>
  );
}
