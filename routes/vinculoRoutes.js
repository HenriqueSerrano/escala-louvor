import express from "express";
import {
  listarPorSala,
  listarPorEmail
} from "../controllers/vinculoController.js";
import { validarToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(validarToken);
router.get("/", listarPorSala);
router.get("/pessoa/:email", listarPorEmail);

export default router;
