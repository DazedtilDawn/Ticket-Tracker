// Implementing toast capabilities
import { useToast } from "@/hooks/use-toast";

export function showToast(
  options: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
    duration?: number;
  },
  toastFn: ReturnType<typeof useToast>["toast"]
) {
  toastFn({
    title: options.title,
    description: options.description,
    variant: options.variant || "default",
    duration: options.duration || 3000,
  });
}

export function showSuccessToast(
  title: string,
  description?: string, 
  toastFn: ReturnType<typeof useToast>["toast"]
) {
  showToast({ title, description }, toastFn);
}

export function showErrorToast(
  title: string,
  description?: string,
  toastFn: ReturnType<typeof useToast>["toast"] 
) {
  showToast({ title, description, variant: "destructive" }, toastFn);
}
