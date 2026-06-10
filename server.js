import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import escalaRoutes from "./routes/escalaRoutes.js";
import categoriaRoutes from "./routes/categoriaRoutes.js";
import vinculoRoutes from "./routes/vinculoRoutes.js";
import configRoutes from "./routes/configRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/escala", escalaRoutes);
app.use("/categorias", categoriaRoutes);
app.use("/vinculos", vinculoRoutes);
app.use("/config", configRoutes);
app.use("/users", userRoutes);

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/app", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/health", (req, res) => res.status(200).send("OK"));

import pool from "./config/db.js";

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
