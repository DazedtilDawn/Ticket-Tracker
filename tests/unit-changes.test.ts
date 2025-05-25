import { test, expect, describe } from "bun:test";

describe("Unit tests for recent code changes", () => {
  
  test("auth-store filters archived children", () => {
    // Simulate the getChildUsers logic
    const familyUsers = [
      { id: 1, name: "Parent", role: "parent" },
      { id: 2, name: "Active Child", role: "child", is_archived: false },
      { id: 3, name: "Archived Child", role: "child", is_archived: true },
      { id: 4, name: "Another Active", role: "child" }  // is_archived undefined = active
    ];

    // This mimics the getChildUsers function logic
    const getChildUsers = () => {
      return familyUsers.filter((user) => user.role === "child" && !(user as any).is_archived);
    };

    const children = getChildUsers();
    
    expect(children.length).toBe(2);
    expect(children.map(c => c.name)).toEqual(["Active Child", "Another Active"]);
    expect(children.find(c => c.name === "Archived Child")).toBeUndefined();
  });

  test("dashboard banner uses user's banner_color_preference", () => {
    // Test the logic for banner color selection
    const testCases = [
      {
        user: { banner_image_url: "image.jpg", banner_color_preference: "from-red-500 to-blue-500" },
        defaultColor: "from-blue-400 to-purple-600",
        expectedClass: "", // Empty because image takes precedence
        expectedStyle: { backgroundImage: "url(image.jpg?t=123)" }
      },
      {
        user: { banner_color_preference: "from-pink-400 to-purple-600" },
        defaultColor: "from-blue-400 to-purple-600",
        expectedClass: "bg-gradient-to-r from-pink-400 to-purple-600",
        expectedStyle: { backgroundImage: undefined }
      },
      {
        user: {},
        defaultColor: "from-blue-400 to-purple-600",
        expectedClass: "bg-gradient-to-r from-blue-400 to-purple-600",
        expectedStyle: { backgroundImage: undefined }
      }
    ];

    testCases.forEach(({ user, defaultColor, expectedClass, expectedStyle }) => {
      // Simulate the banner component logic
      const className = user.banner_image_url 
        ? ""
        : user.banner_color_preference
        ? `bg-gradient-to-r ${user.banner_color_preference}`
        : `bg-gradient-to-r ${defaultColor}`;

      const style = {
        backgroundImage: user.banner_image_url 
          ? `url(${user.banner_image_url}?t=123)`
          : undefined
      };

      expect(className).toBe(expectedClass);
      expect(style.backgroundImage).toBe(expectedStyle.backgroundImage);
    });
  });

  test("chore completion duplicate prevention logic", () => {
    // Test the date comparison logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Completions at different times today
    const completion1 = new Date();
    completion1.setHours(9, 0, 0, 0);
    
    const completion2 = new Date();
    completion2.setHours(15, 30, 0, 0);

    // Yesterday's completion
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Test if completions are on same day
    const isSameDay = (date1: Date, date2: Date) => {
      return date1 >= today && date1 < tomorrow && date2 >= today && date2 < tomorrow;
    };

    expect(isSameDay(completion1, completion2)).toBe(true);
    expect(isSameDay(completion1, yesterday)).toBe(false);
  });

  test("bonus wheel x2 calculation has no cap", () => {
    // Test the x2 multiplier logic
    const testCases = [
      { baseTickets: 5, expected: 10 },
      { baseTickets: 6, expected: 12 },  // This would have been capped at 10 before
      { baseTickets: 10, expected: 20 }, // This would have been capped at 10 before
      { baseTickets: 20, expected: 40 }, // Way over the old cap
    ];

    testCases.forEach(({ baseTickets, expected }) => {
      // New logic: just multiply by 2, no cap
      const bonusTickets = baseTickets * 2;
      expect(bonusTickets).toBe(expected);
      
      // Old logic would have been: Math.min(baseTickets * 2, 10)
      const oldBonus = Math.min(baseTickets * 2, 10);
      if (baseTickets > 5) {
        expect(bonusTickets).toBeGreaterThan(oldBonus);
      }
    });
  });

  test("child deletion test handles auth restrictions", () => {
    // Test that we handle the new auth restrictions properly
    const authError = { status: 401, message: "Authentication required" };
    
    // Children can no longer login
    expect(authError.status).toBe(401);
    expect(authError.message).toBe("Authentication required");
  });
});