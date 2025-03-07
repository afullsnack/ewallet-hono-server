import { betterAuth } from "better-auth";
import { expo } from "@better-auth/expo";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../../db"


export const baseURL = `https://4076-2c0f-2a80-9a-2d10-b59c-78ad-66ec-e9f8.ngrok-free.app`;
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
      redirectURI: `${baseURL}/api/auth/callback/google`
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
  trustedOrigins: ['ewallet://', 'exp://192.168.1.38:8081/--/home', 'exp://192.168.1.38:8081/--']
});
