# Google Developer Group on Campus Yonsei University Website

## Description

This project is a website created to introduce the Google Developer Group on Campus Yonsei University and manage its projects and activities.

## Tech Stack

### Front End

- React 19
- Next.js 15
- Tailwind CSS
- Jotai

### Back End

- Next.js Route Handler
- Next.js Actions
- Drizzle ORM
- Auth.js
- PostgreSQL
- Cloudflare R2 (for image storage)

## Commands

1. Install Packages

```bash
pnpm i
```

2. Dev Mode

```bash
pnpm dev
```

3. Build

```bash
pnpm build
```

4. Start Project

```bash
pnpm start
```

5. DB Push (drizzle generate & drizzle migrate)

```bash
pnpm db:push
```

6. DB Studio

```bash
pnpm db:studio
```

# How to Deploy

1. Copy .env.example to .env and fill in the required environment variables.
2. Create a PostgreSQL database and set the connection string in the .env file.
3. Run the following command to push the database schema:

```bash
pnpm db:push
```

4. Build the project:

```bash
pnpm build
```

5. Start the project:

```bash
pnpm start
```
