# Known Orval Issues & Workarounds

This document tracks known issues with Orval code generation and how we handle them.

## 1. Array Enum Defaults - Type Inference Issue

**Problem:**
```typescript
export const myDefault = ["segment"]  // Inferred as string[]
.default(myDefault)  // Error: string[] not assignable to ("word" | "segment")[]
```

**Root Cause:**
Orval generates default constants without type annotations, causing TypeScript to infer generic `string[]` instead of the specific tuple type Zod expects.

**Our Fix:**
Inline the default as an arrow function with `as any`:
```typescript
.default(() => ["segment"] as any)
```

**Upstream:**
- [ ] Report to Orval: Array defaults should use `as const` or explicit type annotations
- [ ] Alternative: Generate as functions from the start

---

## 2. Malformed Const Objects (Deepgram speak parameters)

**Problem:**
```typescript
export type Foo = typeof Foo[keyof typeof Foo];
// Missing: export const Foo = { ... } as const
```

**Root Cause:**
Orval sometimes fails to generate the const object, only generating the type.

**Our Fix:**
Restore from git history or manually recreate based on OpenAPI spec.

**Upstream:**
- [ ] Report to Orval with minimal reproduction
- [ ] Identify which spec patterns trigger this

---

## 3. Unterminated String Literals (Speechmatics)

**Problem:**
```typescript
'key': value',  // Missing opening quote
```

**Root Cause:**
Appears to be related to how Orval parses certain enum values in older Swagger 2.0 specs.

**Our Fix:**
Only apply string fixing to Speechmatics files (Deepgram/AssemblyAI don't have this issue).

**Upstream:**
- [ ] Test with updated Speechmatics OpenAPI 3.x spec
- [ ] May be Swagger 2.0 specific

---

## 4. Discriminated Unions Missing Discriminator

**Problem:**
```typescript
zod.discriminatedUnion("task", [
  zod.object({ text: ... }),  // Missing 'task' field!
  zod.object({ task: "transcribe", ... })
])
```

**Root Cause:**
OpenAI spec has multiple response shapes, but not all have the discriminator field.

**Our Fix:**
Convert to regular union:
```typescript
zod.union([...])
```

**Upstream:**
- [ ] This is an OpenAI spec issue, not Orval
- [ ] Consider patching OpenAI spec locally

---

## 5. Empty Zod Array Calls

**Problem:**
```typescript
.array(zod.array())  // Missing schema parameter
```

**Root Cause:**
Orval fails to infer the inner array type from nested array schemas.

**Our Fix:**
Replace with `zod.array(zod.unknown())` as a safe fallback.

**Upstream:**
- [ ] Report to Orval with spec snippet that triggers this
- [ ] May need to improve nested array handling

---

## Testing Our Fixes

Run `node scripts/test-fixer.js` to verify fixes work correctly.

Add new tests when discovering new issues.

## Contributing Upstream

When reporting issues to Orval:
1. Create minimal reproduction with OpenAPI spec snippet
2. Show generated output vs expected output
3. Link to this doc for context
4. Offer to submit PR if possible

Orval GitHub: https://github.com/anymaniax/orval
