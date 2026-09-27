import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/lib/api";
import {
  register,
  login,
  logout,
  getCurrentUser,
  getVault,
  updateVault,
  forgotPassword,
  resetPassword,
  loginWithGoogle,
} from "@/lib/auth";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe("Client Auth API wrappers (auth.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("register should call POST /api/auth/register and return user", async () => {
    const mockUser = { id: "u-1", email: "test@example.com" };
    vi.mocked(api.post).mockResolvedValueOnce({ data: { user: mockUser } });

    const result = await register("test@example.com", "Password123!");
    expect(api.post).toHaveBeenCalledWith("/api/auth/register", {
      email: "test@example.com",
      password: "Password123!",
    });
    expect(result).toEqual({ user: mockUser });
  });

  it("login should call POST /api/auth/login and return user", async () => {
    const mockUser = { id: "u-1", email: "test@example.com" };
    vi.mocked(api.post).mockResolvedValueOnce({ data: { user: mockUser } });

    const result = await login("test@example.com", "Password123!");
    expect(api.post).toHaveBeenCalledWith("/api/auth/login", {
      email: "test@example.com",
      password: "Password123!",
    });
    expect(result).toEqual({ user: mockUser });
  });

  it("logout should call POST /api/auth/logout", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { message: "Logged out" } });

    await logout();
    expect(api.post).toHaveBeenCalledWith("/api/auth/logout");
  });

  it("getCurrentUser should return user on 200 and null on error", async () => {
    const mockUser = { id: "u-1", email: "test@example.com" };
    vi.mocked(api.get).mockResolvedValueOnce({ data: { user: mockUser } });

    const user = await getCurrentUser();
    expect(user).toEqual(mockUser);

    vi.mocked(api.get).mockRejectedValueOnce(new Error("Unauthorized"));
    const noUser = await getCurrentUser();
    expect(noUser).toBeNull();
  });

  it("getVault should return data on success and null on 404", async () => {
    const mockVault = { version: 1, encryptedData: "cipher" };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockVault });

    const vault = await getVault();
    expect(vault).toEqual(mockVault);

    // 404 response
    vi.mocked(api.get).mockRejectedValueOnce({
      response: { status: 404 },
    });
    const nullVault = await getVault();
    expect(nullVault).toBeNull();
  });

  it("updateVault should call PUT /api/vault and return version", async () => {
    vi.mocked(api.put).mockResolvedValueOnce({ data: { version: 2 } });

    const res = await updateVault(1, "new-cipher");
    expect(api.put).toHaveBeenCalledWith("/api/vault", {
      version: 1,
      encryptedData: "new-cipher",
    });
    expect(res).toEqual({ version: 2 });
  });

  it("forgotPassword should call POST /api/auth/forgot-password", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { message: "Email sent" } });

    const res = await forgotPassword("user@example.com");
    expect(api.post).toHaveBeenCalledWith("/api/auth/forgot-password", {
      email: "user@example.com",
    });
    expect(res.message).toBe("Email sent");
  });

  it("resetPassword should call POST /api/auth/reset-password", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { message: "Password reset" } });

    const res = await resetPassword("reset-token-123", "NewPassword123!");
    expect(api.post).toHaveBeenCalledWith("/api/auth/reset-password", {
      token: "reset-token-123",
      password: "NewPassword123!",
    });
    expect(res.message).toBe("Password reset");
  });

  it("loginWithGoogle should call POST /api/auth/google", async () => {
    const mockUser = { id: "g-1", email: "google@example.com" };
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { user: mockUser, message: "Welcome" },
    });

    const res = await loginWithGoogle("jwt-id-token");
    expect(api.post).toHaveBeenCalledWith("/api/auth/google", {
      credential: "jwt-id-token",
    });
    expect(res.user).toEqual(mockUser);
  });
});
