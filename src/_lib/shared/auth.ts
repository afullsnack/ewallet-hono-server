import { betterAuth } from "better-auth";
import { expo } from "@better-auth/expo";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../../db"


export const baseURL = process.env.BETTER_AUTH_URL;
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  plugins: [
    expo()
  ],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    google: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`
    },
    apple: {
      enabled: false,
      clientId: ``,
      clientSecret: ``,
      clientKey: ``
    }
  },
  advanced: {
    cookiePrefix: 'ewallet'
  },
  trustedOrigins: [
    'ewallet://',
    'exp://192.168.1.38:8081/--/home',
    'exp://192.168.1.38:8081/--',
    'exp://172.20.10.2:8081/--/home',
    'exp://172.20.10.2:8081/--'
  ]
});
