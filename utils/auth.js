import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const SECRET = process.env.JWT_SECRET || "ESCALA_DI_TOKEN_SECRET";
const SALT = process.env.PASSWORD_SALT || "ESCALA_DI_PASSWORD_SALT";
const TOKEN_EXPIRATION_MS = 8 * 60 * 60 * 1000; // 8 horas

const base64UrlEncode = (value) => Buffer.from(value, "utf8").toString("base64url");
const base64UrlDecode = (value) => Buffer.from(value, "base64url").toString("utf8");

export const hashSenha = (senha) => {
  if (!senha) return null;
  return crypto
    .createHash("sha256")
    .update(`${senha}${SALT}`)
    .digest("hex");
};

export const criarToken = (payload) => {
  const data = {
    ...payload,
    exp: Date.now() + TOKEN_EXPIRATION_MS
  };

  const base = base64UrlEncode(JSON.stringify(data));
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(base)
    .digest("base64url");

  return `${base}.${signature}`;
};

export const verificarToken = (token) => {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [base, signature] = parts;
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(base)
    .digest("base64url");

  const bufferSignature = Buffer.from(signature, "utf8");
  const bufferExpected = Buffer.from(expected, "utf8");

  if (bufferSignature.length !== bufferExpected.length) return null;
  if (!crypto.timingSafeEqual(bufferSignature, bufferExpected)) return null;

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(base));
  } catch {
    return null;
  }

  if (!payload.exp || Date.now() > payload.exp) {
    return null;
  }

  return payload;
};
