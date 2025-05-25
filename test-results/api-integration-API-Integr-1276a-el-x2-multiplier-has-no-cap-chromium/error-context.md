# Test info

- Name: API Integration Tests >> bonus wheel x2 multiplier has no cap
- Location: /home/runner/workspace/tests/api-integration.spec.ts:164:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 404
Received: 401
    at /home/runner/workspace/tests/api-integration.spec.ts:177:36
```

# Test source

```ts
   77 |     });
   78 |
   79 |     const allChildren = await archivedListResponse.json();
   80 |     expect(allChildren.some((c: any) => c.id === childId && c.is_archived)).toBeTruthy();
   81 |
   82 |     // Restore the child
   83 |     const restoreResponse = await request.patch(`${baseURL}/family/children/${childId}/archive`, {
   84 |       headers: {
   85 |         Authorization: `Bearer ${parentToken}`
   86 |       },
   87 |       data: {
   88 |         archived: false
   89 |       }
   90 |     });
   91 |
   92 |     expect(restoreResponse.ok()).toBeTruthy();
   93 |
   94 |     // Clean up - delete the child
   95 |     const deleteResponse = await request.delete(`${baseURL}/family/children/${childId}`, {
   96 |       headers: {
   97 |         Authorization: `Bearer ${parentToken}`
   98 |       }
   99 |     });
  100 |
  101 |     expect(deleteResponse.ok()).toBeTruthy();
  102 |   });
  103 |
  104 |   test("chore completion with duplicate prevention", async ({ request }) => {
  105 |     // Get list of chores
  106 |     const choresResponse = await request.get(`${baseURL}/chores`, {
  107 |       headers: {
  108 |         Authorization: `Bearer ${parentToken}`
  109 |       }
  110 |     });
  111 |
  112 |     expect(choresResponse.ok()).toBeTruthy();
  113 |     const chores = await choresResponse.json();
  114 |     
  115 |     if (chores.length > 0) {
  116 |       const choreId = chores[0].id;
  117 |       
  118 |       // Complete a chore for the first child
  119 |       const childrenResponse = await request.get(`${baseURL}/family/children`, {
  120 |         headers: {
  121 |           Authorization: `Bearer ${parentToken}`
  122 |         }
  123 |       });
  124 |       
  125 |       const children = await childrenResponse.json();
  126 |       if (children.length > 0) {
  127 |         const childUserId = children[0].id;
  128 |         
  129 |         // First completion should succeed
  130 |         const firstCompletion = await request.post(`${baseURL}/earn`, {
  131 |           headers: {
  132 |             Authorization: `Bearer ${parentToken}`
  133 |           },
  134 |           data: {
  135 |             chore_id: choreId,
  136 |             user_id: childUserId,
  137 |             type: "chore_completion"
  138 |           }
  139 |         });
  140 |         
  141 |         expect(firstCompletion.ok()).toBeTruthy();
  142 |         const firstResult = await firstCompletion.json();
  143 |         expect(firstResult.transaction).toBeDefined();
  144 |         
  145 |         // Second completion on same day should still create transaction
  146 |         // but logChoreCompletion should prevent duplicate in chore_completions table
  147 |         const secondCompletion = await request.post(`${baseURL}/earn`, {
  148 |           headers: {
  149 |             Authorization: `Bearer ${parentToken}`
  150 |           },
  151 |           data: {
  152 |             chore_id: choreId,
  153 |             user_id: childUserId,
  154 |             type: "chore_completion"
  155 |           }
  156 |         });
  157 |         
  158 |         // The API still allows multiple transactions, just not multiple chore_completions
  159 |         expect(secondCompletion.ok()).toBeTruthy();
  160 |       }
  161 |     }
  162 |   });
  163 |
  164 |   test("bonus wheel x2 multiplier has no cap", async ({ request }) => {
  165 |     // This test would need a child with an active bonus
  166 |     // For now, we'll just verify the endpoint exists
  167 |     const bonusResponse = await request.post(`${baseURL}/bonus-spin`, {
  168 |       headers: {
  169 |         Authorization: `Bearer ${parentToken}`
  170 |       },
  171 |       data: {
  172 |         daily_bonus_id: 999999 // Non-existent ID
  173 |       }
  174 |     });
  175 |
  176 |     // Should get 404 for non-existent bonus
> 177 |     expect(bonusResponse.status()).toBe(404);
      |                                    ^ Error: expect(received).toBe(expected) // Object.is equality
  178 |   });
  179 |
  180 |   test("goal purchase endpoint validation", async ({ request }) => {
  181 |     // Try to purchase a non-existent goal
  182 |     const purchaseResponse = await request.post(`${baseURL}/goals/999999/purchase`, {
  183 |       headers: {
  184 |         Authorization: `Bearer ${parentToken}`
  185 |       }
  186 |     });
  187 |
  188 |     // Should get 404 for non-existent goal
  189 |     expect(purchaseResponse.status()).toBe(404);
  190 |   });
  191 |
  192 |   test("child cannot login directly", async ({ request }) => {
  193 |     // Try to login as a child user
  194 |     const childLoginResponse = await request.post(`${baseURL}/auth/login`, {
  195 |       data: {
  196 |         username: "child_user",
  197 |         password: "password"
  198 |       }
  199 |     });
  200 |
  201 |     // Should get 401 unauthorized
  202 |     expect(childLoginResponse.status()).toBe(401);
  203 |   });
  204 | });
```