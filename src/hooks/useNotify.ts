import { toast, ToastOptions, Id } from "react-toastify";

const defaultOptions: ToastOptions = {
  position: "bottom-left",
  autoClose: 5000,
  closeOnClick: true,
  pauseOnHover: true,
  style: {
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    fontSize: "14px",
    fontWeight: "500",
    color: "white",
  },
};

let activeToastId: Id | null = null;

export default function useNotify() {
  const show = (type: "success" | "error", message: string) => {
    if (activeToastId !== null) toast.dismiss(activeToastId);
    activeToastId = toast[type](message, defaultOptions);
  };

  return {
    success: (message: string) => show("success", message),
    error: (message: string) => show("error", message),
  };
}
