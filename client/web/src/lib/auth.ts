import { api } from "./api";

export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}

export const register = async (
  email: string,
  password: string,
): Promise<{ user: User }> => {
  const response = await api.post("/api/auth/register", { email, password });
  return response.data;
};

export const login = async (
  email: string,
  password: string,
): Promise<{ user: User }> => {
  const response = await api.post("/api/auth/login", { email, password });
  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post("/api/auth/logout");
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await api.get("/api/auth/me");
    return response.data.user;
  } catch (error) {
    return null;
  }
};

export const getVault = async (): Promise<{
  version: number;
  encryptedData: string;
} | null> => {
  try {
    const response = await api.get("/api/vault");
    return response.data;
  } catch (err) {
    const error = err as { response?: { status?: number } };
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const updateVault = async (
  version: number,
  encryptedData: string,
): Promise<{ version: number }> => {
  const response = await api.put("/api/vault", { version, encryptedData });
  return response.data;
};

export const forgotPassword = async (
  email: string,
): Promise<{ message: string; resetUrl?: string }> => {
  const response = await api.post("/api/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (
  token: string,
  password: string,
): Promise<{ message: string }> => {
  const response = await api.post("/api/auth/reset-password", {
    token,
    password,
  });
  return response.data;
};

export const loginWithGoogle = async (
  credential: string,
): Promise<{ user: User; message: string }> => {
  const response = await api.post("/api/auth/google", { credential });
  return response.data;
};
