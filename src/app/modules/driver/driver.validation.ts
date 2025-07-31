import { z } from "zod";


export const updateRideStatusZodSchema = z.object({
  status: z.enum(["PICK_UP", "IN_TRANSIT", "COMPLETED"]),
});