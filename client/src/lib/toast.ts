// Implementing toast capabilities
import { useToast } from "@/hooks/use-toast";

export function showToast(
  options: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
    duration?: number;
  },
  toastFn: ReturnType<typeof useToast>["toast"],
) {
  toastFn({
    title: options.title,
    description: options.description,
    variant: options.variant || "default",
    duration: options.duration || 3000,
  });
}

export function showSuccessToast(
  toastFn: ReturnType<typeof useToast>["toast"],
  title: string,
  description?: string,
) {
  showToast({ title, description }, toastFn);
}

export function showErrorToast(
  toastFn: ReturnType<typeof useToast>["toast"],
  title: string,
  description?: string,
) {
  showToast({ title, description, variant: "destructive" }, toastFn);
}
