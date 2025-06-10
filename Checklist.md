# TicketTracker Dashboard Streamlining Checklist <!-- Plan Approved -->

## Recently Completed Features (Archived)

### Multi-Parent Support & Refresh Token Authentication ✅ 
**Completed: June 9, 2025** - *Archived to archive.md*
- [x] **Database Schema**: Created family_parents join table with composite primary key
- [x] **Transaction Tracking**: Added performed_by_id to all transactions  
- [x] **Refresh Tokens**: Implemented 15m access tokens + 14-28d refresh tokens
- [x] **API Endpoints**: Added /api/auth/refresh, /api/auth/logout, family invite endpoints
- [x] **Frontend Integration**: Automatic token refresh with queue mechanism
- [x] **Test Suite**: Comprehensive tests for all new features
- [x] **Documentation**: Updated CLAUDE.md with patterns and troubleshooting
- [x] **Migrations**: Applied 0019_multi_parent_auth.sql and 0020_rename_delta_tickets.sql
- [x] **CI/CD**: Fixed failing bonus system integration tests and E2E server startup
- [x] **Archive**: Documented complete implementation in archive.md

*Full technical details and implementation notes in archive.md*

## Phase 1: Analysis & Context Building

- [x] **Step 1: Review Current Dashboard Structure** ✅
  - **Analysis Complete**: `dashboard.tsx` serves as unified child/parent view, `parent-dashboard.tsx` is parent-only command center
  - **Key Finding**: Current system requires parents to switch between two dashboards - unified view for child interaction, parent dashboard for management
  - **Opportunity**: Parent commands could be integrated into child views for streamlined workflow

- [x] **Step 2: Analyze Child View Management System** ✅  
  - **Analysis Complete**: `auth-store.ts` handles parent/child view switching via `switchChildView()` and `resetChildView()`
  - **Current State**: Strong foundation with `originalUser`, `viewingChildId`, and child view detection
  - **Enhancement Potential**: Context-aware UI components can leverage `isViewingAsChild()` to show parent controls

- [x] **Step 3: Document Current Parent Command Locations** ✅
  - **Parent-Only Commands in Parent Dashboard**: 
    - Chore Management: `NewChoreDialog`, chore assignment controls
    - Behavior Management: `BadBehaviorDialog`, `GoodBehaviorDialog` 
    - Product/Catalog: `AddProductDialog`, family catalog management
    - Transactions: Balance refresh, transaction oversight
    - Profile Management: Child profile image updates, banner customization
  - **Unified Dashboard Parent Features**: Some parent commands available in child view (behavior dialogs in chores section)
  - **Streamlining Opportunity**: Consolidate parent commands into context-aware components accessible from child views

## Phase 2: Enhanced Child Dashboard Header with Parent Controls

- [x] **Step 4: Create Floating Parent Control Panel Component** ✅

  - **Implementation Complete**: `client/src/components/ParentControlPanel.tsx` with collapsible design
  - **Features Added**: Context-aware visibility, good/bad behavior dialogs, new chore creation, return to parent view
  - **Integration**: Added to main dashboard with conditional rendering based on `isViewingAsChild()`
  - **Test Coverage**: Comprehensive tests for visibility, expansion, and user interactions

- [x] **Step 5: Enhance Child Dashboard Header with Context-Aware Parent Controls** ✅

  - **Implementation Complete**: Enhanced dashboard header to show child context when parent is viewing as child
  - **Features Added**: 
    - Child context chip displaying "Viewing as {childName}" with user icon
    - Quick "Exit child view" button in header for immediate return to parent view
    - Context only shows when `originalUser` exists and `viewingChild` is true
  - **Test Coverage**: Comprehensive tests covering both child context display and absence in parent mode
  - **UX Improvement**: Parents immediately see which child profile they're viewing without hunting for controls

- [x] **Step 6: Create Quick Action Bar for Common Parent Tasks** ✅
  - **Implementation Complete**: `client/src/components/QuickActionBar.tsx` with floating action buttons
  - **Features Added**:
    - Add/Remove tickets with dialog forms requiring amount and reason input
    - Mark chore complete button (placeholder for future enhancement)
    - Fixed bottom-left positioning to complement bottom-right parent control panel
    - Context-aware visibility only when parent is viewing as child
  - **Integration**: Added to dashboard with proper z-index and positioning
  - **API Integration**: Uses existing `/api/transactions` endpoint for ticket operations
  - **Test Coverage**: Comprehensive tests for visibility, accessibility, and user interactions

**Phase 2 Complete** - Enhanced Child Dashboard Header with Parent Controls ✅

## Phase 3: Smart Context-Aware UI Components

- [x] **Step 7: Enhance Chore Cards with Parent Quick Actions** ✅

  - **Implementation Complete**: Added context-aware parent action buttons to `client/src/components/chore-card.tsx`
  - **Features Added**:
    - Mark chore complete button (green) - reuses existing completion logic
    - Add tickets button (blue) - awards 1 bonus ticket with contextual reason
    - Remove tickets button (red) - deducts 1 ticket with contextual reason  
    - Context-aware visibility only when parent is viewing as child
    - Proper disabled state for completed chores
  - **API Integration**: Uses existing `/api/transactions` endpoint with appropriate transaction types
  - **User Experience**: Toast notifications for success/error feedback, colored buttons for visual distinction
  - **Test Coverage**: Comprehensive tests including API call verification and button interaction
  - **Accessibility**: Proper aria-labels and semantic button elements

- [x] **Step 8: Create Context-Aware Transaction Management** ✅

  - **Implementation Complete**: Created `TransactionRow` and `TransactionCard` components with parent controls
  - **Features Added**:
    - "Performed by" chip showing which parent created the transaction when viewing as child
    - Context-aware undo button - only shows when logged-in parent matches `performed_by_id`
    - Separate components for desktop (TransactionRow) and mobile (TransactionCard) layouts
    - Integration with existing transaction deletion/undo logic
  - **Files Modified**: 
    - `client/src/components/TransactionRow.tsx` (new desktop component)
    - `client/src/components/TransactionCard.tsx` (new mobile component)
    - `client/src/components/transactions-table.tsx` (integrated new components)
  - **User Experience**: Parents can now see who performed transactions and undo their own actions from child views
  - **Test Coverage**: Test created but React testing environment needs fixing (separate todo item)

- [ ] **Step 9: Implement Intelligent Wishlist Management**
  - (Files: `client/src/components/progress-card.tsx`, Goal: Add parent controls to approve/modify wishlist items and goals when viewing child profile)

## Phase 4: Enhanced Child Profile Self-Containment

- [ ] **Step 10: Create Child Profile Store Enhancement**

  - (Files: `client/src/store/child-profile-store.ts` (new), Goal: Create dedicated store for managing child-specific state (Bryce/Kiki profiles))

- [ ] **Step 11: Build Child-Specific Navigation Enhancement**

  - (Files: `client/src/components/layout/sidebar.tsx`, Goal: Improve child switching interface with profile previews and quick stats)

- [ ] **Step 12: Implement Child Dashboard Customization**
  - (Files: `client/src/components/child-dashboard-customizer.tsx` (new), Goal: Allow each child to have personalized dashboard layouts and themes)

## Phase 5: Parent Command Integration

- [ ] **Step 13: Create Universal Parent Command Dispatcher**

  - (Files: `client/src/lib/parent-commands.ts` (new), Goal: Centralized system for executing parent commands with child context awareness)

- [ ] **Step 14: Integrate Bad/Good Behavior Dialogs in Child View**

  - (Files: `client/src/components/bad-behavior-dialog.tsx`, `client/src/components/good-behavior-dialog.tsx`, Goal: Make behavior dialogs accessible from child dashboard with pre-selected child)

- [ ] **Step 15: Add Chore Management from Child Profile**

  - (Files: `client/src/components/new-chore-dialog.tsx`, Goal: Allow parents to create/edit chores specific to viewed child directly from child dashboard)

- [ ] **Step 16: Implement Bonus Wheel Management in Child View**
  - (Files: `client/src/components/daily-bonus-wheel.tsx`, Goal: Enable parents to trigger bonus wheels and manage bonuses from child dashboard)

## Phase 6: Mobile Optimization for Parent/Child Switching

- [ ] **Step 17: Enhance Mobile Navigation for Child Switching**

  - (Files: `client/src/components/layout/mobile-nav.tsx`, Goal: Improve mobile interface for switching between child profiles)

- [ ] **Step 18: Create Mobile Parent Control Overlay**

  - (Files: `client/src/components/mobile-parent-overlay.tsx` (new), Goal: Design mobile-friendly overlay for parent commands when viewing child profiles)

- [ ] **Step 19: Implement Gesture-Based Parent Actions**
  - (Files: `client/src/hooks/use-parent-gestures.ts` (new), Goal: Add swipe gestures for common parent actions on mobile)

## Phase 7: Real-Time Synchronization Enhancement

- [ ] **Step 20: Enhance WebSocket Integration for Child Profiles**

  - (Files: `client/src/lib/websocketClient.ts`, Goal: Improve real-time updates when switching between child profiles)

- [ ] **Step 21: Create Child Profile State Synchronization**
  - (Files: `client/src/hooks/use-child-sync.ts` (new), Goal: Ensure child profile data stays synchronized across all views)

## Phase 8: User Experience Polish

- [ ] **Step 22: Add Transition Animations for Profile Switching**

  - (Files: `client/src/components/profile-transition.tsx` (new), Goal: Create smooth animations when switching between child profiles)

- [ ] **Step 23: Implement Parent Command Feedback System**

  - (Files: `client/src/components/command-feedback.tsx` (new), Goal: Provide clear feedback when parent commands are executed from child views)

- [ ] **Step 24: Create Child Dashboard Tutorial System**
  - (Files: `client/src/components/dashboard-tutorial.tsx` (new), Goal: Add guided tour for parents on using enhanced child dashboard features)

## Phase 9: Testing & Quality Assurance

- [ ] **Step 25: Create Integration Tests for Parent/Child Switching**

  - (Files: `client/__tests__/parent-child-integration.test.tsx` (new), Goal: Ensure robust testing of enhanced parent/child interactions)

- [ ] **Step 26: Add Mobile Responsiveness Tests**

  - (Files: `client/__tests__/mobile-dashboard.test.tsx` (new), Goal: Verify mobile functionality works correctly for all new features)

- [ ] **Step 27: Implement Performance Testing for Enhanced Features**
  - (Files: `tests/performance/dashboard-performance.test.js` (new), Goal: Ensure new features don't negatively impact application performance)

## Phase 10: Documentation & Finalization

- [ ] **Step 28: Update User Documentation**

  - (Files: `README.md`, `docs/user-guide.md` (new), Goal: Document new features and improved workflows for family users)

- [ ] **Step 29: Create Development Documentation**

  - (Files: `docs/development-guide.md` (new), Goal: Document architectural changes and development patterns for future maintainers)

- [ ] **Final Review and Cleanup**
  - (Files: All modified files, Goal: Perform comprehensive testing of streamlined dashboard functionality, ensure all features work seamlessly across desktop and mobile)

# Key Features Being Implemented:

1. **Intelligent Parent Controls**: Context-aware parent commands available directly in child dashboard views
2. **Self-Contained Child Profiles**: Enhanced Bryce and Kiki profile management with individual customization
3. **Seamless Profile Switching**: Improved navigation and state management for switching between child profiles
4. **Mobile-First Parent Commands**: Optimized mobile interface for parent actions from child views
5. **Real-Time Synchronization**: Enhanced WebSocket integration for instant updates across profile switches
6. **Gesture-Based Interactions**: Intuitive mobile gestures for common parent tasks
7. **Enhanced Visual Feedback**: Clear indication of parent vs child context with appropriate UI elements

# Success Criteria:

- Parents can perform all necessary commands directly from child dashboard views
- Child profiles (Bryce/Kiki) remain self-contained with their own state management
- Mobile interface provides excellent UX for parent/child switching
- Real-time updates work seamlessly across profile switches
- No authentication complexity added (maintaining current no-auth approach)
- Performance remains optimal with enhanced features
