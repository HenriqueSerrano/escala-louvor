import express from "express";
import { getSalas, definirLiderSala, removerLiderSala } from "../controllers/salaController.js";
import { validarToken, apenasLider } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getSalas);

// Apenas admin gerencia líderes de sala
router.post("/lider", validarToken, apenasLider, definirLiderSala);
router.delete("/lider", validarToken, apenasLider, removerLiderSala);

export default router;