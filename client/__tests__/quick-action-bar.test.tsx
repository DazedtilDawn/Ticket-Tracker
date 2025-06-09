import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { QuickActionBar } from "@/components/QuickActionBar";
import { useAuthStore } from "@/store/auth-store";

vi.mock("@/store/auth-store", () => ({
  useAuthStore: vi.fn(),
}));

describe("QuickActionBar", () => {
  it("renders when parent is viewing as child", () => {
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      isViewingAsChild: () => true,
      user: { id: 1, role: "parent" },
      originalUser: { id: 1, role: "parent" },
    });

    render(<QuickActionBar />);
    expect(screen.getByRole("button", { name: /add tickets/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /remove tickets/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /mark chore complete/i })).toBeVisible();
  });

  it("hides when not viewing as child", () => {
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      isViewingAsChild: () => false,
      user: { id: 1, role: "parent" },
      originalUser: null,
    });

    render(<QuickActionBar />);
    expect(screen.queryByRole("button", { name: /add tickets/i })).not.toBeInTheDocument();
  });
});