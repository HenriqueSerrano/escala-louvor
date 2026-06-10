import express from "express";
import { getCategorias, criarCategoria, excluirCategoria } from "../controllers/categoriaController.js";
import { validarToken, apenasLider } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getCategorias);
router.post("/", validarToken, apenasLider, criarCategoria);
router.delete("/:id", validarToken, apenasLider, excluirCategoria);

export default router;
