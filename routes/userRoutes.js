import express from "express";
import { listarUsuarios, criarUsuario, atualizarUsuario, deletarUsuario, login } from "../controllers/userController.js";
import { validarToken, apenasLider } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.get("/", validarToken, listarUsuarios);
router.post("/", validarToken, apenasLider, criarUsuario);
router.put("/:email", validarToken, apenasLider, atualizarUsuario);
router.delete("/:email", validarToken, apenasLider, deletarUsuario);

export default router;
