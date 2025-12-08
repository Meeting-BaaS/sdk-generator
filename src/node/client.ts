import { ClientState } from "./client-state"
import type { BaasClientConfig, BaasClientConfigV1, BaasClientConfigV2, BaasClientConfigVexa } from "./types"
import { createV1Methods } from "./v1-methods"
import { createV2Methods } from "./v2-methods"
import { createVexaMethods } from "./vexa-methods"

/**
 * Conditional client type based on API version
 */
export type BaasClient<V extends "v1" | "v2" | "vexa"> = V extends "v1"
  ? import("./types").BaasClientV1Methods
  : V extends "v2"
  ? import("./types").BaasClientV2Methods
  : V extends "vexa"
  ? import("./types").BaasClientVexaMethods
  : never

/**
 * Tree-shakeable client factory with type inference
 * Creates a client object with only the methods you import
 * TypeScript will infer available methods based on api_version
 */
export function createBaasClient(config: BaasClientConfigV1): BaasClient<"v1">
export function createBaasClient(config: BaasClientConfigV2): BaasClient<"v2">
export function createBaasClient(config: BaasClientConfigVexa): BaasClient<"vexa">
export function createBaasClient(config: BaasClientConfig): BaasClient<"v1" | "v2" | "vexa">
export function createBaasClient(config: BaasClientConfig): BaasClient<"v1" | "v2" | "vexa"> {
  const state = new ClientState(config)
  const apiVersion = config.api_version ?? "v1"

  if (apiVersion === "vexa") {
    return createVexaMethods(state) as BaasClient<"v1" | "v2" | "vexa">
  }

  if (apiVersion === "v2") {
    return createV2Methods(state) as BaasClient<"v1" | "v2" | "vexa">
  }

  return createV1Methods(state) as BaasClient<"v1" | "v2" | "vexa">
}
