## Context

Phase 1 deliberately chose Schema β: top-level `projects/{projectId}` with `ownerId: string` and `members: Record<string, Role>`. The `isMember(projectData)` helper in `firestore.rules` already reads `projectData.members[request.auth.uid]`, so adding non-owner roles does not require touching the read path. The `runTransaction` pattern is already used for create/delete, so membership mutation fits the existing shape.

What's missing for sharing is (a) a way to resolve an invitee's email to a uid without exposing private profile data, (b) UI affordances for the share flow, and (c) rule-level enforcement of what non-owner roles can do.

## Goals / Non-Goals

**Goals:**

- Owners can add, remove, and change roles of collaborators by email.
- Non-owner members see projects they were invited to in their project list, with a visible role.
- Viewers cannot mutate any design document; editors can mutate design documents but cannot change membership or delete the project.
- Removing a member is instant and revocation-safe — no stale tokens, no cache windows.
- Public profiles expose only `displayName`, `email`, `photoURL` — no other personal data leaks.
- First-time invitees who don't yet have a GameCraft account see a clear, actionable error; they do NOT get silently dropped.

**Non-Goals:**

- URL/magic-link sharing (Phase 2.5).
- Pending-invite docs for pre-account users (Phase 2.5; current flow: "have them sign in first").
- Ownership transfer; single-owner assumption remains.
- Real-time presence / soft locking. Concurrent write conflicts remain LWW (documented in the Share dialog).
- Comments / suggestions / `commenter` role (requires a comment domain we don't have).
- Role differentiation within a project (e.g. "editor of rules only"). All roles are project-scope.

## Decisions

### 1. Three roles: `'owner' | 'editor' | 'viewer'`

`owner` has everything (create, edit, delete, manage membership, transfer-ownership-is-NotAllowed). `editor` can read + write design docs + leave the project. `viewer` can only read.

**Why not two roles (owner + editor)?** "Show my rules to a playtester without letting them change anything" is a real use case for a game designer. Viewer costs one line in the design-doc rule — worth it.

**Why not four (`commenter`)?** A commenter role implies a comment domain (threads, per-tile annotations). That's a Phase 3+ feature; adding the role now bakes in a commitment we're not ready for.

**Rule expression:** keep `isMember` as "`members[uid] != null`" (binary). Add `canWriteDesign` as "`members[uid] in ['owner', 'editor']`". Ownership is still `request.auth.uid == resource.data.ownerId`.

### 2. Directory via `users/{uid}/publicProfile/main`, read-all-authenticated

Firestore cannot do "query for users where email = X" across private documents unless every `users/{uid}/profile/main` is readable by the querier — which would leak `createdAt`, `lastLoginAt`, `lastOpenedProjectId`. The tension is standard: either a server-side function mediates the lookup, or a split-doc pattern exposes only the fields that need to be world-readable.

| Option | Read surface | Infra added | Leakage |
|---|---|---|---|
| Mediated via Cloud Function | Callable fn `resolveEmail(email)` | Functions deploy + cold starts | Hidden |
| **`publicProfile/main` subcollection** ✅ | `displayName, email, photoURL` | None | Email existence enumerable |
| Expose `profile/main` read to all auth users | All profile fields | None | All profile data |

**Chosen:** `publicProfile/main`. Pros: zero infra, mirrors the pattern already used for `profile/main`, keeps write access locked to the owner. Cons: email existence is enumerable (an attacker with a GameCraft account can test "is alice@example.com a user?"). For a hobby design tool the leakage is acceptable; if it ever matters, wrapping the lookup in a Cloud Function is a later, non-migrating swap.

**`provisionUserProfile` duty:** on every sign-in, mirror `displayName`, `email`, `photoURL` to `publicProfile/main` as well as `profile/main`. On first sign-in, both docs are created.

### 3. Direct membership write, no pending-invite state machine

The share dialog calls `addMember(projectId, email, role)`:

1. Query `users` where `publicProfile.email == email` → 0 or 1 docs.
2. If found: `runTransaction` writes `projects/{pid}.members[uid] = role` AND creates `users/{targetUid}/projectRefs/{pid}` with that role.
3. If not found: reject with `"This user hasn't signed in to GameCraft yet — ask them to sign in first."`.

**Why not an invite queue?** Pending-invite state adds: a new collection, a claim flow, expiry, cancel UI, rule gymnastics to let pre-account users see "their" invites, and tests for every state transition. For Phase 2, the cost is disproportionate to the benefit — 95% of invitees are already using the same Google account for other products. If Phase 2 feedback shows pre-account friction, Phase 2.5 can add pending invites on top without rewriting Phase 2.

**Collection-group query required:** `where('email', '==', ...)` on `publicProfile/main` across all users needs a collection-group query (`collectionGroup('publicProfile')`). Rules already allow read on any `publicProfile/main` to any authenticated user, so this is safe.

### 4. Symmetric dual-write on `addMember` via `runTransaction`

Phase 1's create/delete already use `runTransaction` to keep `projects/{pid}` and `users/{uid}/projectRefs/{pid}` consistent. Membership mutation reuses the pattern:

- `addMember`: `tx.update(projects/{pid}, { members: { ...existing, [targetUid]: role } }) + tx.set(users/{targetUid}/projectRefs/{pid}, { role, addedAt })`.
- `removeMember`: `tx.update(projects/{pid}, { members: { ...existing without [targetUid] } }) + tx.delete(users/{targetUid}/projectRefs/{pid})`.
- `changeRole`: `tx.update(projects/{pid}, { members: { ...existing, [targetUid]: newRole } }) + tx.update(users/{targetUid}/projectRefs/{pid}, { role: newRole })`.

**Why transactions?** If the projects update succeeds but the projectRefs write fails, the target user never sees the project in their list. Atomic updates prevent this orphaning.

**Rule nuance:** the owner's `tx.set`/`tx.update`/`tx.delete` on `users/{targetUid}/projectRefs/{pid}` is writing another user's document. Current rule: `allow read, write: if isOwner(userId)` where `userId` is the path segment. This blocks cross-user writes.

We need a rule extension: the write on `users/{targetUid}/projectRefs/{pid}` is allowed if the caller is the `owner` of the referenced project. Structured as:

```
match /users/{userId}/projectRefs/{projectId} {
  allow read: if isOwner(userId);
  allow write: if isOwner(userId)
               || request.auth.uid == get(/databases/$(database)/documents/projects/$(projectId)).data.ownerId;
}
```

Reads stay strictly owner-only (Alice can't read Bob's projectRef list); writes expand to "the project's owner can manage ref entries for any member."

### 5. Role-aware UI via a cheap `useActiveRole()` hook

Rather than plumb role through every child component, a `useActiveRole(): Role | null` hook reads the current user's role from `ProjectContext.projects` by matching `activeProjectId`. Returns `null` on `ProjectListScreen`. Design providers don't need to know the role — rule violations from a viewer who somehow bypassed the UI will be caught server-side and surfaced as an error on `SaveIndicator`.

**Why not bake viewer-only into `useFirestoreDoc`?** Mixing authorization into a data-sync hook couples concerns. The hook already surfaces errors; the UI layer makes the positive decision to disable inputs.

### 6. "Leave project" is distinct from "delete project"

A non-owner's destructive action is removing themselves. This calls `removeMember(projectId, self.uid)`, which in Phase 2 is already implemented as a transactional pair. The UI wires a "Leave" button for non-owners (only visible in their `ProjectListScreen` card's action area), and the `Delete` button is owner-only.

**Why not collapse them?** The confirmation text should differ ("Leave this project — you won't be able to rejoin unless re-invited" vs. "Delete this project permanently"). Two buttons, two flows, shared underlying transaction.

### 7. Concurrent-edit behaviour is explicitly LWW, surfaced in the dialog

Phase 1 noted LWW across a single user's tabs. Phase 2 broadens this to cross-user concurrent edits, which are now likely. Rather than hide it, the Share dialog carries a one-line note:

> "When two people edit at the same time, the most recent save wins. Coordinate over chat for heavy editing."

Presence / soft locking / CRDTs are deliberately out of scope.

## Risks / Trade-offs

- **[Email enumeration]** The `publicProfile` read-all-authenticated rule lets any logged-in user test "does this email have an account?". Mitigations: the share dialog only reveals the result to the requester (so no mass scraping via the app UI); an abuse case requires raw SDK access from a signed-in account. Acceptable for a hobby tool; flagged if the product ever adds paid tiers or houses sensitive content.
- **[Collection-group query cost]** `collectionGroup('publicProfile')` reads across all users. As the user base grows, this query needs an index (Firestore will prompt for one automatically on first run) and could become slow. Out of scope for Phase 2; cost-controlled as a Phase 2.5 follow-up (either capping results, caching, or moving to a Function).
- **[Revocation window]** `onSnapshot` subscriptions opened before revocation will keep delivering updates until the SDK notices the rule denial. In practice this is <1 s. Acceptable; for strict cutoff, a future phase can add a server-side kick.
- **[LWW cross-user]** A viewer cannot trigger writes, but two editors can stomp each other. Accepted and surfaced.
- **[Rule complexity]** The `users/{uid}/projectRefs` rule becomes multi-branch (owner of the self doc OR owner of the referenced project). Harder to reason about; we mitigate by Emulator Rules Playground scenarios in tasks.md (Phase 1 did the same for its new rules and caught issues there).
- **[`provisionUserProfile` now writes two docs]** A partial failure (profile/main succeeds, publicProfile/main fails) leaves a user unable to be invited by email until next sign-in. Mitigation: a single `Promise.all` with a clear error log — same Phase 1 semantics apply (profile sync is already best-effort for `lastLoginAt`).
- **[Public profile stale after displayName change]** If a user changes their Google profile name, `publicProfile` updates only on next sign-in. Members already in a project show the old name in share dialogs until then. Acceptable; the eventual-consistency window is a day at most for active users.
