import { useAuthStore } from "@/store/auth-store";

/**
 * Floating panel that shows parent-only shortcuts
 * when the parent is impersonating a child.
 */
export function ParentControlPanel() {
  const { isViewingAsChild } = useAuthStore();
  if (!isViewingAsChild()) return null;

  // TODO: insert FAB / quick-action buttons
  return (
    <aside
      aria-label="Parent Controls"
      className="fixed bottom-4 right-4 z-50 rounded-lg bg-white shadow-lg p-4 border"
    >
      <p className="font-semibold mb-2">Parent controls</p>
      {/* action buttons will go here */}
    </aside>
  );
}