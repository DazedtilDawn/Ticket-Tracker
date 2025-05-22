# Trophy System Fix Guide for AI Agent

## Root Cause Analysis
**Primary Issue:** Authentication failure on trophy-related API endpoints
- `/api/child/:childId/award-item` returns 401 Authentication required
- `/api/child/:childId/trophies` returns 401 Authentication required

## Critical Files to Fix

### 1. Award Trophy Dialog (client/src/components/award-trophy-dialog.tsx)
**Problem:** API request lacks authentication headers
**Lines 35-47:** Fix the mutation to include proper auth
```javascript
// Current broken code:
mutationFn: async () => {
  return apiRequest(`/api/child/${childId}/award-item`, {
    method: "POST",
    body: JSON.stringify({
      item_id: itemId,
      custom_note: customNote.trim() || undefined
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// Should use authenticated request similar to other mutations in the codebase
```

### 2. Trophy Room Display (client/src/components/trophy-room-display.tsx)
**Problem:** API query lacks authentication and possibly wrong endpoint
**Lines 30-35:** Fix the useQuery to use proper authenticated endpoint
```javascript
// Current code tries to fetch from /api/child/${childId}/trophies
// Verify this endpoint exists and add proper auth
```

### 3. Server Routes (server/routes.ts)
**Search for:** `app.post("/api/child/:childId/award-item"`
**Verify:** 
- Endpoint uses `parentOnly` middleware correctly
- Request body parsing works
- Storage method is called properly
- WebSocket broadcasting happens

### 4. Database Schema Confirmed
✅ `awarded_items` table exists with correct structure:
- id (integer)
- child_id (integer) 
- item_id (integer)
- awarded_by (integer)
- awarded_at (timestamp)
- custom_note (text)

## Missing Purchase Functionality
The catalog needs restoration of:
1. "Set as Goal" buttons
2. "Purchase with Tickets" functionality  
3. Integration with existing spend/goal system

## Key Reference Files for Review

### Authentication Pattern
Check other working API calls in the codebase for auth pattern:
- `client/src/lib/queryClient.ts` - See how other authenticated requests work
- Look for Bearer token or session-based auth in headers

### Working Examples to Copy
Find working mutations/queries in:
- `client/src/components/chore-management.tsx`
- `client/src/pages/parent-dashboard.tsx` 
- Any component that successfully makes authenticated API calls

### Server-Side Auth Middleware
- `server/routes.ts` - Check `auth` and `parentOnly` middleware implementation
- Verify session handling works correctly

## Quick Test Commands
```bash
# Test with proper authentication (replace with actual session/token)
curl -X POST http://localhost:5000/api/child/4/award-item \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=ACTUAL_SESSION_ID" \
  -d '{"item_id": 10, "custom_note": "Test"}'
```

## Fix Priority
1. **CRITICAL:** Fix authentication in award-trophy-dialog.tsx
2. **CRITICAL:** Fix authentication in trophy-room-display.tsx  
3. **HIGH:** Verify server endpoint exists and works
4. **MEDIUM:** Restore purchase/goal functionality to catalog
5. **LOW:** WebSocket real-time updates

## Expected Behavior After Fix
1. Parent can award trophies to children from Family Catalog
2. Awarded trophies appear immediately in child's Trophy Room
3. Real-time updates work via WebSocket
4. Purchase functionality restored alongside trophy awards