import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import { api } from "./api";

const passkeyNotAllowedMessage =
  "Passkey setup was cancelled or the browser tab lost focus. Try again and keep this tab active.";

function rethrowPasskeyUserError(
  error: unknown,
  cancelledMessage: string,
): never {
  if (error instanceof Error && error.name === "NotAllowedError") {
    throw new Error(cancelledMessage);
  }
  throw error;
}

export const registerPasskey = async (): Promise<boolean> => {
  try {
    // 1. Get registration options from the server
    const optionsResp = await api.get(
      "/api/auth/webauthn/register/generate-options",
    );
    const options = optionsResp.data;

    // 2. Pass options to the browser to create a new credential
    const attResp = await startRegistration({ optionsJSON: options });

    // 3. Send the credential back to the server for verification
    const verificationResp = await api.post(
      "/api/auth/webauthn/register/verify",
      attResp,
    );

    return verificationResp.data?.verified === true;
  } catch (error) {
    console.error("Passkey registration failed:", error);
    rethrowPasskeyUserError(error, passkeyNotAllowedMessage);
  }
};

export const loginWithPasskey = async (email: string): Promise<any> => {
  try {
    // 1. Get authentication options from the server
    const optionsResp = await api.get(
      `/api/auth/webauthn/login/generate-options?email=${encodeURIComponent(email)}`,
    );
    const options = optionsResp.data;

    // 2. Pass options to the browser to authenticate the credential
    const asseResp = await startAuthentication({ optionsJSON: options });

    // 3. Send the authentication response back to the server for verification
    const verificationResp = await api.post("/api/auth/webauthn/login/verify", {
      email,
      response: asseResp,
    });

    if (verificationResp.data?.verified) {
      return verificationResp.data.user;
    }
    throw new Error("Verification failed");
  } catch (error) {
    console.error("Passkey login failed:", error);
    rethrowPasskeyUserError(
      error,
      "Passkey sign-in was cancelled or the browser tab lost focus. Try again and keep this tab active.",
    );
  }
};

export type PasskeyKind = "security_key" | "synced" | "this_device";

export interface PasskeySummary {
  id: string;
  kind: PasskeyKind;
  label: string;
  createdAt: string;
  credentialBackedUp?: boolean;
  credentialDeviceType?: string;
  transports?: string[];
}

export const listPasskeys = async (): Promise<PasskeySummary[]> => {
  try {
    const response = await api.get<{ passkeys: PasskeySummary[] }>(
      "/api/auth/webauthn/passkeys",
    );
    return response.data?.passkeys || [];
  } catch (error) {
    console.error("Failed to list passkeys:", error);
    throw error;
  }
};

export const deletePasskey = async (id: string): Promise<boolean> => {
  try {
    await api.delete(`/api/auth/webauthn/passkeys/${id}`);
    return true;
  } catch (error) {
    console.error("Failed to delete passkey:", error);
    throw error;
  }
};
