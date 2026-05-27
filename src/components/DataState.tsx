import { AlertTriangle, Loader2 } from "lucide-react";

export function LoadingState({ label = "Veriler yukleniyor" }: { label?: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorState({ message = "API'ye erisilemiyor. Servis durumunu kontrol edin." }: { message?: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm text-red-700">
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
