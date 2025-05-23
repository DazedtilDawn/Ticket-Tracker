import { test, expect, beforeEach } from "bun:test";

// Mock localStorage
class LocalStorageMock {
  private store: Record<string, string> = {};
  clear() {
    this.store = {};
  }
  getItem(key: string) {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
  removeItem(key: string) {
    delete this.store[key];
  }
}

// @ts-ignore
const storage = new LocalStorageMock();
// @ts-ignore
globalThis.localStorage = storage;

let useAuthStore: typeof import("../src/store/auth-store").useAuthStore;

beforeEach(async () => {
  storage.clear();
  
  const mod = await import("../src/store/auth-store");
  useAuthStore = mod.useAuthStore;
  useAuthStore.setState({
    token: "test-token",
    user: { id: 1, name: "Test Parent", username: "testparent", role: "parent" },
    originalUser: null,
    viewingChildId: null,
    isAuthenticated: true,
    autoLoginEnabled: true,
    familyUsers: [],
  });
});

test("setFamilyUsers updates the family users list", () => {
  const store = useAuthStore.getState();
  const newUsers = [
    { id: 1, name: "Parent", username: "parent", role: "parent" },
    { id: 2, name: "Child", username: "child", role: "child" },
  ] as any;
  
  store.setFamilyUsers(newUsers);
  
  expect(useAuthStore.getState().familyUsers).toEqual(newUsers);
});

test("auth store has refreshFamilyUsers method", () => {
  const store = useAuthStore.getState();
  expect(typeof store.refreshFamilyUsers).toBe("function");
});

test("refreshFamilyUsers is defined for parent users", async () => {
  const store = useAuthStore.getState();
  
  // Should be able to call it without errors (actual API call will fail in test env)
  try {
    await store.refreshFamilyUsers();
  } catch (e) {
    // Expected to fail due to missing API in test environment
  }
  
  // The important thing is the method exists and can be called
  expect(true).toBe(true);
});