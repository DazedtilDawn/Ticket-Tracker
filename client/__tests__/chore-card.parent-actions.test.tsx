import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ChoreCard from "@/components/chore-card";
import { useAuthStore } from "@/store/auth-store";

vi.mock("@/store/auth-store", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("@/context/MobileContext", () => ({
  useMobile: vi.fn(() => ({ isMobile: false })),
}));

const fakeChore = {
  id: 1,
  name: "Clean Room",
  description: "Clean and organize your bedroom",
  base_tickets: 3,
  tier: "common",
  is_active: true,
  completed: false,
};

describe("ChoreCard parent quick actions", () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows parent action buttons when viewing as child", () => {
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      isViewingAsChild: () => true,
      user: { id: 4, name: "Kiki", role: "child" },
      originalUser: { id: 1, role: "parent" },
    });

    render(<ChoreCard chore={fakeChore} onComplete={mockOnComplete} />);
    expect(screen.getByRole("button", { name: /mark complete/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /add tickets/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /remove tickets/i })).toBeVisible();
  });

  it("hides parent action buttons in normal child mode", () => {
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      isViewingAsChild: () => false,
      user: { id: 4, name: "Kiki", role: "child" },
      originalUser: null,
    });

    render(<ChoreCard chore={fakeChore} onComplete={mockOnComplete} />);
    expect(screen.queryByRole("button", { name: /mark complete/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /add tickets/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /remove tickets/i })).toBeNull();
  });
});