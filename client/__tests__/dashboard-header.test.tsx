import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Dashboard from "@/pages/dashboard";
import { useAuthStore } from "@/store/auth-store";

vi.mock("@/store/auth-store", () => ({
  useAuthStore: vi.fn(),
}));

describe("Dashboard header child context", () => {
  it("shows child's name chip when viewing as child", () => {
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      isViewingAsChild: () => true,
      user: { id: 4, name: "Kiki" },
      resetChildView: vi.fn(),
    });

    render(<Dashboard />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /exit child view/i })).toBeVisible();
    expect(screen.getByText(/Kiki/i)).toBeVisible(); // chip/badge
  });
});