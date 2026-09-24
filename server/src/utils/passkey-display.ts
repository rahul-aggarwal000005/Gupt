export type PasskeyKind = "security_key" | "synced" | "this_device";

export function passkeyDisplay(input: {
  transports: string[] | null;
  credentialBackedUp: boolean;
  credentialDeviceType: string;
}): { kind: PasskeyKind; label: string } {
  const transports = input.transports ?? [];
  if (transports.includes("usb") || transports.includes("nfc")) {
    return { kind: "security_key", label: "Security key" };
  }
  if (
    input.credentialBackedUp ||
    input.credentialDeviceType === "multiDevice"
  ) {
    return { kind: "synced", label: "Synced passkey" };
  }
  return { kind: "this_device", label: "This device" };
}
