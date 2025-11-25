import { Types } from "mongoose";


export interface ILocation {
  type: "Point";
  coordinates: [number, number];
}

export enum RideStatus {
  REQUESTED = "REQUESTED",
  ACCEPTED = "ACCEPTED",
  PICKED_UP = "PICKED_UP",
  IN_TRANSIT = "IN_TRANSIT",
  ARRIVED = "ARRIVED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum CancelledBy {
  RIDER = "RIDER",
  DRIVER = "DRIVER",
}

export interface IRide {
  riderId: Types.ObjectId;
  driverId?: Types.ObjectId;
  pickupLocation: ILocation;
  currentLocation: ILocation;
  transactionId?: string;
  destination: ILocation;
  travelDistance?: number;
  fare?: number;
  payment?: Types.ObjectId;
  rideStatus: RideStatus;
  cancelledBy?: CancelledBy;
  timestamps: {
    requestedAt: Date;
    acceptedAt?: Date;
    pickedUpAt?: Date;
    startedAt?: Date;
    arrivedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
  };
  rejectedBy: Types.ObjectId[];
  feedback?: string;
  rating?: number;
}
