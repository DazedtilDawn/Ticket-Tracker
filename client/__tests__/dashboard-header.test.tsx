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
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: any) => children,
  useQuery: vi.fn(() => ({
    data: { balance: 100, chores: [] },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isLoading: false,
    error: null,
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
  toast: vi.fn(),
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: vi.fn(() => Promise.resolve([])),
}));

// Mock child components that might cause issues
vi.mock("@/components/dashboard-banner", () => ({
  default: ({ children }: any) => <div data-testid="dashboard-banner">{children}</div>,
}));

vi.mock("@/components/child-dashboard-header", () => ({
  default: ({ activeGoal }: any) => <div data-testid="child-dashboard-header">Child Dashboard Header</div>,
}));

vi.mock("@/components/mobile-section-tabs", () => ({
  default: () => <div data-testid="mobile-section-tabs">Mobile Section Tabs</div>,
}));

// Mock other components that appear in the dashboard
vi.mock("@/components/progress-card", () => ({
  default: ({ goal, onRefresh }: any) => <div data-testid="progress-card">Progress Card</div>,
}));

vi.mock("@/components/swipeable-chore-card", () => ({
  default: ({ chore, onComplete, onBonusComplete }: any) => <div data-testid="chore-card">Chore Card</div>,
}));

vi.mock("@/components/transactions-mobile", () => ({
  default: ({ limit }: any) => <div data-testid="transactions-mobile">Transactions Mobile</div>,
}));

vi.mock("@/components/transactions-table-desktop", () => ({
  default: ({ limit }: any) => <div data-testid="transactions-desktop">Transactions Desktop</div>,
}));

vi.mock("@/components/new-chore-dialog", () => ({
  NewChoreDialog: ({ children }: any) => children,
}));

vi.mock("@/components/bad-behavior-dialog", () => ({
  BadBehaviorDialog: ({ children }: any) => children,
}));

vi.mock("@/components/good-behavior-dialog", () => ({
  GoodBehaviorDialog: ({ children }: any) => children,
}));

vi.mock("@/components/daily-bonus-wheel", () => ({
  DailyBonusWheel: () => <div data-testid="daily-bonus-wheel">Daily Bonus Wheel</div>,
}));

vi.mock("@/components/spin-prompt-modal", () => ({
  SpinPromptModal: () => null,
}));

vi.mock("@/components/child-bonus-wheel", () => ({
  ChildBonusWheel: () => null,
}));

vi.mock("@/components/purchase-dialog", () => ({
  PurchaseDialog: ({ children }: any) => children,
}));

vi.mock("@/components/ParentControlPanel", () => ({
  ParentControlPanel: () => null,
}));

vi.mock("@/components/QuickActionBar", () => ({
  QuickActionBar: () => null,
}));

vi.mock("@/components/achievement-showcase-new", () => ({
  AchievementShowcase: () => <div data-testid="achievement-showcase">Achievement Showcase</div>,
}));

// Mock WebSocket client
vi.mock("@/lib/websocketClient", () => ({
  createWebSocketConnection: vi.fn(),
  subscribeToChannel: vi.fn(() => vi.fn()),
  sendMessage: vi.fn(),
}));

// Mock date-fns format function
vi.mock("date-fns", () => ({
  format: vi.fn(() => "Monday, January 1, 2024"),
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

  it("shows child context when parent is viewing as child", () => {
    // Set up parent viewing as child scenario
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      user: { id: 4, name: "Kiki", role: "child" }, // Current viewed user
      isViewingAsChild: () => true,
      originalUser: { id: 1, name: "Parent", role: "parent" }, // Original parent user
      setFamilyUsers: vi.fn(),
      switchChildView: vi.fn(),
      resetChildView: vi.fn(),
      getChildUsers: () => [],
      getActiveChildId: () => 4,
    });

    render(<Dashboard />);
    // When parent is viewing as child, Dashboard renders differently
    // DashboardBanner is shown instead of the regular header
    expect(screen.getByTestId("dashboard-banner")).toBeInTheDocument();
    // Child dashboard header should be shown
    expect(screen.getByTestId("child-dashboard-header")).toBeInTheDocument();
    // No "Dashboard" heading text when viewing as child
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
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