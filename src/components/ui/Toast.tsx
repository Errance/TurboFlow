import { useNavigate } from "react-router-dom";
import {
  useToastStore,
  type Toast as ToastType,
} from "../../stores/toastStore";

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const navigate = useNavigate();

  const borderColor =
    toast.type === "success"
      ? "border-l-[#2DD4BF]"
      : toast.type === "error"
        ? "border-l-[#E85A7E]"
        : "border-l-white";

  return (
    <div
      className={[
        "bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-4 py-3 shadow-lg",
        "flex items-start gap-3 border-l-4",
        borderColor,
        "animate-[slide-in-from-top_0.25s_ease-out]",
      ].join(" ")}
    >
      <p className="text-sm text-[var(--text-primary)] flex-1 min-w-0">
        {toast.message}
        {toast.cta && (
          <span className="block mt-2">
            <button
              type="button"
              onClick={() => {
                navigate(toast.cta!.route);
                removeToast(toast.id);
              }}
              className="text-sm font-medium text-[#2DD4BF] hover:text-[#2DD4BF]/90 transition-colors"
            >
              {toast.cta.label}
            </button>
          </span>
        )}
      </p>
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      className={[
        "fixed z-50 flex flex-col gap-2",
        "top-4 left-4 right-4",
        "md:top-4 md:left-auto md:right-4 md:w-auto md:max-w-sm",
      ].join(" ")}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
