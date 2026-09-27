declare module "argon2-browser/dist/argon2-bundled.min.js" {
  export enum ArgonType {
    Argon2d = 0,
    Argon2i = 1,
    Argon2id = 2,
  }

  export interface Argon2BrowserOptions {
    pass: string | Uint8Array;
    salt: string | Uint8Array;
    time?: number;
    mem?: number;
    hashLen?: number;
    parallelism?: number;
    type?: ArgonType;
  }

  export interface Argon2BrowserResult {
    hash: Uint8Array;
    hashHex: string;
    encoded: string;
  }

  export function hash(
    options: Argon2BrowserOptions,
  ): Promise<Argon2BrowserResult>;
}
