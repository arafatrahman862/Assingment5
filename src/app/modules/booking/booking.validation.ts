import { z } from "zod";

export const createBookingZodSchema = z.object({
  pickup: z.string({ required_error: "Pickup location is required" }),
  destination_location: z.string({
    required_error: "Destination location is required",
  }),
  riderId: z.string({ required_error: "Rider ID is required" }),
});

export const updateBookingZodSchema = z.object({
  status: z.enum(["CANCELLED"], {
    required_error: "Only cancellation is allowed through this endpoint.",
  }),
});
