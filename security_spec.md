# Security Specification - GeoRun

## 1. Data Invariants
- A User profile must be created by the owner and must contain their unique UID.
- A Territory represents a captured map tile. It must have an ownerId and location data (lat/lng).
- Territories can be claimed by any signed-in user, which updates the owner information.
- User stats (XP, Coins, Level, Territory Count) can only be updated by the owner.
- Quests are private to each user.

## 2. The "Dirty Dozen" Payloads (Red Team Payloads)
1. **Identity Spoofing**: User A tries to create a user profile for User B.
   - `setDoc(doc(db, 'users', 'USER_B_ID'), { uid: 'USER_A_ID', ... })` -> DENIED
2. **Resource Poisoning**: Injection of a 1MB string as a `tileId`.
   - `setDoc(doc(db, 'territories', 'VERY_LONG_STRING...'), { ... })` -> DENIED
3. **Ghost Field Injection**: Adding an `isAdmin: true` field to a user profile update.
   - `updateDoc(doc(db, 'users', 'MY_ID'), { isAdmin: true })` -> DENIED
4. **Timestamp Forgery**: Sending a client-side timestamp for `updatedAt` instead of `serverTimestamp()`.
   - `updateDoc(doc(db, 'users', 'MY_ID'), { updatedAt: new Date() })` -> DENIED
5. **Privilege Escalation**: Attempting to change `ownedTerritoryCount` on someone else's profile.
   - `updateDoc(doc(db, 'users', 'OTHER_ID'), { ownedTerritoryCount: 9999 })` -> DENIED
6. **Orphaned Writes**: Creating a territory without an `ownerId`.
   - `setDoc(doc(db, 'territories', 'tile-1'), { lat: 0, lng: 0 })` -> DENIED
7. **Type Mismatch**: Sending a string for `xp` instead of a number.
   - `updateDoc(doc(db, 'users', 'MY_ID'), { xp: "max" })` -> DENIED
8. **Immutability Breach**: Attempting to change the `uid` field in an existing user profile.
   - `updateDoc(doc(db, 'users', 'MY_ID'), { uid: 'NEW_ID' })` -> DENIED
9. **Query Scraping**: Attempting to list all daily quests for all users.
   - `getDocs(collectionGroup(db, 'dailyQuests'))` -> DENIED
10. **State Shortcutting**: Marking a quest as `claimed` before it is `completed`.
    - `updateDoc(doc(db, 'users/MY_ID/dailyQuests/Q1'), { status: 'claimed' })` -> DENIED (if logic enforced)
11. **PII Leak**: A signed-in user trying to read another user's private info (if we had a private info subcollection).
    - `getDoc(doc(db, 'users/OTHER_ID/private/info'))` -> DENIED
12. **Recursive Cost Attack**: Requesting a list of territories without any filters if we had O(n) lookups in rules.
    - `getDocs(collection(db, 'territories'))` -> Should be restricted or optimized.

## 3. Test Runner (Draft)
A comprehensive test file `firestore.rules.test.ts` will be generated to verify these cases.
