import { Types } from "mongoose";

export enum BOOKING_STATUS {
  REQUESTED = "REQUESTED",
  CANCELLED = "CANCELLED",
  ACCEPTED = "ACCEPTED",
  PICK_UP = "PICK_UP",
  IN_TRANSIT = "IN_TRANSIT",
  COMPLETED = "COMPLETED",
}

export interface IBooking {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  pickup: string;
  destination_location: string;
  rideHistory?: Types.ObjectId[];
  payment?: Types.ObjectId;
  status?: BOOKING_STATUS;
  createdAt?: Date;
  fare?: number;
  riderId?: Types.ObjectId;
  driverId?: Types.ObjectId;
}
