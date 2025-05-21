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
      className="group fixed bottom-20 left-4 z-50 rounded-full px-3 py-2 shadow backdrop-blur-md bg-background/80 flex items-center gap-1"
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden group-hover:inline group-focus-visible:inline sm:inline text-sm font-medium ml-1">
        Parent View
      </span>
    </Button>
  );
}
