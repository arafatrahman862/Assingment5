/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";

export enum PAYMENT_STATUS {
  PAID = "PAID",
  UNPAID = "UNPAID",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
}
export enum PAYMENT_METHOD {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
}
export interface IPayment {
  ride: Types.ObjectId;
  driver: Types.ObjectId;
  transactionId: string;
  rideFare: number;
  ownerIncome?: number;
  driverIncome?: number;
  paymentGatewayData?: any;
  invoiceUrl?: string;
  status: PAYMENT_STATUS;
  paymentMethod?: PAYMENT_METHOD;
}
