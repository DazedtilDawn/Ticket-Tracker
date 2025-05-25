# Test info

- Name: API Integration Tests >> parent can create and manage children
- Location: /home/runner/workspace/tests/api-integration.spec.ts:22:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
    at /home/runner/workspace/tests/api-integration.spec.ts:33:33
```

# Test source

```ts
   1 | import { test, expect } from "@playwright/test";
   2 |
   3 | test.describe("API Integration Tests", () => {
   4 |   const baseURL = "http://localhost:5000/api";
   5 |   let parentToken: string;
   6 |   let childId: number;
   7 |
   8 |   test.beforeAll(async ({ request }) => {
   9 |     // Login as parent
   10 |     const loginResponse = await request.post(`${baseURL}/auth/login`, {
   11 |       data: {
   12 |         username: "parent",
   13 |         password: "password"
   14 |       }
   15 |     });
   16 |     
   17 |     expect(loginResponse.ok()).toBeTruthy();
   18 |     const loginData = await loginResponse.json();
   19 |     parentToken = loginData.token;
   20 |   });
   21 |
   22 |   test("parent can create and manage children", async ({ request }) => {
   23 |     // Create a child
   24 |     const createResponse = await request.post(`${baseURL}/family/children`, {
   25 |       headers: {
   26 |         Authorization: `Bearer ${parentToken}`
   27 |       },
   28 |       data: {
   29 |         name: "Test Child " + Date.now()
   30 |       }
   31 |     });
   32 |
>  33 |     expect(createResponse.ok()).toBeTruthy();
      |                                 ^ Error: expect(received).toBeTruthy()
   34 |     const childData = await createResponse.json();
   35 |     expect(childData.id).toBeDefined();
   36 |     expect(childData.banner_color_preference).toBeDefined();
   37 |     childId = childData.id;
   38 |
   39 |     // Verify child appears in list
   40 |     const listResponse = await request.get(`${baseURL}/family/children`, {
   41 |       headers: {
   42 |         Authorization: `Bearer ${parentToken}`
   43 |       }
   44 |     });
   45 |
   46 |     expect(listResponse.ok()).toBeTruthy();
   47 |     const children = await listResponse.json();
   48 |     expect(children.some((c: any) => c.id === childId)).toBeTruthy();
   49 |
   50 |     // Archive the child
   51 |     const archiveResponse = await request.patch(`${baseURL}/family/children/${childId}/archive`, {
   52 |       headers: {
   53 |         Authorization: `Bearer ${parentToken}`
   54 |       },
   55 |       data: {
   56 |         archived: true
   57 |       }
   58 |     });
   59 |
   60 |     expect(archiveResponse.ok()).toBeTruthy();
   61 |
   62 |     // Verify child doesn't appear in default list
   63 |     const defaultListResponse = await request.get(`${baseURL}/family/children`, {
   64 |       headers: {
   65 |         Authorization: `Bearer ${parentToken}`
   66 |       }
   67 |     });
   68 |
   69 |     const activeChildren = await defaultListResponse.json();
   70 |     expect(activeChildren.some((c: any) => c.id === childId)).toBeFalsy();
   71 |
   72 |     // Verify child appears with includeArchived
   73 |     const archivedListResponse = await request.get(`${baseURL}/family/children?includeArchived=true`, {
   74 |       headers: {
   75 |         Authorization: `Bearer ${parentToken}`
   76 |       }
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
```