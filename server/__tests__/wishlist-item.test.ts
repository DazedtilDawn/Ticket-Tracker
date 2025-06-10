import { vi } from "vitest";
import request from "supertest";
import app from "@/server";           // Express app
import * as db from "@/storage/wishlist";

vi.mock("@/storage/wishlist", () => ({
  createWishlistItem: vi.fn(),
}));

describe("Wishlist API", () => {
  it("creates wishlist item for child", async () => {
    const mockItem = { id: 1, user_id: 4, product_id: 55, progress: 0 };
    (db.createWishlistItem as unknown as vi.Mock).mockResolvedValue(mockItem);

    const res = await request(app)
      .post("/api/wishlist")
      .send({ userId: 4, productId: 55 });

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(mockItem);
  });
});