# OrganicIQ Firestore Security Specification

## 1. Data Invariants
1. Every document under `/users/{userId}`, `/users/{userId}/private/{docId}`, and `/users/{userId}/audits/{auditId}` MUST belong strictly to the authenticated, email-verified user (`request.auth.uid == userId` and `resource.data.ownerUid == request.auth.uid`).
2. PII (`email`, `displayName`) is isolated inside `/users/{userId}/private/profile` and never stored on shared or listable collections.
3. No blanket `list` is allowed on `/users`. Collection `list` on `/users/{userId}/audits` enforces `resource.data.ownerUid == request.auth.uid`.
4. All timestamps (`createdAt`, `updatedAt`) MUST equal `request.time`.
5. `ownerUid` and `createdAt` are immutable once created.

## 2. Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated read on `/users/uid_123`.
2. Authenticated user A reading `/users/uid_B`.
3. Authenticated user A reading `/users/uid_B/private/profile` (PII leak attempt).
4. Unverified email user (`email_verified == false`) creating `/users/uid_A`.
5. Spoofed `ownerUid` (`ownerUid: "other_user"`) on `/users/uid_A` creation.
6. Shadow field injection (`isAdmin: true`) on `/users/uid_A` create or update.
7. Client-forged `createdAt` timestamp (`new Date("2020-01-01")`) instead of server `request.time`.
8. Oversized ID poisoning (`docId` > 128 chars or containing `$` / spaces).
9. Oversized `toneRules` string (> 1000 chars) denial-of-wallet write.
10. Unbounded array injection (`contentPillars` > 12 items or `trackedKeywords` > 100 items).
11. Mutating immutable `ownerUid` or `createdAt` during update.
12. Blanket list query on `/users` collection.
