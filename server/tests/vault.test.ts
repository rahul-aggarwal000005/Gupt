import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/prisma";

describe("Vault Integration Tests", () => {
  const testEmail = `vault-test-${Date.now()}@example.com`;
  const testPassword = "VaultPassword123!";
  let authCookie: string;

  beforeAll(async () => {
    // Register user to establish session
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: testEmail, password: testPassword });

    const setCookie = res.headers["set-cookie"] as unknown as string[];
    const tokenCookie = setCookie.find((c: string) => c.startsWith("token="));
    authCookie = tokenCookie!.split(";")[0];
  });

  afterAll(async () => {
    // Clean up test user and cascading relations (vault, sessions)
    await prisma.user.deleteMany({
      where: { email: { contains: "vault-test-" } },
    });
  });

  describe("GET /api/vault", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app).get("/api/vault");
      expect(res.status).toBe(401);
    });

    it("should return 404 for a user with no vault yet", async () => {
      const res = await request(app)
        .get("/api/vault")
        .set("Cookie", authCookie);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Vault not found");
    });
  });

  describe("PUT /api/vault", () => {
    const mockCiphertextV1 = "encrypted-payload-v1-ciphertext";
    const mockCiphertextV2 = "encrypted-payload-v2-ciphertext";

    it("should reject initial vault creation if version is not 1", async () => {
      const res = await request(app)
        .put("/api/vault")
        .set("Cookie", authCookie)
        .send({ version: 2, encryptedData: mockCiphertextV1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Initial vault version must be 1");
    });

    it("should create initial vault at version 1 and return 201", async () => {
      const res = await request(app)
        .put("/api/vault")
        .set("Cookie", authCookie)
        .send({ version: 1, encryptedData: mockCiphertextV1 });

      expect(res.status).toBe(201);
      expect(res.body.version).toBe(1);
      expect(res.body.message).toContain("Vault created successfully");
    });

    it("GET /api/vault should now return the created vault", async () => {
      const res = await request(app)
        .get("/api/vault")
        .set("Cookie", authCookie);

      expect(res.status).toBe(200);
      expect(res.body.version).toBe(1);
      expect(res.body.encryptedData).toBe(mockCiphertextV1);
    });

    it("should reject update if client version does not match server (OCC conflict 409)", async () => {
      // Server is currently at version 1, client sends wrong version (e.g. 99)
      const res = await request(app)
        .put("/api/vault")
        .set("Cookie", authCookie)
        .send({ version: 99, encryptedData: mockCiphertextV2 });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("VAULT_VERSION_CONFLICT");
      expect(res.body.serverVersion).toBe(1);
    });

    it("should update vault and increment version when version matches", async () => {
      // Sending current version 1
      const res = await request(app)
        .put("/api/vault")
        .set("Cookie", authCookie)
        .send({ version: 1, encryptedData: mockCiphertextV2 });

      expect(res.status).toBe(200);
      // Server increments version from 1 -> 2
      expect(res.body.version).toBe(2);

      // Verify DB now holds version 2
      const getRes = await request(app)
        .get("/api/vault")
        .set("Cookie", authCookie);

      expect(getRes.status).toBe(200);
      expect(getRes.body.version).toBe(2);
      expect(getRes.body.encryptedData).toBe(mockCiphertextV2);
    });
  });
});
