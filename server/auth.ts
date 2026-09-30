import { betterAuth, type BetterAuthOptions } from "better-auth";
import { username } from "better-auth/plugins";
import { scrypt, timingSafeEqual, randomBytes } from "node:crypto";

// Native scrypt keeps the Better Auth format without a JavaScript KDF fallback.
async function key(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      64,
      { N: 16384, r: 16, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
  });
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${(await key(password, salt)).toString("hex")}`;
}
export async function verifyPassword({
  hash,
  password,
}: {
  hash: string;
  password: string;
}) {
  const [salt, encoded] = hash.split(":");
  if (
    !/^[a-f0-9]{32}$/.test(salt ?? "") ||
    !/^[a-f0-9]{128}$/.test(encoded ?? "")
  )
    return false;
  return timingSafeEqual(
    await key(password, salt),
    Buffer.from(encoded, "hex"),
  );
}
export const authOptions = {
  appName: "Itinera",
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    password: { hash: hashPassword, verify: verifyPassword },
  },
  session: {
    expiresIn: 7200,
    disableSessionRefresh: true,
    cookieCache: { enabled: false },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: { "/sign-in/username": { window: 300, max: 5 } },
  },
  plugins: [
    username({
      usernameValidator: (value) => /^[a-z0-9_-]{3,30}$/.test(value),
    }),
  ],
} satisfies BetterAuthOptions;

export function createAuth(env: Env) {
  return betterAuth({
    ...authOptions,
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.APP_ORIGIN,
    trustedOrigins: [env.APP_ORIGIN],
    advanced: {
      cookiePrefix: "itinera",
      useSecureCookies: new URL(env.APP_ORIGIN).protocol === "https:",
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", path: "/" },
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
    },
    logger: { disabled: true },
  });
}
