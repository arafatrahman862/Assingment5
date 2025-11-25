import z from "zod";

export const createFaqZodSchema = z.object({
  email: z.string({
    required_error: "Email is required",
  }),
  name: z.string({
    required_error: "Name is required",
  }),
  question: z.string({
    required_error: "Question details are required",
  }),

  answer: z.string().optional(),
});

export const updateFaqZodSchema = z.object({
  answer: z.string(),
});
