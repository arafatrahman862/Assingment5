import { model, Schema, Types } from "mongoose";
import { BOOKING_STATUS, IRider } from "./rider.interface";
import { Role } from "../user/user.interface";


const riderSchema = new Schema<IRider>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    payment: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
    },
    bookings: [
      {
        type: Types.ObjectId,
        ref: "Booking",
      },
    ],
    rideHistory: [
      {
        type: Types.ObjectId,
        ref: "Booking",
      },
    ],
    destination_location: {
      type: String,
      required: true,
    },
    pickup: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.RIDER,
    },
  },
  {
    timestamps: true,
  }
);

export const Rider = model<IRider>("Rider", riderSchema);
