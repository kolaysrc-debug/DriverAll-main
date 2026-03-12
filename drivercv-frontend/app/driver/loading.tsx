export default function DriverLoading() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-700 border-t-emerald-400" />
        <span className="text-xs text-slate-500">Yükleniyor…</span>
      </div>
    </div>
  );
}
