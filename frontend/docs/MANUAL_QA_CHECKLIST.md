# Manual QA Checklist — Owner Walkthrough & Bug Reporting

**Purpose.** A step-by-step guide for a non-technical reviewer (the owner / site team) to click through the live website and confirm: (1) every point from the Vendor Management / Accepted Cost Estimate / "Flow of Channel" writeup (tracked as `docs/OPEN_QUESTIONS.md` #85, documented in `docs/CHANGELOG.md`) actually behaves as described; (2) the rest of the app still works correctly (general regression). It also explains how to report anything that looks wrong so it gets fixed quickly.

This is a **mock-data demo build** — there is no real backend yet, data lives in the browser only, and a few things are expected to behave differently from a finished product. Those are called out explicitly below as "Expected, not a bug" so they aren't reported as defects.

---

## 0. Setup (2 minutes)

1. Start the site: in the project folder, run `npm run dev`, then open **http://localhost:3000** in a browser (Chrome or Edge recommended). If someone has already deployed it to a shared URL, use that URL instead.
2. Go to **`/login`**. You will see an email/password form **and** a row of "Continue as…" buttons — one per role. Both work the same way for testing:
   - Typing any of the demo emails below with **any non-empty password** logs you in (passwords are never actually checked in this demo build — that's expected).
   - Or just click the "Continue as [Role]" button for the person you want to test as.
3. **Demo accounts** (use the one matching what you're testing):

   | Email | Role | Use it to test |
   |---|---|---|
   | `admin@brickbasket.co.in` | Admin | Everything — admin sees all modules |
   | `purchaser@brickbasket.co.in` | Purchaser | Vendors, ACE, RFQ, Purchase Orders |
   | `store@brickbasket.co.in` | Store Personnel | GRN, Stock Statement, Wastage, Material Receipts, Material Requisitions (store side) |
   | `engineer@brickbasket.co.in` | Site Engineer | Supply/Service Requirement (raising it), DPR, Site Updates |
   | `finance@brickbasket.co.in` | Finance | Payments, Bank & Cash, Taxes, Fixed Assets |
   | `approver@brickbasket.co.in` | Approver | Purchase Order approvals |
   | `pm@brickbasket.co.in` | Project Manager | Schedule, DPR, cross-module oversight |
   | `customer@brickbasket.co.in` | Customer | The customer portal only (not the admin side at all — see Section 3) |

4. A login stays active for **2 hours**, then you're signed out automatically — expected, not a bug.
5. To switch roles, use the profile menu (top right) → **Log out**, then log back in as a different demo account. Don't test two roles in two tabs of the same browser at once — they share the same login session and will interfere with each other.

---

## 1. Walkthrough: the Vendor Management & Accepted Cost Estimate writeup

Log in as **`purchaser@brickbasket.co.in`** (or `admin`) for this whole section unless told otherwise.

### 1.1 Vendor Management — PAN number

- Go to **Vendor Management** (left nav, under "Vendors & Supply Chain") → open any existing vendor, or click **New Vendor**.
- **Check:** the form has a **PAN Number** field.
- **Expected result:** you can type a PAN into it and save; it shows up on the vendor's detail page afterward.
- **Report as a bug if:** the field is missing, doesn't save, or doesn't show after saving.

### 1.2 Vendor Management — attach typed documents

- On a vendor's detail page, find the **Documents** section → click **Attach Document**.
- **Check:** you must first pick a **Type of Document** (PAN Card, GSTIN Certificate, MSME/UDYAM Certificate, or Other) — the file picker is file-optional.
- **Expected result:** after choosing a type and clicking Attach, the document appears in the list labeled with its type.
- **Expected, not a bug:** there's a note that files aren't actually stored on a server yet in this demo — attaching only keeps the file in that browser tab for the session. A real upload isn't expected to work here.
- **Report as a bug if:** you can attach a document without picking a type first, or the attached item doesn't show the right label afterward.

### 1.3 Vendor Management — past orders with status

- On a vendor's detail page, find the **Past Work / Past Orders** section → add an entry.
- **Check:** you can enter a description and a value, and mark it either **In Progress** or **Completed**.
- **Expected result:** choosing "Completed" reveals a **completion date** field that "In Progress" does not show.
- **Report as a bug if:** the status choice doesn't change which fields appear, or a saved entry's status/value doesn't display correctly in the list afterward.

### 1.4 Accepted Cost Estimate (ACE) — UOM dropdown

- Go to **Accepted Cost Estimate** (left nav) → open a project's ACE, or add a new line item.
- **Check:** the Unit of Measure field is a **dropdown**, not a free-text box, with options like KG, Sq.ft, Nos., Meter, MT, Sq.mt.
- **Report as a bug if:** you can type a free-text UOM instead of picking from the list.

### 1.5 ACE — serial number

- On the ACE list/table for a project.
- **Check:** there is a **Sr. No.** column, numbered sequentially.
- **Report as a bug if:** the column is missing, or the numbers don't update correctly when the list is filtered/grouped (the demo groups items by category — numbering should still run in order within what's visible).

### 1.6 RFQ — compare vendor offers + attach them

- Go to **RFQs** (left nav) → open an RFQ that's in "In Comparison" status, or create one from a Supply/Service Requirement.
- **Check:** for each line, you can record a quote/rate per vendor and see them side by side for comparison; there's a way to record which vendor's offer is being attached/selected.
- **Expected result:** once every line has a vendor selected, you can **Finalize** the RFQ — after that the comparison locks (vendors/rates can no longer change).
- **Report as a bug if:** you can finalize an RFQ with a line that has no vendor selected, or a finalized RFQ still lets you edit quotes.

### 1.7 RFQ — ACE rate visible for comparison

- While comparing vendor quotes on an RFQ line.
- **Check:** the rate that was fixed in the Accepted Cost Estimate for that item is visible alongside the vendor quotes, so you can see at a glance whether a vendor's offer is above or below the approved rate.
- **Report as a bug if:** the ACE rate is missing from the comparison view entirely.

### 1.8 RFQ → Purchase Order creation

- Open a **finalized** RFQ.
- **Check:** there is a **Create PO** button/link, and it takes you to a new Purchase Order pre-filled with that RFQ's vendor, line items, and rates.
- **Report as a bug if:** the button is missing on a finalized RFQ, or the created PO doesn't carry over the right vendor/items/rates.

### 1.9 Navigation order — "Vendors & Supply Chain" group

- Look at the left nav group above Purchase Orders.
- **Check:** the order reads top-to-bottom: **Vendor Management → Accepted Cost Estimate → Supply/Service Requirement → RFQs → Purchase Orders.**
- **Report as a bug if:** the order is different, or any of these items is missing.

### 1.10 Navigation order — "Stores" group (Requisitions/MR after GRN, before Stock)

- Look at the left nav group labeled **Stores**.
- **Check:** the order reads: **GRN → Material Requisitions (MR) → Stock Statement → Wastage → Material Receipts.**
- **Report as a bug if:** Material Requisitions (MR) appears before GRN, or Stock Statement appears before Material Requisitions (MR).

### 1.11 "Requisitions" renamed to "Supply/Service Requirement"

- Still in the left nav, under "Vendors & Supply Chain."
- **Check:** the item that lets you raise a material/service need (before RFQ) is labeled **"Supply/Service Requirement,"** not "Requisitions." Open it and check the page title matches.
- **Note:** this is intentionally a label-only change — do **not** expect the URL in the address bar to say "requirement"; it will still say `requisitions`. That's expected, not a bug (see `docs/OPEN_QUESTIONS.md` #85 for why).
- **Report as a bug if:** the nav label or page heading still says "Requisitions" instead of "Supply/Service Requirement," or if the *Stores* module (Material Requisitions / MR) is the one that got renamed instead — the rename belongs only on the pre-RFQ module, not the post-GRN one.

### 1.12 Flow of channel — end-to-end walkthrough

This is the big one: walk the whole chain once, start to finish, switching roles as noted, to make sure each stage actually feeds the next.

1. **Customer converted** — as `admin`, go to **Leads**, convert a lead to a **Customer** (or open an existing customer).
2. **Contract prepared** — go to **Contracts**, create/open a contract for that customer.
3. **Documents prepared** — go to **Documents**, confirm design/estimation documents can be attached against the project.
4. **Vendors onboarded** — go to **Vendor Management**, confirm both supply-type and service-type vendors exist (check the "Nature" field: Supply / Service / Service & Supply).
5. **ACE prepared** — go to **Accepted Cost Estimate**, confirm unit rates exist for the project's items.
6. **Supply/Service Requirement raised** — log in as `engineer@brickbasket.co.in`, go to **Supply/Service Requirement**, raise a new one against an ACE item (and try one as a free-entry "additional" line not tied to ACE).
7. **RFQ created from it** — back as `purchaser`, go to **RFQs**, create an RFQ from that requirement, compare vendor quotes, finalize.
8. **PO created from RFQ** — from the finalized RFQ, click **Create PO**, confirm it (status moves from Draft → eventually **Approved → Released → Issued** — this app uses a two-level approval before a PO can be released/issued; log in as `approver@brickbasket.co.in` to approve it).
9. **PO appears in the orders list** — go to **Purchase Orders**, confirm it's listed.
10. **GRN created on receipt** — log in as `store@brickbasket.co.in`, go to **GRN**, create a GRN **against that issued PO** (a GRN can only be created against a PO whose status is "Issued" — trying it on a draft/unapproved PO should not be possible; that restriction is correct behavior, not a bug).
11. **Material Requisition from updated stock** — still as `store` (or `engineer` raising it), go to **Material Requisitions (MR)**, confirm the material received in GRN is available to requisition from site stock.
12. **Stock statement reflects it** — go to **Stock Statement**, confirm quantities/values reflect the GRN-received and MR-issued material.
13. **Schedule/DPR controlled** — log in as `pm@brickbasket.co.in` or `engineer`, go to **Schedule** and **Daily Progress (DPR)**, confirm progress entries can be logged against the project schedule.
14. **Site update OK** — go to **Site Updates**, confirm a status/photo update can be logged for the project.

- **Report as a bug if:** any step in this chain is simply impossible to do, or data from one stage doesn't show up where the next stage expects it (e.g., a GRN'd item never appears as requisitionable stock).
- **Report as a question, not a bug, if:** something behaves in a way the writeup didn't explicitly specify (e.g., exact approval levels, exact MR status wording) — several of these are flagged as open, owner-confirmable decisions in `docs/OPEN_QUESTIONS.md` #85 and aren't wrong, just unconfirmed.

---

## 2. Broader regression pass (other documents)

Once Section 1 is done, use this section to sanity-check the rest of the app. You don't need to do all of this in one sitting — it's organized so you can tackle one area at a time.

### 2.1 Role boundaries (per `docs/ROLES_AND_PERMISSIONS.md`)

- Log in as each demo role in turn and confirm the left nav **only** shows what that role should see (e.g., `store_personnel` should not see Vendor Management or RFQs; `finance` should not see GRN).
- Try typing a URL directly for a module you shouldn't have access to (e.g., as `finance`, type `/admin/vendors` in the address bar).
- **Expected result:** you're shown a "you don't have access" (403) message, not the actual page content, and not a crash.
- **Report as a bug if:** you can see or edit a module your role shouldn't have access to via direct URL, even if it's hidden from the nav.

### 2.2 Status transitions (per `docs/STATUS_DEFINITIONS.md`)

For each of these, confirm you **cannot** skip a step or go backward in a way that shouldn't be allowed:

- **Supply/Service Requirement:** Draft → Submitted → Approved/Rejected. A rejected one should be revisable, not stuck.
- **RFQ:** In Comparison → Finalized (one-way; finalizing should lock editing of quotes/vendors).
- **Purchase Order:** Draft → Submitted → Approved → Released → Issued (two-level approval). Confirm you can't jump straight from Draft to Issued, and that a GRN can only be created once a PO reaches Issued.
- **Material Requisition (Stores):** Draft → Submitted → Approved/Rejected → Issued.
- **Report as a bug if:** any of these lets you skip a required step, or a rejected item can't be edited and resubmitted.

### 2.3 Form validation (per `docs/VALIDATION_RULES.md`) — known gaps, don't report these

A few validation gaps are already known and intentionally not enforced in this build. Don't report these as new bugs — they're tracked already:

- **GRN:** a line's received quantity isn't capped to the PO's ordered quantity (you can over-receive). Also, picking Material = "Other" doesn't force you to type a name for it.
- **Material Requisition:** choosing a "predefined" (ACE-linked) line doesn't force you to actually pick the ACE item.
- These are logged in `docs/OPEN_QUESTIONS.md` — feel free to flag if you think they *should* be enforced, but they're not new defects.

Do check these, which **should** be enforced and would be real bugs if not:

- Required fields (PAN on vendor form if you made it mandatory in your own policy — currently optional by design; email/phone formats; dates) show a clear red error message under the field, not a browser popup, when left blank or invalid.
- Numeric fields (rates, quantities, amounts) reject negative numbers where that doesn't make sense (e.g., RFQ rate must be > 0).

### 2.4 General UI consistency

- **Tables:** every list/table in the app (Projects, Customers, MRC, DPR, Contracts, GRN, RFQ comparison, etc.) should have a sticky header that stays visible when scrolling, alternating row shading, and right-aligned, evenly-spaced numeric columns. This was deliberately made consistent across the whole app — flag any table that looks different from the others.
- **Empty states:** a list with no data yet should show a friendly "No [thing] yet" message with an icon, never a blank white page.
- **Loading states:** while data is loading, you should see skeleton placeholders, not a blank page or layout jump.
- **Error states:** if something fails to load, you should see a clear message with a **Retry** button, not a raw error or crash.

### 2.5 Customer portal (separate from admin)

- Log in as `customer@brickbasket.co.in`.
- **Check:** you land in a completely different, simpler layout (`/dashboard/...`) — My Projects, Site Updates, Contracts, Documents, Material Receipts, Payments, Notifications, Profile. No admin-only modules should be visible or reachable.
- **Report as a bug if:** the customer can reach any `/admin/...` URL directly, or admin-only data leaks into the customer view.
- **Check:** open **Profile** (left nav, bottom) — it shows the signed-in customer's name, email, and account type, read-only.
- **Expected, not a bug:** there's no way to edit these details from the Profile page — a note on the page says to contact BrickBasket directly instead. This is deliberate for this build stage, not a missing feature: there's no backend endpoint yet for a customer to update their own name/email/phone, so the page doesn't pretend to offer one (`src/app/(portal)/dashboard/profile/page.tsx`; see `docs/OPEN_QUESTIONS.md` #89). Whether self-service editing should be added later is an open owner decision, not a defect in this build.
- **Report as a bug if:** the Profile page is missing name, email, or account type, or shows a different customer's details than the one signed in.

---

## 3. How to report a bug (so it gets fixed fast)

For each issue found, note down:

1. **Which account** you were logged in as (e.g., `purchaser@brickbasket.co.in`).
2. **Where** — the exact page/URL, or the nav path you clicked (e.g., "Vendor Management → open any vendor → Documents → Attach Document").
3. **What you did** — the exact clicks/typing, in order.
4. **What you expected** to happen (quote the relevant line from the writeup or this checklist if it helps).
5. **What actually happened** — ideally a screenshot.

Send that list back in chat (one issue per bullet is easiest to act on) and it'll be checked against the code and fixed, with the corrected code pushed straight to your VS Code project the same way every other fix in this project has been delivered.

**Before reporting, double check it isn't listed under an "Expected, not a bug" note above** — several things in this demo build (no real file storage, no real backend validation, 2-hour login expiry, any-password login) are intentional for this stage and not defects.
