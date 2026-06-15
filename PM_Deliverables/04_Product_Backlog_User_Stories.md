# Product Backlog & User Stories
## Fluxora: Social Media Blast (Phase 1 — Foundation & Core Publishing)

This document contains the engineering-ready backlog for Phase 1 features of Fluxora. Each user story is written following the **3 C's framework (Card, Conversation, Confirmation)** and respects the **INVEST criteria** (Independent, Negotiable, Valuable, Estimable, Small, Testable).

---

### Backlog Overview

| Story ID | Title | User Role | Action | Business / User Value |
| :--- | :--- | :--- | :--- | :--- |
| **US-01** | Multi-Network OAuth Connection & Secure Token Vaulting | Agency Alex / Marketing Mary | Authenticate and link social accounts securely | Enables account linking without sharing primary passwords; secures tokens in HashiCorp Vault. |
| **US-02** | Unified Composer with Real-Time Validation | Marketing Mary | Write copy, upload media, and preview side-by-side | Eliminates separate formatting; prevents character limit and format violations before dispatching. |
| **US-03** | Centralized Asset Management & Auto-Sizing | Marketing Mary | Upload and tag images/videos with auto-resizing | Simplifies asset reuse and automatically crops media to correct platform dimensions. |
| **US-04** | Durable Scheduling Queue & Drag-and-Drop Calendar | Marketing Mary | Future-date posts and reschedule via calendar board | Enables advance campaign planning and reduces scheduling updates to a single click. |
| **US-05** | Reusable Posting Presets & Brand Signatures | Marketing Mary | Group profiles and auto-append compliance footers | Standardizes posting operations and enforces branding/compliance. |
| **US-06** | Multi-Tenant Workspace Isolation | Agency Owner Alex | Separate logins, client files, and queues | Guarantees client confidentiality and eliminates accidental cross-tenant posting. |

---

### Detailed User Stories

#### US-01: Multi-Network OAuth Connection & Secure Token Vaulting

**Description:**
As a Social Media Manager (Marketing Mary),
I want to authenticate and link Facebook Pages, Instagram Business profiles, LinkedIn Pages, TikTok, and X (Twitter) accounts via secure OAuth 2.0 consent screens,
so that Fluxora can publish content on my behalf without requiring me to share primary passwords.

**Design:**
* Figma Design: [Unified Connections Screen Mockup](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/PM_Deliverables/design_placeholders.md#US-01)

**Acceptance Criteria:**
1. **Consent Flow**: Clicking the "Connect" button for any supported network must open the standard, official third-party OAuth consent screen in a popup window.
2. **Token Rotation**: Upon successful authentication, the backend must encrypt and store the OAuth Refresh Token in HashiCorp Vault, returning only a safe reference metadata ID to the PostgreSQL transactional database.
3. **Connection Status**: The UI must display the connected page/account name, profile avatar, token expiration status, and a green "Connected" indicator badge.
4. **Disconnect Action**: Users must be able to revoke connection access, which must trigger the deletion of the token from HashiCorp Vault and mark the profile metadata status as "Disconnected" in PostgreSQL.
5. **Security Isolation**: Social profiles connected in Workspace A must never be visible, accessible, or editable by users logged into Workspace B.

---

#### US-02: Unified Composer with Real-Time Validation

**Description:**
As a Social Media Manager (Marketing Mary),
I want to write campaign copy, upload attachments, select destination channels, and see real-time, side-by-side previews of my posts,
so that I can verify my content looks perfect on each network before publishing.

**Design:**
* Figma Design: [Omnichannel Unified Composer Dashboard](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/PM_Deliverables/design_placeholders.md#US-02)

**Acceptance Criteria:**
1. **Target Selection**: The composer must display checkbox selectors for all connected social accounts in the current active workspace.
2. **Side-by-Side Previews**: Selecting a channel checkbox must dynamically render a mockup preview tab (representing the post as it will look live on LinkedIn, Instagram, TikTok, or X) in the right-hand panel.
3. **Character Limit Counter**: The composer must dynamically count characters and display warnings if rules are violated (e.g., highlighting text in red above 280 characters for X, while leaving it valid for LinkedIn).
4. **Media Validation**: If TikTok is selected, the UI must enforce that at least one video (MP4) is attached, blocking the "Publish" button if only images are uploaded.
5. **Channel Overrides**: Users must be able to click a "Customize copy per network" button to fine-tune text, hashtags, or links specifically for a single selected network within the same compose session.

---

#### US-03: Centralized Asset Management & Auto-Sizing

**Description:**
As a Social Media Manager (Marketing Mary),
I want to upload, tag, and organize images and video files in a central library, and have the system automatically resize them for platform-specific ratios,
so that I don't have to manually format assets in external tools.

**Design:**
* Figma Design: [Centralized Asset Library and Media Editor](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/PM_Deliverables/design_placeholders.md#US-03)

**Acceptance Criteria:**
1. **S3/MinIO Ingestion**: Uploads must write directly to MinIO (local dev) or AWS S3 cloud storage, saving file name, size, type, and URL path in PostgreSQL.
2. **Metadata Tagging**: Users must be able to assign searchable tags (e.g., "Summer Launch", "Promo Video") and filter assets by tag and file type.
3. **Auto-Crop Presets (Sharp)**: The media manager must offer an "Edit Aspect Ratio" menu with options for Square (1:1 for Instagram), Landscape (16:9 for X/LinkedIn), and Portrait (9:16 for TikTok/Reels).
4. **Backend Processing**: Selecting a crop preset must trigger the backend worker running the Sharp library to process the image and save the output as a new asset variant.
5. **Processing Latency**: Image resizing and compression must take **$\le$ 3.0 seconds** per asset, displaying a loading progress bar to the user.

---

#### US-04: Durable Scheduling Queue & Drag-and-Drop Calendar

**Description:**
As a Social Media Manager (Marketing Mary),
I want to schedule my omnichannel posts for future dates and view them on a visual calendar board,
so that I can plan campaigns in advance and reschedule them with a single click.

**Design:**
* Figma Design: [Weekly/Monthly Editorial Calendar View](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/PM_Deliverables/design_placeholders.md#US-04)

**Acceptance Criteria:**
1. **Calendar Layout**: The system must provide toggleable weekly and monthly calendar views displaying thumbnail cards of all scheduled posts.
2. **Drag-and-Drop Action**: Dragging a post card from Friday to Monday on the calendar UI must trigger a PATCH API request to update the scheduled publish timestamp in PostgreSQL.
3. **Queue Ingestion Performance**: The time from clicking the "Schedule" button in the composer to the UI showing queue confirmation must be **$\le$ 2.0 seconds**.
4. **Temporal/BullMQ Integration**: The backend scheduling queue (BullMQ/Redis) must fetch and lock jobs at the precise execution timestamp, changing the post state from `Scheduled` to `In-Flight`.
5. **State Governance**: Scheduled posts can be edited or cancelled by the author at any time, but posts marked as `In-Flight` or `Dispatched` must be locked from editing.

---

#### US-05: Reusable Posting Presets & Brand Signatures

**Description:**
As a Social Media Manager (Marketing Mary),
I want to save target profiles as reusable posting presets and set up default disclosures or footers,
so that I can maintain brand consistency and run campaigns with one click.

**Design:**
* Figma Design: [Posting Presets and Branding Admin Settings](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/PM_Deliverables/design_placeholders.md#US-05)

**Acceptance Criteria:**
1. **Preset Definition**: Users must be able to create a "Preset Group" containing a specific subset of connected profiles (e.g., "Agency Client A - All Handles").
2. **One-Click Apply**: Selecting a Preset Group in the Composer must immediately toggle all corresponding destination checkboxes.
3. **Branded Footer Injection**: Users must be able to set a "Branded Signature" text block per platform (e.g., "Sponsored by [BrandA]" or a standard disclaimer).
4. **Automatic Appending**: The scheduling queue worker must automatically append the designated signature to the end of the post copy at the moment of dispatch, without altering the user's draft in the composer.
5. **Length Validation Safeguard**: The system must validate that the combined length of the post copy + injected signature does not exceed the platform's character limit, flagging an error to the user during composition.

---

#### US-06: Multi-Tenant Workspace Isolation

**Description:**
As an Agency Owner (Agency Alex),
I want my team members to operate in isolated workspaces with dedicated billing and account lists,
so that I can guarantee client data privacy and prevent cross-client posting errors.

**Design:**
* Figma Design: [Workspace Switcher & Organization Admin Console](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/PM_Deliverables/design_placeholders.md#US-06)

**Acceptance Criteria:**
1. **Workspace Separation**: The database must enforce strict foreign key constraints separating all data tables (accounts, posts, media assets, tokens) by Workspace ID.
2. **Security Gateway (IAM)**: Every API call passing through the Ingress API Gateway must validate that the user's JWT contains permissions for the requested Workspace ID, returning HTTP 403 Forbidden if violated.
3. **Workspace Switcher UI**: Logged-in users must see a workspace drop-down menu in the top navigation bar, allowing them to switch contexts. Switching context must reload the calendar and media library for the new workspace.
4. **Isolated Queues**: Scheduled queues (Redis) must process posts with metadata scoped strictly by Workspace ID, preventing any cross-contamination during bulk upload operations.
5. **Billing Isolation**: Usage limits (e.g., number of profiles, asset storage capacity) must be calculated and enforced independently per workspace based on its subscription tier.
