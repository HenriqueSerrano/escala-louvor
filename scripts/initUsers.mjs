import dotenv from "dotenv";
import pkg from "pg";
import crypto from "crypto";

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

const hashSenha = (senha) => {
  const salt = process.env.PASSWORD_SALT || "ESCALA_DI_SALT";
  return crypto.createHash("sha256").update(`${senha}${salt}`).digest("hex");
};

const admins = [
  {
    nome: "Administrador DI",
    email: "admin@di.com",
    senha: "Igr&j@vcc",
    eh_lider: true,
    is_admin: true
  },
  {
    nome: "lider_divcc",
    email: "lider_divcc@di.com",
    senha: "Igr&j@vcc",
    eh_lider: true,
    is_admin: true
  }
];

const run = async () => {
  try {
    console.log("Atualizando esquema de usuários...");

    await pool.query("ALTER TABLE pessoas ADD COLUMN IF NOT EXISTS senha TEXT");
    await pool.query("ALTER TABLE pessoas ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false");

    for (const admin of admins) {
      const existing = await pool.query("SELECT id FROM pessoas WHERE email = $1", [admin.email]);
      const senhaHash = hashSenha(admin.senha);

      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO pessoas (nome, email, eh_lider, senha, is_admin)
           VALUES ($1, $2, $3, $4, $5)`,
          [admin.nome, admin.email, admin.eh_lider, senhaHash, admin.is_admin]
        );
        console.log(`Criado administrador: ${admin.email}`);
      } else {
        await pool.query(
          `UPDATE pessoas SET nome = $1, eh_lider = $2, senha = $3, is_admin = $4 WHERE email = $5`,
          [admin.nome, admin.eh_lider, senhaHash, admin.is_admin, admin.email]
        );
        console.log(`Atualizado administrador existente: ${admin.email}`);
      }
    }

    console.log("Migração de usuários concluída.");
  } catch (error) {
    console.error("Erro na migração de usuários:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

run();
