import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/prisma";

describe("Auth Integration Tests", () => {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const testEmail = `auth-test-${uniqueId}@example.com`;
  const testPassword = "StrongPassword123!";
  let authCookie: string;

  afterAll(async () => {
    // Cleanup only this test suite's users
    await prisma.user.deleteMany({
      where: { email: { contains: `auth-test-${uniqueId}` } },
    });
  });

  it("GET /health should return 200 OK", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.timestamp).toBeDefined();
  });

  describe("POST /api/auth/register", () => {
    it("should reject registration with invalid email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "invalid-email", password: testPassword });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("should reject registration with password shorter than 8 chars", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: testEmail, password: "short" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("at least 8 characters");
    });

    it("should successfully register a new user and set token cookie", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);

      const setCookieHeader = res.headers["set-cookie"];
      expect(setCookieHeader).toBeDefined();
      const tokenCookie = (setCookieHeader as unknown as string[]).find(
        (c: string) => c.startsWith("token="),
      );
      expect(tokenCookie).toBeDefined();
      expect(tokenCookie).toContain("HttpOnly");

      // Save cookie for subsequent tests
      authCookie = tokenCookie!.split(";")[0];
    });

    it("should reject duplicate registration with 400", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("already exists");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should reject login with wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: testEmail, password: "WrongPassword999!" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });

    it("should reject login with non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nonexistent@example.com", password: testPassword });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });

    it("should successfully login with correct credentials and issue cookie", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testEmail);

      const setCookieHeader = res.headers["set-cookie"];
      expect(setCookieHeader).toBeDefined();
      const tokenCookie = (setCookieHeader as unknown as string[]).find(
        (c: string) => c.startsWith("token="),
      );
      expect(tokenCookie).toBeDefined();
    });
  });

  describe("GET /api/auth/me", () => {
    it("should reject request without token cookie with 401", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.error).toContain("Unauthorized");
    });

    it("should return authenticated user profile with valid cookie", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Cookie", authCookie);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should delete session and clear token cookie", async () => {
      const res = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", authCookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Logged out successfully");

      // Verify that subsequent requests with the same cookie are now rejected
      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Cookie", authCookie);

      expect(meRes.status).toBe(401);
    });
  });
});
