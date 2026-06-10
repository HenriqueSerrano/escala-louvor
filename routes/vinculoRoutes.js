import express from "express";
import { listarPorEmail, listarPorCategoria } from "../controllers/vinculoController.js";
import { validarToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(validarToken);
router.get("/", listarPorCategoria);
router.get("/pessoa/:email", listarPorEmail);

export default router;
