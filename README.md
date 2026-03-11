# ♟️ ChessConnect

**The global chess coach marketplace** — connecting students with FIDE-rated chess coaches worldwide.

🌐 **Live site:** [chessconnecthq.github.io/chessconnect-web](https://chessconnecthq.github.io/chessconnect-web/)

---

## About

ChessConnect is a platform where FIDE-rated chess coaches can list themselves for free and students anywhere in the world can find, filter, and directly contact coaches — no middleman, no commission.

- Coaches register using their FIDE ID — credentials verified instantly from a 1.8M+ FIDE player database
- Students can search by city, country, rating, title, level, language, and coaching mode
- Direct contact via WhatsApp or call — one tap, no friction
- All coaching sessions and fee arrangements happen directly between coach and student

---

## Pages

| Page | Description |
|------|-------------|
| `index.html` | Homepage + coach registration flow |
| `coaches.html` | Student-facing coach search & filter directory |
| `coach.html` | Individual coach profile page (dynamic, loads by ID) |
| `dashboard.html` | Coach dashboard — edit profile, go live, share profile link |
| `analytics.html` | Coach analytics — profile views, WhatsApp taps, call taps |
| `careers.html` | Careers page (coming soon) |
| `tournaments.html` | Tournament listings (coming soon — Phase 2) |

---

## Free Tools

| Tool | Description |
|------|-------------|
| `chess-clock.html` | Online chess clock — works offline via service worker |
| `brochure-maker.html` | Generate FIDE-standard tournament brochures as PDF |
| `scoresheet-generator.html` | Print FIDE-standard scoresheets with custom branding |

---

## Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript — no frameworks, no build system
- **Backend / Database:** Supabase (PostgreSQL + Auth + Storage)
- **Authentication:** Google OAuth only (via Supabase)
- **FIDE Data:** 1,792,530 player records uploaded to Supabase (March 2026 FIDE export)
- **Analytics:** Google Analytics 4 (`G-1HB4X5E6HH`)
- **Hosting:** GitHub Pages

---

## Database Schema (Supabase)

### `coaches`
| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint | Auto-increment primary key |
| `created_at` | timestamptz | Auto |
| `fide_id` | text | Unique, used for FIDE verification |
| `full_name` | text | Required |
| `chess_title` | text | GM, IM, FM, CM, WGM etc. |
| `fide_rating` | integer | Classical rating |
| `fide_rapid` | integer | Rapid rating |
| `fide_blitz` | integer | Blitz rating |
| `fide_rating_type` | text | Which rating type to display as primary |
| `country` | text | From FIDE data |
| `whatsapp` | text | Required, displayed publicly |
| `city` | text | Required |
| `pincode` | text | Optional, not displayed publicly |
| `coaching_mode` | text | Online / Offline / Both |
| `levels_taught` | text[] | Array |
| `languages` | text[] | Array |
| `bio` | text | Min 100 words |
| `fees` | integer | Per session |
| `fees_currency` | text | Default INR |
| `trial_available` | boolean | Default false |
| `photo_url` | text | Approved photo (public) |
| `photo_pending_url` | text | Awaiting admin review |
| `photo_reviewed` | boolean | Default false |
| `is_live` | boolean | Profile visible to students |
| `is_deleted` | boolean | Soft delete flag |
| `experience` | text | Years of coaching experience |
| `auth_user_id` | uuid | Links to Supabase auth.users |
| `email` | text | From Google OAuth, not public |
| `google_profile_url` | text | Optional |
| `website_url` | text | Optional, displayed publicly |
| `chess_com_url` | text | Optional, displayed publicly |
| `lichess_url` | text | Optional, displayed publicly |
| `youtube_url` | text | Optional, displayed publicly |
| `achievements` | text | Optional, displayed publicly |
| `certifications` | text | Optional, displayed publicly |

### `fide_players`
| Column | Type | Notes |
|--------|------|-------|
| `fide_id` | text | Primary key |
| `name` | text | |
| `country` | text | |
| `title` | text | |
| `rating` | integer | Classical |
| `rapid_rating` | integer | |
| `blitz_rating` | integer | |
| `is_active` | boolean | Default true |

**1,792,530 rows** — March 2026 FIDE export. Read-only reference table.

### `enquiries`
Logs student interactions with coach profiles.

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint | |
| `coach_id` | bigint | FK to coaches |
| `type` | text | `view`, `whatsapp`, `call` |
| `student_city` | text | Detected via ipapi.co |
| `created_at` | timestamptz | |

### `profile_reports`
| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint | |
| `coach_id` | bigint | FK to coaches |
| `coach_name` | text | |
| `reason` | text | |
| `details` | text | |
| `reporter_email` | text | |
| `status` | text | Default `pending` |
| `created_at` | timestamptz | |

### `registration_errors`
Logs errors during coach registration and triggers admin email via EmailJS.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Auto |
| `source` | text | Which step failed |
| `error_code` | text | |
| `error_msg` | text | |
| `coach_name` | text | |
| `fide_id` | text | |
| `city` | text | |
| `country` | text | |
| `email` | text | |
| `step` | text | Registration step where error occurred |
| `user_agent` | text | Browser/device info |
| `created_at` | timestamptz | |

---

## Storage

| Bucket | Public | Purpose |
|--------|--------|---------|
| `coach-photos` | ✅ Yes | Coach profile photos. Path: `{auth_user_id}/pending.ext` |

Photos are uploaded as `photo_pending_url`, manually reviewed by admin, then promoted to `photo_url`.

---

## Status

🚀 **Phase 1 — Live**
Individual FIDE-rated chess coaches only. Academies and tournament listings coming in Phase 2.

---

## Legal

- [Privacy Policy](privacy-policy.html) — GDPR + India DPDP Act 2023 compliant
- [Terms of Service](terms.html) — Global platform, governed by Indian law

---

## Contact

📧 chessconnect.in@gmail.com
🌐 [chessconnecthq.github.io/chessconnect-web](https://chessconnecthq.github.io/chessconnect-web/)
