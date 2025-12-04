// Main SDK Export file
// This file exports the core SDK functionality

// Re-export Zod schemas from v1 (backward compatibility)
// Usage: import { joinBody } from "@meeting-baas/sdk"
export * from "./generated/v1/api/calendars/calendars.zod"
export * from "./generated/v1/api/default/default.zod"
export * from "./generated/v1/api/webhooks/webhooks.zod"
// Re-export all types from v1 generated code for advanced usage (backward compatibility)
// These are the default exports - existing code will continue to work
export * from "./generated/v1/schema"
// Re-export v2 Zod schemas in namespaces to avoid naming conflicts
// Usage: import { V2Zod } from "@meeting-baas/sdk"; const schema = V2Zod.createBotBody
export * as V2Zod from "./generated/v2/api/bots/bots.zod"
export * as V2ZodCalendars from "./generated/v2/api/calendars/calendars.zod"
// Re-export v2 types in a namespace to avoid naming conflicts
// Usage: import { V2 } from "@meeting-baas/sdk"; const params: V2.ListEventsParams = ...
export * as V2 from "./generated/v2/schema"

// Re-export BaaS functionality from our wrapper client
export { type BaasClient, createBaasClient } from "./node/client"
export * from "./node/types.d"
