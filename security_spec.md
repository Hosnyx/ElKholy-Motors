# Security Specification & Test-Driven Development (TDD) for ElKholy Motors

This document establishes the Attribute-Based Access Control (ABAC) invariants and security requirements for Firestore integration.

## 1. Data Invariants

1. **Motorcycles**: Catalog items can only be modified, created, or deleted by system Administrators. Guest users can only read (get/list) them. Price values must be positive and spec objects cannot contain bloated data payloads.
2. **Homepage Config**: Global styling, design layouts, custom theme configurations, and logos are read-only for public guests. Full modification requires Admin privilege.
3. **User Accounts**: Custom operator credentials can only be stored, updated, or read by high-level Admin accounts. Users cannot edit their own administrative roles or bypass account checks.
4. **Bookings (Reservations)**: Guest users can submit new booking requests (create only) with name and phone validation. No random guest can view or download other guests' private reservation and phone metadata (PII protection).

---

## 2. The "Dirty Dozen" Threat Payloads

The system must reject the following malicious action payloads under any circumstances:

1. **G01 [PII Read Scrape]**: Public user attempts to read all document records from `/bookings` collection. (Expected: `PERMISSION_DENIED`)
2. **G02 [Anom Write Motorcycle]**: Unauthenticated guest attempts to create `/motorcycles/malicious-bike` to deface the homepage. (Expected: `PERMISSION_DENIED`)
3. **G03 [Anom Update Styling]**: Public user attempts to modify colors or links in `/homepageConfig/main`. (Expected: `PERMISSION_DENIED`)
4. **A04 [Self-Promote Role]**: Standard staff member attempts to update their own credentials in `/users` to assign themselves the `Admin` role. (Expected: `PERMISSION_DENIED`)
5. **A05 [Bypass Schema Field Glow]**: Admin attempts to inject a 10MB string as the `logoUrl` inside `/homepageConfig/main` to trigger Denial of Wallet. (Expected: `PERMISSION_DENIED`)
6. **M06 [Negative Pricing Poison]**: Rogue operator attempts to update a motorcycle's price to a negative value. (Expected: `PERMISSION_DENIED`)
7. **B07 [Shadow Booking Inject]**: Public attendee creates a booking but injects random "Ghost Fields" (e.g., `verifiedAdminTransfer: true`). (Expected: `PERMISSION_DENIED`)
8. **I08 [ID Poison Attack]**: User attempts to create a document with a 20KB junk-character string as the ID to trigger filesystem failures. (Expected: `PERMISSION_DENIED`)
9. **C09 [PII Update Hack]**: Unauthorized user attempts to edit a customer booking phone number. (Expected: `PERMISSION_DENIED`)
10. **A10 [Immortality Bypass]**: User tries to update `createdAt` field on a historical booking. (Expected: `PERMISSION_DENIED`)
11. **D11 [Rogue Delete Config]**: Anonymous spectator attempts to delete `/homepageConfig/main`. (Expected: `PERMISSION_DENIED`)
12. **U12 [Invalid Type Injection]**: User submits a booking where `totalPrice` is a dictionary instead of a number. (Expected: `PERMISSION_DENIED`)

---

## 3. Test Structure & Rules Assurance

The `firestore.rules` uses secure validation blueprints (`isValidMotorcycle`, `isValidHomepageConfig`, `isValidUserAccount`, `isValidBooking`) combined with robust ID safety checks (`isValidId`). All rules enforce strict field limits and check that only system admins execute modifications.
