import express from "express";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

process.env.JWT_SECRET = "test-secret-for-vitest";
process.env.OWNER_EMAIL = "owner@example.com";
process.env.PASSWORD_ENROLLMENT_TOKENS = JSON.stringify({
  "legacy@example.com": "legacy-enrollment-token-for-test-0001",
  "owner@example.com": "owner-bootstrap-token-for-test-00000001",
});
process.env.TRUST_PROXY = "127.0.0.1";

type Row = Record<string, any>;
const rows: Row[] = [];

vi.mock("../server/db", () => {
  class DuplicateEmailError extends Error {}
  return {
    DuplicateEmailError,
    getUserByEmail: async (email: string) => rows.find((r) => r.email === email),
    getUserByOpenId: async (openId: string) => rows.find((r) => r.openId === openId),
    upsertUser: async () => {},
    setExistingUserPassword: async (email: string, passwordHash: string, isAdmin: boolean) => {
      const row = rows.find((r) => r.email === email);
      if (!row || row.passwordHash) return undefined;
      row.passwordHash = passwordHash;
      row.loginMethod = "password";
      if (isAdmin) row.role = "admin";
      return row;
    },
    createLocalUser: async (input: Row) => {
      if (rows.some((r) => r.email === input.email)) throw new DuplicateEmailError();
      const row = {
        id: rows.length + 1,
        openId: `local_${rows.length + 1}`,
        loginMethod: "password",
        role: input.isAdmin ? "admin" : "user",
        lastSignedIn: new Date(),
        ...input,
      };
      rows.push(row);
      return row;
    },
  };
});

describe("local auth routes", () => {
  let server: Server;
  let base: string;

  const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });

  beforeAll(async () => {
    const { registerAuthRoutes } = await import("../server/_core/auth");
    const { ENV } = await import("../server/_core/env");
    const app = express();
    app.set("trust proxy", ENV.trustedProxies.length ? ENV.trustedProxies : false);
    app.use(express.json());
    registerAuthRoutes(app);
    server = app.listen(0);
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(() => {
    server.close();
  });

  it("registers, rejects duplicates, logs in and resolves /me", async () => {
    const reg = await post("/api/auth/register", { email: "Ada@Example.com", password: "supersecret1" });
    expect(reg.status).toBe(200);
    const { app_session_id, user } = await reg.json();
    expect(user.email).toBe("ada@example.com");
    expect(user).not.toHaveProperty("passwordHash");

    expect((await post("/api/auth/register", { email: "ada@example.com", password: "supersecret1" })).status).toBe(409);

    const login = await post("/api/auth/login", { email: "ada@example.com", password: "supersecret1" });
    expect(login.status).toBe(200);

    const me = await fetch(base + "/api/auth/me", {
      headers: { Authorization: `Bearer ${app_session_id}` },
    });
    expect(me.status).toBe(200);
    expect((await me.json()).user.email).toBe("ada@example.com");

    const session = await post(
      "/api/auth/session",
      {},
      {
        Authorization: "Basic unrelated",
        Cookie: `app_session_id=${app_session_id}`,
      },
    );
    expect(session.status).toBe(400);
    expect(session.headers.get("set-cookie")).toBeNull();
  });

  it("rejects bad credentials, weak passwords and unauthenticated /me", async () => {
    expect((await post("/api/auth/login", { email: "ada@example.com", password: "wrongpass1" })).status).toBe(401);
    expect((await post("/api/auth/login", { email: "nobody@example.com", password: "wrongpass1" })).status).toBe(401);
    expect((await post("/api/auth/register", { email: "b@example.com", password: "short" })).status).toBe(400);
    expect((await fetch(base + "/api/auth/me")).status).toBe(401);
  });

  it("limits login attempts per IP despite changing email addresses", async () => {
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        post("/api/auth/login", {
          email: `unknown-${index}@example.com`,
          password: "wrongpass1",
        }),
      ),
    );
    expect(results.some((response) => response.status === 429)).toBe(true);
  });

  it("enrolls existing users only with their verified token and preserves their identity", async () => {
    rows.push({
      id: 100,
      openId: "manus_legacy_identity",
      email: "legacy@example.com",
      name: "Legacy User",
      passwordHash: null,
      loginMethod: "manus",
      role: "user",
      lastSignedIn: new Date(),
    });

    const rejected = await post("/api/auth/register", {
      email: "legacy@example.com",
      password: "new-password1",
    });
    expect(rejected.status).toBe(409);

    const enrolled = await post("/api/auth/register", {
      email: "legacy@example.com",
      password: "new-password1",
      enrollmentToken: "legacy-enrollment-token-for-test-0001",
    });
    expect(enrolled.status).toBe(200);
    expect((await enrolled.json()).user).toMatchObject({
      id: 100,
      openId: "manus_legacy_identity",
      email: "legacy@example.com",
    });
  });

  it("requires an out-of-band token to bootstrap the configured owner", async () => {
    expect(
      (
        await post("/api/auth/register", {
          email: "owner@example.com",
          password: "owner-password1",
        })
      ).status,
    ).toBe(403);

    const response = await post("/api/auth/register", {
      email: "owner@example.com",
      password: "owner-password1",
      enrollmentToken: "owner-bootstrap-token-for-test-00000001",
    });
    expect(response.status).toBe(200);
    expect(rows.find((row) => row.email === "owner@example.com")?.role).toBe("admin");
  });
});
