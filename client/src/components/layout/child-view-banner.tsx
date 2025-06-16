import { useAuthStore } from "@/store/auth-store";

export default function ChildViewBanner() {
  const { isViewingAsChild, resetChildView } = useAuthStore();
  const viewingChild = isViewingAsChild();

  if (!viewingChild) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between bg-yellow-50 border-b border-yellow-200 text-xs text-yellow-900 px-3 py-1">
      <span>You are viewing as child</span>
      <button className="font-semibold underline" onClick={resetChildView}>
        Return to Parent
      </button>
    </div>
  );
}
