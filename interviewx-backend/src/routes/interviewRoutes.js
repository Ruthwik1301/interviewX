import { Router } from "express";
import {
  startInterview,
  submitAnswer,
  completeInterview,
  listInterviews,
  getInterview,
} from "../controllers/interviewController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.post("/", startInterview);
router.get("/", listInterviews);
router.get("/:id", getInterview);
router.post("/:id/answer", submitAnswer);
router.post("/:id/complete", completeInterview);

export default router;
