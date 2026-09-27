import { describe, it, expect } from "vitest";
import { mergeVaultByUpdatedAt, VaultData, LoginItem, SecureNoteItem } from "@/lib/store";

describe("Vault Store Utilities (store.ts)", () => {
  describe("mergeVaultByUpdatedAt", () => {
    it("should retain all items when local and incoming have completely disjoint IDs", () => {
      const localVault: VaultData = {
        items: [
          {
            id: "item-1",
            type: "login",
            title: "Local Item",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          } as LoginItem,
        ],
      };

      const incomingVault: VaultData = {
        items: [
          {
            id: "item-2",
            type: "secure_note",
            title: "Incoming Note",
            content: "Remote content",
            createdAt: "2026-01-02T00:00:00.000Z",
            updatedAt: "2026-01-02T00:00:00.000Z",
          } as SecureNoteItem,
        ],
      };

      const result = mergeVaultByUpdatedAt(localVault, incomingVault);

      expect(result.items).toHaveLength(2);
      expect(result.items.some((i) => i.id === "item-1")).toBe(true);
      expect(result.items.some((i) => i.id === "item-2")).toBe(true);
    });

    it("should keep local item if its updatedAt is strictly newer than incoming", () => {
      const localVault: VaultData = {
        items: [
          {
            id: "item-1",
            type: "login",
            title: "Local Newer Title",
            password: "new-password",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-05T12:00:00.000Z", // newer
          } as LoginItem,
        ],
      };

      const incomingVault: VaultData = {
        items: [
          {
            id: "item-1",
            type: "login",
            title: "Older Incoming Title",
            password: "old-password",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-03T12:00:00.000Z", // older
          } as LoginItem,
        ],
      };

      const result = mergeVaultByUpdatedAt(localVault, incomingVault);

      expect(result.items).toHaveLength(1);
      const item = result.items[0] as LoginItem;
      expect(item.title).toBe("Local Newer Title");
      expect(item.password).toBe("new-password");
      expect(item.updatedAt).toBe("2026-01-05T12:00:00.000Z");
    });

    it("should keep incoming item if its updatedAt is strictly newer than local", () => {
      const localVault: VaultData = {
        items: [
          {
            id: "item-1",
            type: "login",
            title: "Older Local Title",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-02T00:00:00.000Z", // older
          } as LoginItem,
        ],
      };

      const incomingVault: VaultData = {
        items: [
          {
            id: "item-1",
            type: "login",
            title: "Newer Incoming Title",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-10T00:00:00.000Z", // newer
          } as LoginItem,
        ],
      };

      const result = mergeVaultByUpdatedAt(localVault, incomingVault);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe("Newer Incoming Title");
      expect(result.items[0].updatedAt).toBe("2026-01-10T00:00:00.000Z");
    });

    it("should default to incoming item when updatedAt timestamps are equal", () => {
      const sharedTimestamp = "2026-01-05T00:00:00.000Z";

      const localVault: VaultData = {
        items: [
          {
            id: "item-1",
            type: "login",
            title: "Local Title",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: sharedTimestamp,
          } as LoginItem,
        ],
      };

      const incomingVault: VaultData = {
        items: [
          {
            id: "item-1",
            type: "login",
            title: "Incoming Authoritative Title",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: sharedTimestamp,
          } as LoginItem,
        ],
      };

      const result = mergeVaultByUpdatedAt(localVault, incomingVault);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe("Incoming Authoritative Title");
    });

    it("should handle empty vaults correctly", () => {
      const emptyVault: VaultData = { items: [] };

      const nonEmptyVault: VaultData = {
        items: [
          {
            id: "item-1",
            type: "login",
            title: "Login",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          } as LoginItem,
        ],
      };

      const mergeIntoEmpty = mergeVaultByUpdatedAt(emptyVault, nonEmptyVault);
      expect(mergeIntoEmpty.items).toHaveLength(1);

      const emptyIntoMerge = mergeVaultByUpdatedAt(nonEmptyVault, emptyVault);
      expect(emptyIntoMerge.items).toHaveLength(1);

      const bothEmpty = mergeVaultByUpdatedAt(emptyVault, emptyVault);
      expect(bothEmpty.items).toHaveLength(0);
    });
  });
});
