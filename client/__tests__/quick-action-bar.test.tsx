import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { QuickActionBar } from "@/components/QuickActionBar";
import { useAuthStore } from "@/store/auth-store";

vi.mock("@/store/auth-store", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: vi.fn(),
}));

describe("QuickActionBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when parent is viewing as child", () => {
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      isViewingAsChild: () => true,
      user: { id: 4, name: "Kiki", role: "child" },
    });

    render(<QuickActionBar />);
    expect(screen.getByRole("button", { name: /add tickets/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /remove tickets/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /mark chore complete/i })).toBeVisible();
  });

  it("hides when not viewing as child", () => {
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      isViewingAsChild: () => false,
      user: { id: 1, name: "Parent", role: "parent" },
    });

    render(<QuickActionBar />);
    expect(screen.queryByRole("button", { name: /add tickets/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remove tickets/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark chore complete/i })).not.toBeInTheDocument();
  });

  it("shows quick action bar container with correct accessibility", () => {
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      isViewingAsChild: () => true,
      user: { id: 4, name: "Kiki", role: "child" },
    });

    render(<QuickActionBar />);
    expect(screen.getByLabelText("Quick Parent Actions")).toBeInTheDocument();
  });
});