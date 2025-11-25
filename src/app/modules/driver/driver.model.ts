import { Schema, model } from "mongoose";
import {
  DriverOnlineStatus,
  DriverRidingStatus,
  DriverStatus,
  IDriver,
  VehicleType,
} from "./driver.interface";

const driverSchema = new Schema<IDriver>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicle: {
      vehicleNumber: { type: String, required: true },
      vehicleType: {
        type: String,
        enum: Object.values(VehicleType),
        required: true,
      },
    },
    onlineStatus: {
      type: String,
      enum: Object.values(DriverOnlineStatus),
      default: DriverOnlineStatus.OFFLINE,
    },
    ridingStatus: {
      type: String,
      enum: Object.values(DriverRidingStatus),
      default: DriverRidingStatus.IDLE,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: false,
      },
      coordinates: {
        type: [Number],
        required: false,
      },
    },
    totalEarning: {
      type: Number,
      default: 0,
    },
    totalRides: {
      type: Number,
      default: 0,
    },
    rejectedRides: {
      type: Number,
      default: 0,
    },
    drivingLicense: {
      type: String,
      required: true,
    },
    driverStatus: {
      type: String,
      enum: Object.values(DriverStatus),
      default: DriverStatus.PENDING,
    },
    rating: { type: Number, default: 0 },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const Driver = model<IDriver>("Driver", driverSchema);
