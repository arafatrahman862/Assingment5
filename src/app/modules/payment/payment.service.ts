/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { PAYMENT_STATUS } from "./payment.interface";
import { Payment } from "./payment.model";
import { generatePdf, IInvoiceData } from "../../utils/invoice";

import { sendEmail } from "../../utils/sendEmail";
import { uploadBufferToCloudinary } from "../../config/cloudinary.config";
import { User } from "../user/user.model";
import { getAddress } from "../../utils/getAddress";
import { Driver } from "../driver/driver.model";
import { Ride } from "../ride/rider.model";
import { RideStatus } from "../ride/rider.interface";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerz.service";

const initPayment = async (rideId: string) => {
  const payment = await Payment.findOne({ ride: rideId });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment Not Found");
  }

  if (payment.status === PAYMENT_STATUS.PAID) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "You Have already paid For This Ride!"
    );
  }
  const ride = await Ride.findById(payment.ride);

  if (!ride) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride Not Found!");
  }

  const rider = await User.findById(ride.riderId);

  if (!rider) {
    throw new AppError(httpStatus.NOT_FOUND, "Rider Not Found!");
  }

  const riderLocation = rider.location;
  let address;

  if (riderLocation && riderLocation.coordinates?.length === 2) {
    const [lng, lat] = riderLocation.coordinates;
    address = await getAddress(lat, lng);
    console.log("Rider Address:", address);
  }

  // for sslCommerz
  const userEmail = rider.email;
  const userPhoneNumber = (ride?.riderId as any).phone;
  const userName = (ride?.riderId as any).name;

  const sslPayload: ISSLCommerz = {
    address,
    email: userEmail,
    phoneNumber: userPhoneNumber,
    name: userName,
    amount: ride.fare as number,
    transactionId: payment.transactionId,
  };
  // initiate the sslCommerg

  const sslPayment = await SSLService.sslPaymentInit(sslPayload);

  return {
    paymentUrl: sslPayment.GatewayPageURL,
  };
};

const successPayment = async (query: Record<string, string>) => {
  const session = await Ride.startSession();
  session.startTransaction();

  try {
    const paymentInfo = await Payment.findOne({
      transactionId: query.transactionId,
    });

    if (!paymentInfo) {
      throw new AppError(401, "Payment not found");
    }

    const updatedRide = await Ride.findByIdAndUpdate(
      paymentInfo?.ride,
      {
        $set: {
          "timestamps.completedAt": new Date(),
          rideStatus: RideStatus.COMPLETED,
          transactionId: paymentInfo.transactionId,
        },
      },
      { new: true, runValidators: true, session }
    )
      .populate("riderId", "name email phone location")
      .populate("payment");

    if (!updatedRide) {
      throw new AppError(401, "Ride not found");
    }

    const driver = await Driver.findById(updatedRide.driverId).session(session);
    if (!driver) throw new AppError(404, "Driver not found");

    const ownerCommissionPercentage = 20;
    const driverIncome =
      ((updatedRide.fare as number) * (100 - ownerCommissionPercentage)) / 100;
    const ownerIncome =
      ((updatedRide.fare as number) * ownerCommissionPercentage) / 100;

    driver.totalEarning = Number(driver.totalEarning || 0) + driverIncome;
    driver.totalRides = Number(driver.totalRides || 0) + 1;
    await driver.save({ session });

    const updatedPayment = await Payment.findByIdAndUpdate(
      paymentInfo._id,
      { driverIncome, ownerIncome, status: PAYMENT_STATUS.PAID },
      { runValidators: true, session }
    );

    if (!updatedPayment) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Payment Could not Be Created!"
      );
    }

    const pickupCoords = updatedRide.pickupLocation?.coordinates;
    const destCoords = updatedRide.destination?.coordinates;

    const pickupLocation = pickupCoords
      ? await getAddress(pickupCoords[1], pickupCoords[0])
      : null;
    const destinationLocation = destCoords
      ? await getAddress(destCoords[1], destCoords[0])
      : null;

    const invoiceData: IInvoiceData = {
      rideDate: updatedRide.timestamps?.completedAt as Date,
      travelDistance: updatedRide.travelDistance as number,
      totalFare: updatedRide.fare as number,
      transactionId: updatedPayment.transactionId,
      riderId: updatedRide.riderId,
      driverId: updatedRide.driverId,
      pickupLocation,
      destinationLocation,
      completedAt: updatedRide.timestamps?.completedAt,
      userName: (updatedRide.riderId as any).name,
    };

    const pdfBuffer = await generatePdf(invoiceData);

    const cloudinaryResult = await uploadBufferToCloudinary(
      pdfBuffer,
      "invoice"
    );
    if (!cloudinaryResult) throw new AppError(401, "Error uploading PDF");

    await Payment.findByIdAndUpdate(
      updatedPayment._id,
      { invoiceUrl: cloudinaryResult.secure_url },
      { runValidators: true, session }
    );

    await sendEmail({
      to: (updatedRide.riderId as any).email,
      subject: "Your Ride Invoice",
      templateName: "invoice",
      templateData: invoiceData,
      attachments: [
        {
          filename: "invoice.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message: "Payment Completed Successfully",
      rideId: updatedRide._id,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getInvoiceDownloadUrl = async (paymentId: string) => {
  const payment = await Payment.findById(paymentId).select("invoiceUrl");

  if (!payment) {
    throw new AppError(401, "Payment not found");
  }

  if (!payment.invoiceUrl) {
    throw new AppError(401, "No invoice found");
  }

  return payment.invoiceUrl;
};

// FAILED PAYMENT
const failPayment = async (query: Record<string, string>) => {
  const paymentInfo = await Payment.findOne({
    transactionId: query.transactionId,
  });
  if (!paymentInfo) throw new AppError(401, "Payment not found");

  paymentInfo.status = PAYMENT_STATUS.FAILED;
  await paymentInfo.save();

  return { success: false, message: "Payment Failed" };
};

// CANCELLED PAYMENT with transaction rollback
const cancelPayment = async (query: Record<string, string>) => {
  const paymentInfo = await Payment.findOne({
    transactionId: query.transactionId,
  });
  if (!paymentInfo) throw new AppError(401, "Payment not found");

  paymentInfo.status = PAYMENT_STATUS.CANCELLED;
  await paymentInfo.save();

  return { success: false, message: "Payment Cancelled" };
};

export const PaymentService = {
  initPayment,
  successPayment,
  failPayment,
  cancelPayment,
  getInvoiceDownloadUrl,
};
