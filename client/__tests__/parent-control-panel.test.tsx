import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { ParentControlPanel } from "@/components/ParentControlPanel";
import { useAuthStore } from "@/store/auth-store";

// Mock the dialog components
vi.mock("@/components/new-chore-dialog", () => ({
  NewChoreDialog: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/components/bad-behavior-dialog", () => ({
  BadBehaviorDialog: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/components/good-behavior-dialog", () => ({
  GoodBehaviorDialog: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/store/auth-store", () => ({
  useAuthStore: vi.fn(),
}));

describe("ParentControlPanel", () => {
  const mockResetChildView = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when viewing as child", () => {
    // mock store to simulate parent viewing child mode
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      isViewingAsChild: () => true,
      resetChildView: mockResetChildView,
      user: { id: 4, name: "Kiki" },
    });

    render(<ParentControlPanel />);
    expect(screen.getByRole("region", { name: /parent controls/i })).toBeVisible();
    expect(screen.getByText("Viewing as Kiki")).toBeInTheDocument();
  });

  it("does not render when not viewing as child", () => {
    // mock store to simulate normal parent mode
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      isViewingAsChild: () => false,
      resetChildView: mockResetChildView,
      user: { id: 1, name: "Parent" },
    });

    render(<ParentControlPanel />);
    expect(screen.queryByRole("region", { name: /parent controls/i })).not.toBeInTheDocument();
  });

  it("can be expanded to show action buttons", () => {
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      isViewingAsChild: () => true,
      resetChildView: mockResetChildView,
      user: { id: 4, name: "Kiki" },
    });

    render(<ParentControlPanel />);
    
    // Initially collapsed
    expect(screen.getByText("Parent Actions")).toBeInTheDocument();
    expect(screen.queryByText("Reward Good Behavior")).not.toBeInTheDocument();
    
    // Click expand button
    const expandButton = screen.getByRole("button", { name: /parent actions/i });
    fireEvent.click(expandButton);
    
    // Should show action buttons
    expect(screen.getByText("Reward Good Behavior")).toBeInTheDocument();
    expect(screen.getByText("Address Bad Behavior")).toBeInTheDocument();
    expect(screen.getByText("Create New Chore")).toBeInTheDocument();
  });

  it("calls resetChildView when close button is clicked", () => {
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      isViewingAsChild: () => true,
      resetChildView: mockResetChildView,
      user: { id: 4, name: "Kiki" },
    });

    render(<ParentControlPanel />);
    
    const closeButton = screen.getByRole("button", { name: "" }); // X button has no accessible name
    fireEvent.click(closeButton);
    
    expect(mockResetChildView).toHaveBeenCalledTimes(1);
  });
});