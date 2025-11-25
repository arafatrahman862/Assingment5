import express from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { createFaqZodSchema, updateFaqZodSchema } from "./faq.validation";
import { faqController } from "./faq.controller";

const router = express.Router();

router.post(
  "/ask-question",
  validateRequest(createFaqZodSchema),
  faqController.askQuestion
);

router.patch(
  "/reply-question/:id",
  checkAuth(Role.ADMIN),
  validateRequest(updateFaqZodSchema),
  faqController.replyQuestion
);

router.get("/", faqController.getAllFaqs);

router.get("/:id", checkAuth(Role.ADMIN), faqController.getSingleFaq);

export const FaqRoutes = router;
