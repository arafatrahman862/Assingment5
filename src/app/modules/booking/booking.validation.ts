import { z } from "zod";
import { BOOKING_STATUS } from "./booking.interface";

export const createBookingZodSchema = z.object({
  destination_location: z.string(),
  pickup: z.string(),
 
});

export const updateBookingStatusZodSchema = z.object({
  status: z.enum(Object.values(BOOKING_STATUS) as [string]),
});
