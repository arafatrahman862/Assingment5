import { model, Schema } from "mongoose";
import { BOOKING_STATUS, IBooking } from "./booking.interface";

const bookingSchema = new Schema<IBooking>(
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
      default: BOOKING_STATUS.REQUESTED,
    },
    destination_location: { type: String, required: true },
    pickup: { type: String, required: true },
    driverId: { type: String },
    // riderId: { type: String },
    fare: { type: Number },
    rideHistory: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

export const Booking = model<IBooking>("Booking", bookingSchema);
