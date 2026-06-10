import express from "express";
import {
  salvarEscala, listarEscala, editarEscala, deletarEscala,
  historicoPessoa, gerarEscala
} from "../controllers/escalaController.js";
import { validarToken, apenasLider } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(validarToken);
router.get("/", listarEscala);
router.get("/historico", historicoPessoa);
router.post("/", apenasLider, salvarEscala);
router.post("/gerar", apenasLider, gerarEscala);
router.put("/:id", apenasLider, editarEscala);
router.delete("/:id", apenasLider, deletarEscala);

export default router;
