import { z } from "zod";
import { BOOKING_STATUS } from "./rider.interface";


export const createBookingZodSchema = z.object({
  status: z.enum(Object.values(BOOKING_STATUS) as [string]).optional(),
  pickup: z.string().min(1),
  destination_location: z.string().min(1),
});


export const updateBookingStatusZodSchema = z.object({
  status: z.enum(Object.values(BOOKING_STATUS) as [string]).optional(),
});