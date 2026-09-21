import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import { api } from "./api";

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
    throw error;
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
    throw error;
  }
};
