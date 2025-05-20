import { test, expect, beforeEach } from "bun:test";

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

// Provide localStorage before importing the store and keep a reference
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
    token: null,
    user: null,
    originalUser: null,
    viewingChildId: null,
    isAuthenticated: false,
    autoLoginEnabled: true,
    familyUsers: []
  });
});

test("logout clears familyUsers from storage", () => {
  const store = useAuthStore.getState();

  store.setFamilyUsers([
    { id: 1, name: "Parent", username: "parent", role: "parent" },
    { id: 2, name: "Child", username: "child", role: "child" }
  ] as any);

  // should have stored users
  let saved = JSON.parse(localStorage.getItem('ticket-tracker-auth') || '{}');
  expect(saved.state.familyUsers.length).toBe(2);

  store.logout();

  saved = JSON.parse(localStorage.getItem('ticket-tracker-auth') || '{}');
  expect(Array.isArray(saved.state.familyUsers)).toBe(true);
  expect(saved.state.familyUsers.length).toBe(0);
});
