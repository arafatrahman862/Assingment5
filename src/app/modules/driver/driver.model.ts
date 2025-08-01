import { model, Schema } from "mongoose";
import { IDriver } from "./driver.interface";
import { Role } from "../user/user.interface";

const driverSchema = new Schema<IDriver>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.DRIVER,
    },
    email: { type: String },
    isBlocked: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    totalEarnings: { type: Number, default: 0 },
    vehicleInfo: { type: String },
  },
  { timestamps: true }
);

export const Driver = model<IDriver>("Driver", driverSchema);
