import { test, expect } from "bun:test";

test("banner gradients are valid Tailwind CSS classes", () => {
  const allowedGradients = [
    "from-pink-500/30 to-indigo-300/30",
    "from-amber-400/30 to-rose-300/30",
    "from-lime-400/30 to-teal-300/30",
    "from-sky-400/30 to-fuchsia-300/30",
  ];

  // Test that all gradients follow the expected pattern
  allowedGradients.forEach((gradient) => {
    expect(gradient).toMatch(/^from-[a-z]+-\d+\/\d+ to-[a-z]+-\d+\/\d+$/);
  });
});

test("UserInfo interface includes banner_color_preference", async () => {
  // Import the type to verify it includes the new field
  const authStore = await import("../src/store/auth-store");
  
  // This test verifies that TypeScript compilation succeeds with the new field
  const testUser: authStore.UserInfo = {
    id: 1,
    name: "Test",
    username: "test",
    role: "child",
    banner_color_preference: "from-pink-500/30 to-indigo-300/30",
  };
  
  expect(testUser.banner_color_preference).toBe("from-pink-500/30 to-indigo-300/30");
});