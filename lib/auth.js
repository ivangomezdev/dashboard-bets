import crypto from "crypto";

const COOKIE_NAME = "arbs_dashboard_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function getSecret() {
  return process.env.SESSION_SECRET || "local-arbs-dashboard-secret";
}

function getPassword() {
  return process.env.DASHBOARD_PASSWORD || "arb-dashboard-2026";
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyPassword(password) {
  return safeCompare(String(password), getPassword());
}

export function createSessionCookie() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = String(expiresAt);
  const value = `${payload}.${sign(payload)}`;

  return {
    name: COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  };
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  };
}

export function isRequestAuthenticated(request) {
  const cookie = request.cookies.get(COOKIE_NAME)?.value || "";
  const [expiresAt, signature] = cookie.split(".");

  if (!expiresAt || !signature || sign(expiresAt) !== signature) {
    return false;
  }

  return Number(expiresAt) > Math.floor(Date.now() / 1000);
}
