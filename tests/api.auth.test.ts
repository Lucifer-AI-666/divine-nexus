import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  getSessionToken: vi.fn().mockResolvedValue(null),
  setSessionToken: vi.fn(),
  setUserInfo: vi.fn(),
}));

vi.mock("../lib/_core/auth", () => auth);
vi.mock("react-native", () => ({ Platform: { OS: "ios" } }));

describe("native API authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            app_session_id: "session-token",
            user: {
              id: 7,
              openId: "local_7",
              name: "Ada",
              email: "ada@example.com",
              loginMethod: "password",
              lastSignedIn: "2026-01-02T03:04:05.000Z",
            },
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
  });

  it("stores the returned user profile with the session token", async () => {
    const { login } = await import("../lib/_core/api");

    await login("ada@example.com", "password123");

    expect(auth.setSessionToken).toHaveBeenCalledWith("session-token");
    expect(auth.setUserInfo).toHaveBeenCalledWith({
      id: 7,
      openId: "local_7",
      name: "Ada",
      email: "ada@example.com",
      loginMethod: "password",
      lastSignedIn: new Date("2026-01-02T03:04:05.000Z"),
    });
  });
});
