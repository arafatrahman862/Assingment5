import { z } from "zod";


export const updateRideStatusZodSchema = z.object({
  status: z.enum(["accepted", "picked_up", "in_transit", "completed"]),
});