import { z } from "zod";
import { BOOKING_STATUS_RIDER } from "./rider.interface";


export const createRiderZodSchema = z.object({
  status: z.enum(Object.values(BOOKING_STATUS_RIDER) as [string]).optional(),
  pickup: z.string().min(1),
  destination_location: z.string().min(1),
});


export const updateRiderZodSchema = z.object({
  status: z.enum(Object.values(BOOKING_STATUS_RIDER) as [string]).optional(),
});