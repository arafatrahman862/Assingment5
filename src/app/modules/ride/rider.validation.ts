import { z } from "zod";

export const createRideZodSchema = z.object({
  pickupLocation: z.object({
    type: z.literal("Point"),
    coordinates: z
      .tuple([z.number(), z.number()])
      .refine((val) => val.length === 2, {
        message: "Coordinates must have [longitude, latitude]",
      }),
  }),
  destination: z.object({
    type: z.literal("Point"),
    coordinates: z
      .tuple([z.number(), z.number()])
      .refine((val) => val.length === 2, {
        message: "Coordinates must have [longitude, latitude]",
      }),
  }),
  currentLocation: z.object({
    type: z.literal("Point"),
    coordinates: z
      .tuple([z.number(), z.number()])
      .refine((val) => val.length === 2, {
        message: "Coordinates must have [longitude, latitude]",
      }),
  }),
});

export const rideFeedbackSchema = z.object({
  feedback: z.string(),
  rating: z
    .number({
      required_error: "Rating is required",
      invalid_type_error: "Rating must be a number",
    })
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
});
