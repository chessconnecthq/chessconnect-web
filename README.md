# ♟️ ChessConnect

**India's chess coach marketplace** — connecting students with FIDE-rated chess coaches across India.

🌐 **Live site:** [chessconnecthq.github.io/chessconnect-web](https://chessconnecthq.github.io/chessconnect-web/)

---

## About

ChessConnect is a platform where FIDE-rated chess coaches can list themselves for free and students can find, filter and directly contact coaches — no middleman, no commission.

- Coaches register using their FIDE ID — ratings are verified instantly from the global FIDE database
- Students can search by city, rating, title, level, language and coaching mode
- Direct contact via WhatsApp or call — one tap, no friction

---

## Pages

| Page | Description |
|------|-------------|
| `index.html` | Homepage + coach registration flow |
| `coaches.html` | Student-facing coach search & filter directory |
| `coach.html` | Individual coach profile page (dynamic, loads by ID) |
| `dashboard.html` | Coach dashboard — edit profile, go live, share profile link |
| `analytics.html` | Coach analytics — profile views, WhatsApp taps, call taps |

---

## Free Tools

| Tool | Description |
|------|-------------|
| `chess-clock.html` | Online chess clock for casual and tournament play |
| `brochure-maker.html` | Generate FIDE-standard tournament brochures as PDF |
| `scoresheet-generator.html` | Print FIDE-standard scoresheets with custom branding |

---

## Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript — no frameworks
- **Backend / Database:** Supabase (PostgreSQL + Auth)
- **Authentication:** Google OAuth via Supabase
- **FIDE Data:** 1.8M+ player database uploaded to Supabase
- **Hosting:** GitHub Pages

---

## Status

🚀 **Phase 1 — Live**
Individual FIDE-rated chess coaches only. No academies or tournaments yet.

---

## Contact

📧 chessconnect.in@gmail.com  
🌐 [chessconnecthq.github.io/chessconnect-web](https://chessconnecthq.github.io/chessconnect-web/)
