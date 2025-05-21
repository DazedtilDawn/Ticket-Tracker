import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";

export default function FloatingExitFab() {
  const viewingChildId = useAuthStore(s => s.viewingChildId);
  const resetChildView = useAuthStore(s => s.resetChildView);
  const [, navigate] = useLocation();

  if (!viewingChildId) return null;

  const handleClick = () => {
    resetChildView();
    navigate("/");
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Return to parent"
      className="fixed bottom-4 left-4 bg-amber-200 text-amber-900 rounded-full shadow-lg px-3 py-2 flex items-center gap-1 hover:bg-amber-300 focus-visible:outline transition-all"
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden sm:inline">Parent</span>
    </button>
  );
}
