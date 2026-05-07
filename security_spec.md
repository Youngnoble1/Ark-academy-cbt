# Security Specification: Ark Academy CBT

## Data Invariants
1. A **User** profile can only be created by the authenticated user themselves and cannot have its `role` changed after creation by the user.
2. A **Quiz** can be created by any authenticated user (teachers/students for now, as we haven't strictly partitioned teacher-only quiz creation yet, but we will protect the `creatorId`).
3. A **Result** must be linked to an existing Quiz and the authenticated user who took it.
4. **Resources** are read-only for students and can only be modified by admins (or if we had a teacher check).

## The "Dirty Dozen" Payloads (Red Team Test Cases)
1. **Identity Spoofing**: Attempt to create a user profile with a different UID than `request.auth.uid`.
2. **Role Escalation**: Attempt to update own role from `student` to `teacher`.
3. **Ghost Quiz**: Attempt to create a quiz with a 1MB string as a topic.
4. **Result Hijacking**: Attempt to read another student's specific quiz results.
5. **Score Injection**: Attempt to create a result with more correct answers than total questions.
6. **Immutable Tampering**: Attempt to update `createdAt` on a quiz.
7. **Orphaned Result**: Attempt to create a result for a non-existent quiz ID.
8. **PII Leak**: Attempt to list all users' emails as a student.
9. **Action Bypass**: Attempt to update a quiz's `creatorId`.
10. **Shadow Field**: Attempt to add `isAdmin: true` to a user profile.
11. **ID Poisoning**: Attempt to use `../../secret_collection` as a quiz ID.
12. **Recursive Cost Attack**: Attempt to list all results without any filters.

## Firestore Rules Draft
... (Moved to firestore.rules)
