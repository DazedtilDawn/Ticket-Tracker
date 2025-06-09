import { useAuthStore } from "@/store/auth-store";

/** TODO: floating bar with quick parent actions */
export function QuickActionBar() {
  const { isViewingAsChild } = useAuthStore();
  if (!isViewingAsChild()) return null;

  return (
    <div aria-label="Quick Parent Actions" />
  );
}