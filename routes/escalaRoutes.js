import express from "express";
import {
  salvarEscala,
  listarEscala,
  historicoPessoa,
  editarEscala,
  deletarEscala
} from "../controllers/escalaController.js";
import { validarToken, liderDaSalaOuAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(validarToken);
router.post("/", liderDaSalaOuAdmin, salvarEscala);
router.put("/:id", liderDaSalaOuAdmin, editarEscala);
router.delete("/:id", liderDaSalaOuAdmin, deletarEscala);
router.get("/", listarEscala);
router.get("/historico", historicoPessoa);

export default router;
