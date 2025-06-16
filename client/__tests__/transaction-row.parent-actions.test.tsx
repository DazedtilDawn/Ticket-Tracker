import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { TransactionRow } from "@/components/TransactionRow";
import { useAuthStore } from "@/store/auth-store";
import { apiRequest } from "@/lib/queryClient";

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

const fakeTransaction = {
  id: 123,
  user_id: 4,
  type: "earn",
  delta: 5,
  source: "chore",
  note: "Completed: Clean Room",
  created_at: "2024-01-15T10:30:00Z",
  performed_by_id: 1, // Parent ID who performed this action
  performed_by: {
    id: 1,
    name: "Mom",
    role: "parent"
  }
};

describe("TransactionRow parent actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 'Performed by' chip when parent is viewing as child", () => {
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      isViewingAsChild: () => true,
      user: { id: 4, name: "Kiki", role: "child" },
      originalUser: { id: 1, name: "Mom", role: "parent" },
    });

    render(
      <table>
        <tbody>
          <TransactionRow transaction={fakeTransaction} onDelete={vi.fn()} />
        </tbody>
      </table>
    );
    
    expect(screen.getByText("Performed by Mom")).toBeVisible();
  });

  it("shows undo button when logged-in parent matches performed_by_id", () => {
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      isViewingAsChild: () => true,
      user: { id: 4, name: "Kiki", role: "child" },
      originalUser: { id: 1, name: "Mom", role: "parent" }, // Same as performed_by_id
    });

    render(
      <table>
        <tbody>
          <TransactionRow transaction={fakeTransaction} onDelete={vi.fn()} />
        </tbody>
      </table>
    );
    
    expect(screen.getByRole("button", { name: /undo/i })).toBeVisible();
  });

  it("hides undo button when different parent performed the transaction", () => {
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      isViewingAsChild: () => true,
      user: { id: 4, name: "Kiki", role: "child" },
      originalUser: { id: 2, name: "Dad", role: "parent" }, // Different from performed_by_id
    });

    render(
      <table>
        <tbody>
          <TransactionRow transaction={fakeTransaction} onDelete={vi.fn()} />
        </tbody>
      </table>
    );
    
    expect(screen.queryByRole("button", { name: /undo/i })).toBeNull();
  });

  it("calls onDelete when undo button is clicked", () => {
    const mockOnDelete = vi.fn();
    
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      isViewingAsChild: () => true,
      user: { id: 4, name: "Kiki", role: "child" },
      originalUser: { id: 1, name: "Mom", role: "parent" },
    });

    render(
      <table>
        <tbody>
          <TransactionRow transaction={fakeTransaction} onDelete={mockOnDelete} />
        </tbody>
      </table>
    );
    
    const undoButton = screen.getByRole("button", { name: /undo/i });
    fireEvent.click(undoButton);

    expect(mockOnDelete).toHaveBeenCalledWith(123);
  });

  it("does not show parent controls in normal child mode", () => {
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      isViewingAsChild: () => false,
      user: { id: 4, name: "Kiki", role: "child" },
      originalUser: null,
    });

    render(
      <table>
        <tbody>
          <TransactionRow transaction={fakeTransaction} onDelete={vi.fn()} />
        </tbody>
      </table>
    );
    
    expect(screen.queryByText("Performed by Mom")).toBeNull();
    expect(screen.queryByRole("button", { name: /undo/i })).toBeNull();
  });
});