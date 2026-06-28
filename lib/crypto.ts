import { generateKeyPairSync } from "node:crypto";

export interface KeyPair {
  /** Base64-encoded raw 32-byte X25519 private key (WireGuard format). */
  privateKey: string;
  /** Base64-encoded raw 32-byte X25519 public key (WireGuard format). */
  publicKey: string;
}

/**
 * Generates a WireGuard-compatible X25519 key pair using Node's native crypto.
 *
 * WireGuard keys are raw 32-byte X25519 scalars/points encoded as base64. The
 * raw key sits in the last 32 bytes of the DER (pkcs8 private / spki public)
 * export, so we slice it off. WireGuard clamps the private scalar itself, so the
 * unclamped raw bytes produce the same public key on both sides.
 */
export function generateKeyPair(): KeyPair {
  const { publicKey, privateKey } = generateKeyPairSync("x25519");
  const privDer = privateKey.export({ format: "der", type: "pkcs8" });
  const pubDer = publicKey.export({ format: "der", type: "spki" });
  return {
    privateKey: privDer.subarray(privDer.length - 32).toString("base64"),
    publicKey: pubDer.subarray(pubDer.length - 32).toString("base64"),
  };
}
