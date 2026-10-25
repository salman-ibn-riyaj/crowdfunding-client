# Crowdfunding Platform — Client

The frontend of a credit-based crowdfunding platform. Creators publish campaigns, Supporters back them with credits, and Admins review everything. Built with **Next.js** and **React**, talking to a separate Express API.

**Live site:** https://crowdfunding-client-liard.vercel.app
**Server repo:** `YOUR_SERVER_REPO_URL`
**API (production):** https://crowdfunding-server-ashy.vercel.app

---

## Features

### Public
- Browse all active campaigns and open a campaign detail page
- Home page with hero slider, top funded campaigns and testimonials
- Light / dark theme toggle
- Responsive layout

### Authentication
- Email and password sign up / sign in (minimum 12-character password)
- Google sign-in (shown only when enabled on the server)
- Role selection after first sign in: **Supporter** or **Creator**
- Session handled by Better Auth with secure, HttpOnly cookies

### Creator dashboard
- Summary of total campaigns, active campaigns and credits raised
- Create a campaign (title, story, category, funding goal, minimum contribution, deadline, reward info, image upload)
- Update, delete or archive campaigns (campaigns with contribution history are archived, not deleted)
- Review pending contributions: approve, or reject and refund the Supporter's credits
- Request withdrawals (20 credits = $1.00, minimum earned balance 200 credits) and view payment history

### Supporter dashboard
- Contribute credits to campaigns and track contribution status

### Admin dashboard
- Review and approve or reject new campaigns
- Process withdrawal requests

### Notifications
- In-app notification popup with an unread badge
- Mark all as read

---

## Tech stack

| Area | Tools |
| --- | --- |
| Framework | Next.js (App Router, Turbopack), React |
| Auth | Better Auth (client) |
| Icons | react-icons |
| Images | ImgBB (uploaded through the server) |
| Deployment | Vercel |

---

## Getting started

### Prerequisites
- Node.js 20 or newer
- The [server](../server) running locally, or its production URL

### Installation

```bash
git clone YOUR_CLIENT_REPO_URL
cd crowdfunding-client
npm install
```

### Environment variables

Create a `.env.local` file in the project root:

```env
# URL of the Express API
NEXT_PUBLIC_API_URL=http://localhost:4000
```

> Use the variable name your code actually reads (check `src/lib/*-api.jsx` and `src/lib/auth-client.jsx`). Never commit `.env.local`.

### Run locally

```bash
npm run dev
```

Open http://localhost:3000. Start the server first, otherwise API calls will fail.

### Production build

```bash
npm run build
npm start
```

---

## Project structure

```text
src/
├── app/
│   ├── campaigns/[id]/        # Campaign detail page
│   ├── dashboard/             # Role-based dashboard entry
│   ├── login/ register/       # Auth pages
│   └── ...
├── components/
│   ├── dashboard/             # CreatorDashboard, DashboardShell, ...
│   ├── home/                  # HeroSlider, TopFundedCampaigns, TestimonialsSlider
│   ├── ImageUpload.jsx
│   ├── NotificationPopup.jsx
│   ├── Navbar.jsx
│   └── SiteFooter.jsx
└── lib/                       # API helpers
    ├── auth-client.jsx
    ├── account-api.jsx
    ├── admin-api.jsx
    ├── creator-api.jsx
    └── notifications-api.jsx
```

---

## Deployment (Vercel)

1. Import the repository in Vercel.
2. Add the environment variable above, pointing to the deployed server URL.
3. Deploy.

The client and server run on different domains, so the server must:
- allow this client's origin in CORS (`credentials: true`), and
- set session cookies with `SameSite=None; Secure` in production.

All client requests that need the session must be sent with `credentials: "include"`.

---

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `ADMIN_EMAIL` | `ADMIN_PASSWORD` |
| Creator | `CREATOR_EMAIL` | `CREATOR_PASSWORD` |
| Supporter | `SUPPORTER_EMAIL` | `SUPPORTER_PASSWORD` |

---

## Author

**Salman** — Junior MERN stack developer
GitHub: [salman-ibn-riyaj](https://github.com/salman-ibn-riyaj) · Portfolio: https://salman-shah-portfolio.vercel.app