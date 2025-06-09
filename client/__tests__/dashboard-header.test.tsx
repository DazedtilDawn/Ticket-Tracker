import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Dashboard from "@/pages/dashboard";
import { useAuthStore } from "@/store/auth-store";
import { useStatsStore } from "@/store/stats-store";
import { useMobile } from "@/context/MobileContext";

// Mock all the required modules and hooks
vi.mock("@/store/auth-store", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("@/store/stats-store", () => ({
  useStatsStore: vi.fn(),
}));

vi.mock("@/context/MobileContext", () => ({
  useMobile: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({
    data: { balance: 100, chores: [] },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    refetchQueries: vi.fn(),
  })),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

describe("Dashboard header child context", () => {
  beforeEach(() => {
    // Mock mobile context
    (useMobile as unknown as vi.Mock).mockReturnValue({
      isMobile: false,
    });

    // Mock stats store
    (useStatsStore as unknown as vi.Mock).mockReturnValue({
      balance: 100,
      updateBalance: vi.fn(),
    });
  });

  it("shows child's name chip when viewing as child", () => {
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      user: { id: 4, name: "Kiki", role: "child" },
      isViewingAsChild: () => true,
      originalUser: { id: 1, name: "Parent", role: "parent" },
      setFamilyUsers: vi.fn(),
      switchChildView: vi.fn(),
      resetChildView: vi.fn(),
      getChildUsers: () => [],
      getActiveChildId: () => 4,
    });

    render(<Dashboard />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /exit child view/i })).toBeVisible();
    expect(screen.getByText(/Viewing as Kiki/i)).toBeVisible(); // chip/badge
  });

  it("does not show child context when not viewing as child", () => {
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      user: { id: 1, name: "Parent", role: "parent" },
      isViewingAsChild: () => false,
      originalUser: null,
      setFamilyUsers: vi.fn(),
      switchChildView: vi.fn(),
      resetChildView: vi.fn(),
      getChildUsers: () => [],
      getActiveChildId: () => null,
    });

    render(<Dashboard />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /exit child view/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Viewing as/i)).not.toBeInTheDocument();
  });
});