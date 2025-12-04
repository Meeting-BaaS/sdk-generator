import { ClientState } from "./client-state"
import type { BaasClientConfig, BaasClientConfigV1, BaasClientConfigV2 } from "./types"
import { createV1Methods } from "./v1-methods"
import { createV2Methods } from "./v2-methods"

/**
 * Conditional client type based on API version
 */
export type BaasClient<V extends "v1" | "v2"> = V extends "v1"
  ? import("./types").BaasClientV1Methods
  : import("./types").BaasClientV2Methods

/**
 * Tree-shakeable client factory with type inference
 * Creates a client object with only the methods you import
 * TypeScript will infer available methods based on api_version
 */
export function createBaasClient(config: BaasClientConfigV1): BaasClient<"v1">
export function createBaasClient(config: BaasClientConfigV2): BaasClient<"v2">
export function createBaasClient(config: BaasClientConfig): BaasClient<"v1" | "v2">
export function createBaasClient(config: BaasClientConfig): BaasClient<"v1" | "v2"> {
  const state = new ClientState(config)
  const apiVersion = config.api_version ?? "v1"

  if (apiVersion === "v2") {
    return createV2Methods(state) as BaasClient<"v1" | "v2">
  }

  return createV1Methods(state) as BaasClient<"v1" | "v2">
}
