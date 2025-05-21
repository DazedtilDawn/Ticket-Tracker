import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";

export default function FloatingExitPill() {
  const isViewingAsChild = useAuthStore(state => state.isViewingAsChild);
  const resetChildView = useAuthStore(state => state.resetChildView);
  const [, navigate] = useLocation();

  if (!isViewingAsChild()) return null;

  const handleClick = () => {
    resetChildView();
    navigate("/");
  };

  return (
    <Button
      onClick={handleClick}
      aria-label="Return to Parent View"
      className="fixed bottom-20 left-4 z-50 rounded-full px-4 py-2 shadow backdrop-blur-md bg-background/80"
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      <span className="text-sm font-medium">Return</span>
    </Button>
  );
}
