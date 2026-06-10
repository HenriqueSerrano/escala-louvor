import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

const run = async () => {
  try {
    console.log("Adicionando coluna lider_id na tabela salas...");

    // Adicionar coluna lider_id na tabela salas
    await pool.query(`
      ALTER TABLE salas 
      ADD COLUMN IF NOT EXISTS lider_id INTEGER REFERENCES pessoas(id) ON DELETE SET NULL
    `);
    
    console.log("✅ Coluna lider_id adicionada (ou já existia)");

    // Adicionar constraint único para garantir 1 líder por sala
    await pool.query(`
      ALTER TABLE salas 
      ADD CONSTRAINT uk_salas_lider_id UNIQUE (lider_id) 
      WHERE lider_id IS NOT NULL
    `);
    
    console.log("✅ Constraint único adicionado");

    console.log("Migração concluída com sucesso!");
  } catch (error) {
    // Se o erro for por constraint ou coluna já existente, é ok
    if (error.message.includes("already exists") || error.message.includes("duplicate key")) {
      console.log("⚠️ Coluna ou constraint já existem. Continuando...");
    } else {
      console.error("Erro na migração:", error.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
};

run();
