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
    <Button
      onClick={handleClick}
      aria-label="Return to Parent"
      className="fixed bottom-4 left-4 z-50 rounded-full p-3 shadow bg-primary text-white hover:bg-primary/90"
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
}
