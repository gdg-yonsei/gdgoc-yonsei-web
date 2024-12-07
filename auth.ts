import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import GitHub from "next-auth/providers/github";
import db from "@/db";
import { verificationTokens } from "@/db/schema/verfication-tokens";
import { authSessions } from "@/db/schema/auth-sessions";
import { accounts } from "@/db/schema/accounts";
import { users } from "@/db/schema/users";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: authSessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [GitHub],
});
