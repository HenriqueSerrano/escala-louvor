import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import escalaRoutes from "./routes/escalaRoutes.js";
import salaRoutes from "./routes/salaRoutes.js";
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
app.use("/salas", salaRoutes);
app.use("/vinculos", vinculoRoutes);
app.use("/config", configRoutes);
app.use("/users", userRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.post("/gerar-pdf", async (req, res) => {
  let browser;

  try {
    const { nomeArquivo, sala, mes, eventos, logoLeft, logoRight } = req.body;

    if (!sala || !mes) {
      return res.status(400).json({
        erro: "Sala e mês são obrigatórios para gerar o PDF."
      });
    }

    const templatePath = path.join(__dirname, "public", "pdf.html");
    const templateHtml = await fs.readFile(templatePath, "utf8");

    browser = await puppeteer.launch({
  headless: "new",
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu"
  ]
});

    const page = await browser.newPage();

    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(30000);

    await page.setViewport({
      width: 1400,
      height: 900,
      deviceScaleFactor: 1
    });

    await page.setContent(templateHtml, {
      waitUntil: "networkidle0"
    });

    await page.evaluate((payload) => {
      window.PDF_PAYLOAD = payload;

      if (typeof window.renderPdfTemplate !== "function") {
        throw new Error("Função renderPdfTemplate não encontrada no template pdf.html");
      }

      window.renderPdfTemplate(payload);
    }, {
      sala,
      mes,
      eventos: Array.isArray(eventos) ? eventos : [],
      logoLeft: logoLeft || "",
      logoRight: logoRight || ""
    });

    await page.waitForFunction(() => window.__PDF_READY__ === true);

    await page.evaluate(async () => {
      const imagens = Array.from(document.images);

      await Promise.all(
        imagens.map(img => {
          if (img.complete) return;
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
    });

    await new Promise(r => setTimeout(r, 300));

    const pdfBytes = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm"
      }
    });

    const pdfBuffer = Buffer.from(pdfBytes);
    const nomeFinal = (nomeArquivo || "escala.pdf").replace(/[^\w.\-]+/g, "_");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${nomeFinal}"`);
    res.setHeader("Content-Length", String(pdfBuffer.length));

    res.send(pdfBuffer);
  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    res.status(500).json({
      erro: err.message || "Erro ao gerar PDF"
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

const PORT = process.env.PORT || 3000;

import pool from "./config/db.js";

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
