import express from "express";
import { obterConfig, travarMes, destravarMes, limparMes } from "../controllers/configController.js";
import { validarToken, apenasLider } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", obterConfig);
router.use(validarToken);
router.post("/travar", apenasLider, travarMes);
router.post("/destravar", apenasLider, destravarMes);
router.delete("/limpar", apenasLider, limparMes);

export default router;
