# GDGoC Yonsei Official Website 🌐

This is the official website of Google Developer Groups on Campus Yonsei (GDGoC Yonsei).
It is built with Next.js 16 (App Router), powered by Drizzle ORM with PostgreSQL, and integrates modern web technologies to ensure scalability, performance, and maintainability.

GDGoC Yonsei Official Website: https://gdgoc.yonsei.ac.kr

⸻

🚀 Tech Stack

- Framework: Next.js 16 (App Router)
- Language: TypeScript, React 19
- Styling: Tailwind CSS 4, Typography Plugin
- Database: PostgreSQL + Drizzle ORM
- Authentication: NextAuth.js v5 + Drizzle Adapter + WebAuthn
- Email: Resend + React Email
- Storage: Cloudflare R2 (with presigned URLs for uploads)
- Markdown: react-markdown, rehype-sanitize
- Animation: Motion
- Utilities: Zod (validation), Jotai (state management)

⸻

🛠️ Setup & Development

1. Clone the Repository

   ```bash
   git clone https://github.com/gdgoc-yonsei/gdgoc-yonsei-web.git
   cd gdgoc-yonsei-web
   ```

2. Install Dependencies

   ```bash
   pnpm install
   ```

3. Configure Environment Variables

   ```bash
   cp .env.example .env
   ```

4. Run Database Migration

   ```
   pnpm db:push
   ```

5. (Optional) Seed local development data

   Populates a **local** Postgres with realistic dev data (1 generation, 7
   parts, ~60 sessions, 8 projects) so the home Activity Heatmap, projects
   showcase, and About stats/timeline render with content.

   ```
   pnpm db:seed
   ```

   - Re-runnable: only the previous `dev-seed-` marked rows are removed and
     re-inserted (never `TRUNCATE`).
   - Local guard: refuses to run unless the DB host is localhost-like; pass
     `--force` to override for a non-local host.
   - Playwright e2e (`pnpm test:e2e`) resets the database, so re-run
     `pnpm db:seed` afterward.

6. Start Development Server

   ```
   pnpm dev
   ```

Your app will be available at http://localhost:3000.

⸻

📦 NPM Scripts

- pnpm dev → Run development server (Next.js + Turbopack)
- pnpm build → Run DB migration & build the project
- pnpm start → Run production server
- pnpm db:studio → Open Drizzle Studio
- pnpm format → Format code with Prettier
- pnpm lint → Run ESLint checks

🧱 Architecture Docs

- Caching and invalidation guide: [`docs/architecture/caching.md`](./docs/architecture/caching.md)

⸻

🤝 Contributing

We welcome contributions via issues and pull requests.
For external contributors, please open an issue before submitting a PR.

⸻

📜 License

This project is licensed under the MIT License.
