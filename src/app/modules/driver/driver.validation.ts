import z from "zod";
import { DriverStatus, VehicleType } from "./driver.interface";

export const createDriverZodSchema = z.object({
  userId: z.string({ required_error: "User ID is required" }).optional(),

  vehicle: z.object({
    vehicleNumber: z.string({ required_error: "Vehicle Number is required" }),
    vehicleType: z.enum(Object.values(VehicleType) as [string]),
  }),

  currentLocation: z
    .object({
      type: z.literal("Point"),
      coordinates: z
        .tuple([z.number(), z.number()])
        .refine((coords) => coords.length === 2, {
          message: "Coordinates must be [longitude, latitude]",
        }),
    })
    .optional(),

  totalEarning: z.number().min(0).optional(),

  drivingLicense: z.string().optional(),
});

export const goOnlineZodSchema = z.object({
  type: z.literal("Point"),
  coordinates: z
    .tuple([z.number(), z.number()])
    .refine((coords) => coords.length === 2, {
      message: "Coordinates must be [longitude, latitude]",
    }),
});

export const updateDriverStatusZodSchema = z.object({
  driverStatus: z.enum(Object.values(DriverStatus) as [string], {
    required_error: "Driver status is required",
    invalid_type_error: "Invalid driver status value",
  }),
});
