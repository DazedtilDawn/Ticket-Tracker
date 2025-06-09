import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { ParentControlPanel } from "@/components/ParentControlPanel";
import { useAuthStore } from "@/store/auth-store";

vi.mock("@/store/auth-store", () => ({
  useAuthStore: vi.fn(),
}));

describe("ParentControlPanel", () => {
  it("renders when viewing as child", () => {
    // mock store to simulate parent viewing child mode
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      isViewingAsChild: () => true,
    });

    render(<ParentControlPanel />);
    expect(screen.getByRole("region", { name: /parent controls/i })).toBeVisible();
  });

  it("does not render when not viewing as child", () => {
    // mock store to simulate normal parent mode
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      isViewingAsChild: () => false,
    });

    render(<ParentControlPanel />);
    expect(screen.queryByRole("region", { name: /parent controls/i })).not.toBeInTheDocument();
  });
});