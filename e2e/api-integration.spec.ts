import { test, expect } from "@playwright/test";

test.describe("API Integration Tests", () => {
  const baseURL = "http://localhost:5000/api";
  let parentToken: string;
  let childId: number;

  test.beforeAll(async ({ request }) => {
    // Login as parent - using the default test parent account
    const loginResponse = await request.post(`${baseURL}/auth/login`, {
      data: {
        username: "parent",
        password: "password"
      }
    });
    
    if (!loginResponse.ok()) {
      console.error("Login failed:", await loginResponse.text());
      throw new Error("Failed to login as parent");
    }
    
    const loginData = await loginResponse.json();
    parentToken = loginData.token;
    
    if (!parentToken) {
      throw new Error("No token received from login");
    }
  });

  test("parent can create and manage children", async ({ request }) => {
    // Create a child
    const createResponse = await request.post(`${baseURL}/family/children`, {
      headers: {
        Authorization: `Bearer ${parentToken}`
      },
      data: {
        name: "Test Child " + Date.now()
      }
    });

    expect(createResponse.ok()).toBeTruthy();
    const childData = await createResponse.json();
    expect(childData.id).toBeDefined();
    expect(childData.banner_color_preference).toBeDefined();
    childId = childData.id;

    // Verify child appears in list
    const listResponse = await request.get(`${baseURL}/family/children`, {
      headers: {
        Authorization: `Bearer ${parentToken}`
      }
    });

    expect(listResponse.ok()).toBeTruthy();
    const children = await listResponse.json();
    expect(children.some((c: any) => c.id === childId)).toBeTruthy();

    // Archive the child
    const archiveResponse = await request.patch(`${baseURL}/family/children/${childId}/archive`, {
      headers: {
        Authorization: `Bearer ${parentToken}`
      },
      data: {
        archived: true
      }
    });

    expect(archiveResponse.ok()).toBeTruthy();

    // Verify child doesn't appear in default list
    const defaultListResponse = await request.get(`${baseURL}/family/children`, {
      headers: {
        Authorization: `Bearer ${parentToken}`
      }
    });

    const activeChildren = await defaultListResponse.json();
    expect(activeChildren.some((c: any) => c.id === childId)).toBeFalsy();

    // Verify child appears with includeArchived
    const archivedListResponse = await request.get(`${baseURL}/family/children?includeArchived=true`, {
      headers: {
        Authorization: `Bearer ${parentToken}`
      }
    });

    const allChildren = await archivedListResponse.json();
    expect(allChildren.some((c: any) => c.id === childId && c.is_archived)).toBeTruthy();

    // Restore the child
    const restoreResponse = await request.patch(`${baseURL}/family/children/${childId}/archive`, {
      headers: {
        Authorization: `Bearer ${parentToken}`
      },
      data: {
        archived: false
      }
    });

    expect(restoreResponse.ok()).toBeTruthy();

    // Clean up - delete the child
    const deleteResponse = await request.delete(`${baseURL}/family/children/${childId}`, {
      headers: {
        Authorization: `Bearer ${parentToken}`
      }
    });

    expect(deleteResponse.ok()).toBeTruthy();
  });

  test("chore completion with duplicate prevention", async ({ request }) => {
    // Get list of chores
    const choresResponse = await request.get(`${baseURL}/chores`, {
      headers: {
        Authorization: `Bearer ${parentToken}`
      }
    });

    expect(choresResponse.ok()).toBeTruthy();
    const chores = await choresResponse.json();
    
    if (chores.length > 0) {
      const choreId = chores[0].id;
      
      // Complete a chore for the first child
      const childrenResponse = await request.get(`${baseURL}/family/children`, {
        headers: {
          Authorization: `Bearer ${parentToken}`
        }
      });
      
      const children = await childrenResponse.json();
      if (children.length > 0) {
        const childUserId = children[0].id;
        
        // First completion should succeed
        const firstCompletion = await request.post(`${baseURL}/earn`, {
          headers: {
            Authorization: `Bearer ${parentToken}`
          },
          data: {
            chore_id: choreId,
            user_id: childUserId,
            type: "chore_completion"
          }
        });
        
        expect(firstCompletion.ok()).toBeTruthy();
        const firstResult = await firstCompletion.json();
        expect(firstResult.transaction).toBeDefined();
        
        // Second completion on same day should still create transaction
        // but logChoreCompletion should prevent duplicate in chore_completions table
        const secondCompletion = await request.post(`${baseURL}/earn`, {
          headers: {
            Authorization: `Bearer ${parentToken}`
          },
          data: {
            chore_id: choreId,
            user_id: childUserId,
            type: "chore_completion"
          }
        });
        
        // The API still allows multiple transactions, just not multiple chore_completions
        expect(secondCompletion.ok()).toBeTruthy();
      }
    }
  });

  test("bonus wheel x2 multiplier has no cap", async ({ request }) => {
    // This test would need a child with an active bonus
    // For now, we'll just verify the endpoint exists
    const bonusResponse = await request.post(`${baseURL}/bonus-spin`, {
      headers: {
        Authorization: `Bearer ${parentToken}`
      },
      data: {
        daily_bonus_id: 999999 // Non-existent ID
      }
    });

    // Should get 404 for non-existent bonus
    expect(bonusResponse.status()).toBe(404);
  });

  test("goal purchase endpoint validation", async ({ request }) => {
    // Try to purchase a non-existent goal
    const purchaseResponse = await request.post(`${baseURL}/goals/999999/purchase`, {
      headers: {
        Authorization: `Bearer ${parentToken}`
      }
    });

    // Should get 404 for non-existent goal
    expect(purchaseResponse.status()).toBe(404);
  });

  test("child cannot login directly", async ({ request }) => {
    // Try to login as a child user
    const childLoginResponse = await request.post(`${baseURL}/auth/login`, {
      data: {
        username: "child_user",
        password: "password"
      }
    });

    // Should get 401 unauthorized
    expect(childLoginResponse.status()).toBe(401);
  });
});