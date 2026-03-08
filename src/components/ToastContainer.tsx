import { RiCloseFill, RiInformationFill, RiCheckboxCircleFill, RiErrorWarningFill } from "react-icons/ri";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export default function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-xl border border-white/10 min-w-[300px] transition-all duration-300 transform translate-x-0 opacity-100 ${
            toast.type === "success"
              ? "bg-zinc-900 text-spotify-green"
              : toast.type === "error"
              ? "bg-red-900/90 text-white"
              : "bg-zinc-800 text-white"
          }`}
        >
          <div className="mt-1">
            {toast.type === "success" && <RiCheckboxCircleFill className="text-xl" />}
            {toast.type === "error" && <RiErrorWarningFill className="text-xl" />}
            {toast.type === "info" && <RiInformationFill className="text-blue-400 text-xl" />}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm">{toast.title}</h4>
            <p className="text-xs opacity-90">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/50 hover:text-white transition-colors"
          >
            <RiCloseFill />
          </button>
        </div>
      ))}
    </div>
  );
}
