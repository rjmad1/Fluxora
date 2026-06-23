# End-User Guide: Publishing & Social Scheduling

This manual describes how to use Fluxora to schedule organic content campaigns, configure platform variants, and coordinate review loops.

---

## 🔗 Connecting Social Channels

To authorize a new social media profile:
1. Navigate to **Connected Accounts** in the navigation panel.
2. Click **Connect Channel** and select the target provider (e.g., *LinkedIn, X, Facebook, YouTube*).
3. The platform will redirect to the provider's OAuth authorization portal.
4. Log in, grant the necessary permissions, and confirm.
5. The account credentials will be vaulted securely inside **HashiCorp Vault**, and the channel profile will appear in your workspace dashboard.

---

## ✍️ Unified Omnichannel Composer

Fluxora lets creators write once and distribute everywhere while tailoring post formats to each network's constraints:

1. **Write Base Content:** Open the **Composer**, enter the primary copy, and upload media assets (images/videos).
2. **Platform Specific Overrides:** Click on the platform-specific tabs (e.g., *LinkedIn, X, Instagram*) to customize posts:
   - **X Override:** Truncate copy to respect the character limits.
   - **Instagram Override:** Enforce image asset aspect ratios and optimize hashtags.
   - **LinkedIn Override:** Customize text layouts and links.
3. **Verify Previews:** Review the live layout previews on the side panel before scheduling.

---

## 📅 Campaigns & Content Calendars

* **Scheduling:** Choose a future date/time or add posts to the automated posting queues.
* **Anti-Ban Staggering:** Fluxora's **Distribution Intelligence Engine** spreads posting times automatically across profiles by 3-minute offsets to prevent spam detection flags.
* **Asset Optimization:** Integrated ffmpeg/sharp engines compile, resize, and convert image and video attachments to meet social network rules before publish.

---

## 🔒 Client Approval Loops

For marketing agencies managing client workspaces:
1. When composing a post, click **Request Approval** instead of Schedule.
2. Fluxora creates a unique, secure, tokenized review link (e.g. `/w/share/review?token=abc123xyz`).
3. Send this link to the external reviewer or client.
4. The client opens the link, views the post previews, adds comments, and clicks **Approve** or **Reject**.
5. Approved posts move to the active schedule queues automatically.

---

## 📈 Analyzing Engagement Metrics

The **Analytics Dashboard** aggregates post click, view, and impression metrics:
- **ClickHouse Ingest:** Track real-time views and interactions.
- **ROI Calculations:** Track campaign effectiveness and click-through rates.
