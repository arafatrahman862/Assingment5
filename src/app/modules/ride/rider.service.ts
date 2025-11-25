/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */


import { calculateDistanceAndFare } from "../../utils/calculateDistanceAndFare";
import { IsBlocked, IUser, RiderStatus } from "../user/user.interface";
import { User } from "../user/user.model";
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { Driver } from "../driver/driver.model";

import haversine from "haversine-distance";
import { getTransactionId } from "../../utils/getTransactionId";
import { getAddress } from "../../utils/getAddress";
import { generatePdf, IInvoiceData } from "../../utils/invoice";
import { uploadBufferToCloudinary } from "../../config/cloudinary.config";
import { sendEmail } from "../../utils/sendEmail";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { CancelledBy, IRide, RideStatus } from "./rider.interface";
import { Ride } from "./rider.model";
import { DriverOnlineStatus, DriverRidingStatus, DriverStatus, ICurrentLocation, IDriver } from "../driver/driver.interface";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import { Payment } from "../payment/payment.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { rideSearchableFields } from "./rider.contant";

const createRide = async (payload: IRide) => {
  const { pickupLocation, destination } = payload;

  const session = await Ride.startSession();
  session.startTransaction();

  try {
    const rider = await User.findById(payload.riderId).session(session);
    if (!rider) {
      throw new AppError(httpStatus.NOT_FOUND, "Rider not found.");
    }

    if (rider.isBlocked === IsBlocked.BLOCKED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You are blocked. Contact admin."
      );
    }
    if (
      rider.riderStatus === RiderStatus.REQUESTED ||
      rider.riderStatus === RiderStatus.ON_RIDE
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `You already have a ride in ${rider.riderStatus} State.`
      );
    }

    const { distanceKm, fare } = await calculateDistanceAndFare(
      pickupLocation.coordinates,
      destination.coordinates
    );

    const ride = await Ride.create(
      [{ ...payload, travelDistance: distanceKm, fare }],
      { session }
    );

    await User.findByIdAndUpdate(
      payload.riderId,
      { riderStatus: RiderStatus.REQUESTED },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return { data: ride[0] };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getRidesNearMe = async (userId: string) => {
  const user: IUser | null = await User.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  if (user && user.isBlocked === IsBlocked.BLOCKED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You are blocked. Contact Admin."
    );
  }

  const driver: IDriver | null = await Driver.findOne({ userId });

  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver not found.");
  }

  if (driver.driverStatus !== DriverStatus.APPROVED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      `Driver is not approved to accept rides. Your status is currently: ${driver.driverStatus}`
    );
  }

  if (driver.onlineStatus === DriverOnlineStatus.OFFLINE) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Go Online To See The Rides Around You!"
    );
  }

  if (!driver.currentLocation || !driver.currentLocation.coordinates) {
    throw new AppError(httpStatus.BAD_REQUEST, "Driver location is not set.");
  }

  // const requestedRides: IRide[] = await Ride.find({
  //   rideStatus: RideStatus.REQUESTED,
  // }).sort({ createdAt: -1 });

  // const nearByRides = requestedRides.filter((ride) => {
  //   if (ride.rejectedBy?.some(id => id.toString() === driver._id.toString())) {
  //     return false;
  //   }
  //   if (!ride.pickupLocation?.coordinates || !driver.currentLocation?.coordinates) return false;

  //   const [pickupLng, pickupLat] = ride.pickupLocation.coordinates;
  //   const [driverLng, driverLat] = driver.currentLocation.coordinates;

  //   const distanceInMeters = haversine(
  //     { lat: driverLat, lon: driverLng },
  //     { lat: pickupLat, lon: pickupLng }
  //   );
  //   return distanceInMeters <= 1000;
  // });

  const [lng, lat] = driver.currentLocation.coordinates;

  const nearByRides: IRide[] = await Ride.find({
    rideStatus: RideStatus.REQUESTED,
    rejectedBy: { $ne: driver._id },
    "pickupLocation.coordinates": {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: 1000,
      },
    },
  }).sort({ createdAt: -1 });

  return {
    success: true,
    data: nearByRides,
  };
};

const acceptRide = async (driverUserId: string, rideId: string) => {
  const session = await Ride.startSession();
  session.startTransaction();

  try {
    const driver = await Driver.findOne({ userId: driverUserId }).session(
      session
    );
    if (!driver) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver not found.");
    }

    if (driver.driverStatus === DriverStatus.SUSPENDED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You are suspended. Cannot accept rides."
      );
    }
    if (driver.onlineStatus === DriverOnlineStatus.OFFLINE) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "First go Online Then Try To Accept!"
      );
    }

    if (driver.ridingStatus !== DriverRidingStatus.IDLE) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You can Not Accept another Ride While Engaged In a Trip Already"
      );
    }

    const ride = await Ride.findById(rideId).session(session);
    if (!ride) {
      throw new AppError(httpStatus.NOT_FOUND, "Ride not found.");
    }

    if (ride.rideStatus !== RideStatus.REQUESTED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Ride is Already ${ride.rideStatus}`
      );
    }

    if (
      ride.rejectedBy?.some((id) => id.toString() === driver._id.toString())
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You have already rejected this ride."
      );
    }

    if (String(driver.userId) === String(ride.riderId)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You cannot accept your own ride."
      );
    }

    const rider = await User.findById(ride.riderId).session(session);
    if (!rider) {
      throw new AppError(httpStatus.NOT_FOUND, "Rider not found.");
    }

    ride.driverId = driver._id;
    ride.rideStatus = RideStatus.ACCEPTED;
    ride.timestamps = {
      ...ride.timestamps,
      acceptedAt: new Date(),
    };
    await ride.save({ session });

    driver.ridingStatus = DriverRidingStatus.ACCEPTED;
    await driver.save({ session });

    rider.riderStatus = RiderStatus.WAITING;
    await rider.save({ session });

    const data = {
      rideId: ride._id,
      riderName: rider.name,
      riderPhone: rider.phone,
    };

    await session.commitTransaction();
    session.endSession();

    return {
      data: data,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
const rejectRide = async (driverUserId: string, rideId: string) => {
  const session = await Ride.startSession();
  session.startTransaction();

  try {
    const driver = await Driver.findOne({ userId: driverUserId }).session(
      session
    );
    if (!driver) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver not found.");
    }

    if (driver.driverStatus === DriverStatus.SUSPENDED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You are suspended. Cannot accept or reject rides."
      );
    }

    if (driver.onlineStatus === DriverOnlineStatus.OFFLINE) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "First go online, then try to accept or reject!"
      );
    }

    if (driver.ridingStatus !== DriverRidingStatus.IDLE) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You cannot accept or reject another ride while already in a trip."
      );
    }

    const ride = await Ride.findById(rideId).session(session);
    if (!ride) {
      throw new AppError(httpStatus.NOT_FOUND, "Ride not found.");
    }

    if (ride.rideStatus !== RideStatus.REQUESTED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Ride is already ${ride.rideStatus}.`
      );
    }

    if (String(driver.userId) === String(ride.riderId)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You cannot reject your own ride."
      );
    }

    const rider = await User.findById(ride.riderId).session(session);
    if (!rider) {
      throw new AppError(httpStatus.NOT_FOUND, "Rider not found.");
    }

    if (!ride.rejectedBy.includes(driver._id)) {
      ride.rejectedBy.push(driver._id);
    }

    await ride.save({ session });

    driver.rejectedRides += 1;
    await driver.save({ session });

    const data = {
      riderName: rider.name,
      riderPhone: rider.phone,
    };

    await session.commitTransaction();
    session.endSession();

    return { data };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const pickupRider = async (driverUserId: string, rideId: string) => {
  const session = await Ride.startSession();
  session.startTransaction();

  try {
    const driver = await Driver.findOne({ userId: driverUserId }).session(
      session
    );
    if (!driver) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver not found.");
    }

    if (driver.driverStatus === DriverStatus.SUSPENDED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You are suspended. Cannot complete."
      );
    }

    if (driver.onlineStatus === DriverOnlineStatus.OFFLINE) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Go Online To Pickup The Rider!"
      );
    }

    const ride = await Ride.findById(rideId).session(session);
    if (!ride) {
      throw new AppError(httpStatus.NOT_FOUND, "Ride not found.");
    }

    if (!ride.driverId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You Have Not Accepted This Ride Yet! Accept First!"
      );
    }

    if (String(driver._id) !== String(ride.driverId)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You cannot pick up another driver's rider!"
      );
    }

    if (
      [
        RideStatus.PICKED_UP,
        RideStatus.IN_TRANSIT,
        RideStatus.COMPLETED,
      ].includes(ride.rideStatus)
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `This ride is already in ${ride.rideStatus} State.`
      );
    }

    if (ride.rideStatus === RideStatus.CANCELLED) {
      throw new AppError(httpStatus.BAD_REQUEST, "This ride was cancelled.");
    }

    if (ride.rideStatus !== RideStatus.ACCEPTED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You must accept the ride first."
      );
    }

    if (String(driver.userId) === String(ride.riderId)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You cannot pick up your own ride."
      );
    }

    const rider = await User.findById(ride.riderId).session(session);
    if (!rider) {
      throw new AppError(httpStatus.NOT_FOUND, "Rider not found.");
    }

    ride.rideStatus = RideStatus.PICKED_UP;
    ride.timestamps = {
      ...ride.timestamps,
      pickedUpAt: new Date(),
    };
    await ride.save({ session });

    driver.ridingStatus = DriverRidingStatus.RIDING;
    await driver.save({ session });

    rider.riderStatus = RiderStatus.PICKED_UP;
    await rider.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      data: {
        rideId: ride._id,
        riderDestination: ride.destination,
        totalFare: ride.fare,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
const startRide = async (driverUserId: string, rideId: string) => {
  const session = await Ride.startSession();
  session.startTransaction();

  try {
    const driver = await Driver.findOne({ userId: driverUserId }).session(
      session
    );
    if (!driver) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver not found.");
    }

    if (driver.driverStatus === DriverStatus.SUSPENDED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You are suspended. Cannot complete."
      );
    }

    if (driver.onlineStatus === DriverOnlineStatus.OFFLINE) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Go Online To start The Ride!"
      );
    }

    const ride = await Ride.findById(rideId).session(session);
    if (!ride) {
      throw new AppError(httpStatus.NOT_FOUND, "Ride not found.");
    }

    if (!ride.driverId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You Have Not Accepted This Ride Yet! Accept First!"
      );
    }

    if (String(driver._id) !== String(ride.driverId)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You cannot Start Riding with another driver's rider!"
      );
    }

    if (ride.rideStatus === RideStatus.CANCELLED) {
      throw new AppError(httpStatus.BAD_REQUEST, "This ride was cancelled.");
    }

    if (
      [RideStatus.IN_TRANSIT, RideStatus.COMPLETED].includes(ride.rideStatus)
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `This ride is already in ${ride.rideStatus} State.`
      );
    }

    if (ride.rideStatus !== RideStatus.PICKED_UP) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You must Pickup Rider To Start The Ride."
      );
    }

    if (String(driver.userId) === String(ride.riderId)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You cannot Run your ride with Your Owns."
      );
    }

    const rider = await User.findById(ride.riderId).session(session);
    if (!rider) {
      throw new AppError(httpStatus.NOT_FOUND, "Rider not found.");
    }

    ride.rideStatus = RideStatus.IN_TRANSIT;
    ride.timestamps = {
      ...ride.timestamps,
      startedAt: new Date(),
    };
    await ride.save({ session });

    driver.ridingStatus = DriverRidingStatus.RIDING;
    await driver.save({ session });

    rider.riderStatus = RiderStatus.ON_RIDE;
    await rider.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      data: {
        rideId: ride._id,
        riderDestination: ride.destination,
        totalFare: ride.fare,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const arrivedDestination = async (driverUserId: string, rideId: string) => {
  const session = await Ride.startSession();
  session.startTransaction();

  try {
    const driver = await Driver.findOne({ userId: driverUserId }).session(
      session
    );
    if (!driver) throw new AppError(httpStatus.NOT_FOUND, "Driver not found.");

    if (driver.driverStatus === DriverStatus.SUSPENDED)
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You are suspended. Cannot complete."
      );

    if (driver.onlineStatus === DriverOnlineStatus.OFFLINE)
      throw new AppError(httpStatus.BAD_REQUEST, "Go Online First!");

    const ride = await Ride.findById(rideId).session(session);
    if (!ride) throw new AppError(httpStatus.NOT_FOUND, "Ride not found.");

    if (!ride.driverId)
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You Have Not Accepted This Ride Yet! Accept First!"
      );

    if (String(driver._id) !== String(ride.driverId))
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You cannot update another driver’s ride!"
      );

    if (ride.rideStatus === RideStatus.ARRIVED)
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "This ride is already ARRIVED."
      );

    if (ride.rideStatus !== RideStatus.IN_TRANSIT)
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You must Start Ride To Finish The Ride!."
      );

    if (String(driver.userId) === String(ride.riderId))
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You cannot drive your own ride!"
      );

    const rider = await User.findById(ride.riderId).session(session);
    if (!rider) throw new AppError(httpStatus.NOT_FOUND, "Rider not found.");

    const updatedRide = await Ride.findOneAndUpdate(
      { _id: ride._id },
      {
        $set: {
          rideStatus: RideStatus.ARRIVED,
          "timestamps.arrivedAt": new Date(),
        },
      },
      { new: true, session }
    );

    await Driver.updateOne(
      { _id: driver._id },
      { $set: { ridingStatus: DriverRidingStatus.IDLE } },
      { session }
    );

    await User.updateOne(
      { _id: rider._id },
      { $set: { riderStatus: RiderStatus.IDLE } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return {
      data: {
        rideId: updatedRide?._id,
        totalFare: updatedRide?.fare,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const payOnline = async (riderId: string, rideId: string) => {
  const transactionId = getTransactionId();

  const session = await Ride.startSession();
  session.startTransaction();

  try {
    const ride = await Ride.findById(rideId).session(session);

    if (!ride) {
      throw new AppError(httpStatus.NOT_FOUND, "Ride not found.");
    }

    if (String(ride.riderId) !== riderId) {
      throw new AppError(httpStatus.BAD_REQUEST, "This is Not Your Ride!");
    }

    if (!ride.driverId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No Driver Accepted Your Ride Yet!"
      );
    }

    if (ride.rideStatus === RideStatus.CANCELLED) {
      throw new AppError(httpStatus.BAD_REQUEST, "This ride was cancelled.");
    }

    if ([RideStatus.COMPLETED].includes(ride.rideStatus)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `This ride is already in ${ride.rideStatus} State.`
      );
    }

    if (ride.rideStatus !== RideStatus.ARRIVED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You must Arrive To Finish The Ride!."
      );
    }

    console.log(ride.driverId);

    const driver = await Driver.findOne({ _id: ride.driverId }).session(
      session
    );

    if (!driver) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver not found.");
    }
    const paymentInfo = await Payment.findById(ride._id);

    if (paymentInfo && paymentInfo.status === PAYMENT_STATUS.PAID) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        ` Already ${PAYMENT_STATUS} this ride.`
      );
    }

    const payment = await Payment.create(
      [
        {
          ride: ride._id,
          driver: driver._id,
          status: PAYMENT_STATUS.UNPAID,
          transactionId,
          rideFare: ride.fare,
        },
      ],
      { session }
    );

    const updatedRide = await Ride.findByIdAndUpdate(
      ride._id,
      {
        payment: payment[0]._id,
        transactionId: payment[0].transactionId,
      },
      { new: true, runValidators: true, session }
    )
      .populate("riderId", "name email phone location")
      .populate("payment");

    const riderLocation = (updatedRide?.riderId as any)?.location;
    let address;

    if (riderLocation && riderLocation.coordinates?.length === 2) {
      const [lng, lat] = riderLocation.coordinates;
      address = await getAddress(lat, lng);
      console.log("Rider Address:", address);
    }

    // for sslCommerz
    const userEmail = (updatedRide?.riderId as any).email;
    const userPhoneNumber = (updatedRide?.riderId as any).phone;
    const userName = (updatedRide?.riderId as any).name;

    const sslPayload: ISSLCommerz = {
      address,
      email: userEmail,
      phoneNumber: userPhoneNumber,
      name: userName,
      amount: ride.fare as number,
      transactionId: transactionId,
    };

    const sslPayment = await SSLService.sslPaymentInit(sslPayload);

    await session.commitTransaction();
    session.endSession();

    return {
      paymentUrl: sslPayment.GatewayPageURL,
      booking: updatedRide,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const payOffline = async (driverUserId: string, rideId: string) => {
  const transactionId = getTransactionId();
  const session = await Ride.startSession();
  session.startTransaction();

  try {
    const driver = await Driver.findOne({ userId: driverUserId }).session(
      session
    );
    if (!driver) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver not found.");
    }
    if (driver.driverStatus === DriverStatus.SUSPENDED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You are suspended. Cannot complete."
      );
    }
    if (driver.onlineStatus === DriverOnlineStatus.OFFLINE) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Go Online To Pickup The Rider!"
      );
    }

    const ride = await Ride.findById(rideId).session(session);
    if (!ride) {
      throw new AppError(httpStatus.NOT_FOUND, "Ride not found.");
    }
    if (String(driver._id) !== String(ride.driverId)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You cannot complete another driver's ride."
      );
    }
    if (ride.rideStatus === RideStatus.CANCELLED) {
      throw new AppError(httpStatus.BAD_REQUEST, "This ride was cancelled.");
    }
    if (ride.rideStatus === RideStatus.COMPLETED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "This ride is already completed."
      );
    }
    if (ride.rideStatus !== RideStatus.ARRIVED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You must Arrive To Finish The Ride!"
      );
    }
    if (String(driver.userId) === String(ride.riderId)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You cannot complete your own ride."
      );
    }

    const rider = await User.findById(ride.riderId).session(session);
    if (!rider) {
      throw new AppError(httpStatus.NOT_FOUND, "Rider not found.");
    }

    const existingPayment = await Payment.findOne({ ride: ride._id }).session(
      session
    );
    if (existingPayment && existingPayment.status === PAYMENT_STATUS.PAID) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Payment already completed for this ride."
      );
    }

    const ownerCommissionPercentage = 20;
    const driverIncome =
      ((ride.fare as number) * (100 - ownerCommissionPercentage)) / 100;
    const ownerIncome =
      ((ride.fare as number) * ownerCommissionPercentage) / 100;

    driver.totalEarning = Number(driver.totalEarning || 0) + driverIncome;
    driver.totalRides = Number(driver.totalRides || 0) + 1;
    await driver.save({ session });

    const payment = await Payment.create(
      [
        {
          ride: ride._id,
          driver: driver._id,
          status: PAYMENT_STATUS.PAID,
          transactionId,
          rideFare: ride.fare,
          ownerIncome,
          driverIncome,
        },
      ],
      { session }
    );

    const updatedRide = await Ride.findByIdAndUpdate(
      ride._id,
      {
        $set: {
          "timestamps.completedAt": new Date(),
          rideStatus: RideStatus.COMPLETED,
          transactionId: payment[0].transactionId,
          payment: payment[0]._id,
        },
      },
      { new: true, runValidators: true, session }
    )
      .populate("riderId", "name email phone location")
      .populate("payment");

    if (!updatedRide)
      throw new AppError(httpStatus.BAD_REQUEST, "Ride could not be updated");

    // Generate invoice PDF
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
      transactionId,
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
      payment[0]._id,
      { invoiceUrl: cloudinaryResult.secure_url },
      { session }
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
      data: {
        rideId: updatedRide._id,
        transactionId,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getAllRidesForAdmin = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(
    Ride.find().populate("payment").populate("driverId"),
    query
  );
  const rideData = queryBuilder
    .filter()
    .search(rideSearchableFields)
    .sort()
    .dateSearch()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    rideData.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};
const getAllRidesForRider = async (
  riderId: string,
  query: Record<string, string>
) => {
  const queryBuilder = new QueryBuilder(
    Ride.find({ riderId }).populate("payment").populate("driverId"),
    query
  );

  const rideData = queryBuilder
    .filter()
    .search(rideSearchableFields)
    .sort()
    .fields()
    .dateSearch()
    .paginate();

  const [data, meta] = await Promise.all([
    rideData.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getAllRidesForDriver = async (
  userId: string,
  query: Record<string, string>
) => {
  const driver = await Driver.findOne({ userId });
  if (!driver) {
    throw new AppError(httpStatus.BAD_REQUEST, "Driver information not found!");
  }

  const queryBuilder = new QueryBuilder(
    Ride.find({ driverId: driver._id })
      .populate("payment")
      .populate("driverId"),
    query
  );

  const rideData = queryBuilder
    .filter()
    .search(rideSearchableFields)
    .sort()
    .fields()
    .dateSearch()
    .paginate();

  const [data, meta] = await Promise.all([
    rideData.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getSingleRideForRider = async (rideId: string, riderId: string) => {
  const data = await Ride.findById(rideId)
    .populate({
      path: "driverId",
      populate: { path: "userId" },
    })
    .populate("payment");

  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride Information Not Found");
  }

  if (String(data.riderId) !== riderId) {
    throw new AppError(httpStatus.BAD_REQUEST, "This Ride Is Not Yours!");
  }

  return {
    data,
  };
};
const getSingleRideForAdmin = async (rideId: string) => {
  const data = await Ride.findById(rideId)
    .populate("driverId")
    .populate("payment");

  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride Information Not Found");
  }

  return {
    data,
  };
};
const getSingleRideForDriver = async (rideId: string, driverId: string) => {
  const data = await Ride.findById(rideId).populate("riderId");

  const driver = await Driver.findOne({ userId: driverId });

  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver Not Found!");
  }

  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride Information Not Found");
  }

  return {
    data,
  };
};

// const getLatestAcceptedRideForDriver = async (userId: string) => {
//   console.log(userId)
//   const driver = await Driver.findOne({ userId });

//   if (!driver) {
//     throw new AppError(httpStatus.NOT_FOUND, "Driver Not Found!")
//   }
//   const data = await Ride.findOne({
//     driverId: driver._id,
//     rideStatus: "ACCEPTED",
//   }).sort({ createdAt: -1 });

//   return { data };
// };

const getLatestAcceptedRideForDriver = async (userId: string) => {
  console.log(userId);

  const driver = await Driver.findOne({ userId });
  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver Not Found!");
  }

  const acceptedStatuses = [
    "ACCEPTED",
    "REQUESTED",
    "PICKED_UP",
    "IN_TRANSIT",
    "ARRIVED",
  ];

  const data = await Ride.findOne({
    driverId: driver._id,
    rideStatus: { $in: acceptedStatuses },
  }).sort({ createdAt: -1 });

  return { data };
};
const getRequestedRideForRider = async (userId: string) => {
  console.log(userId);

  const acceptedStatuses = [
    "ACCEPTED",
    "REQUESTED",
    "PICKED_UP",
    "IN_TRANSIT",
    "ARRIVED",
  ];

  const latestRide = await Ride.findOne({
    riderId: userId,
    rideStatus: { $in: acceptedStatuses },
  })
    .sort({ createdAt: -1 })
    .lean();

  return { data: latestRide };
};

const updateRideLocation = async (
  rideId: string,
  currentLocation: ICurrentLocation
) => {
  const ride = await Ride.findOneAndUpdate(
    { _id: rideId },
    {
      currentLocation: currentLocation,
    },
    { new: true }
  );
  return { data: ride };
};

export const getDriversNearMe = async (userId: string) => {
  const activeStatuses = [
    "REQUESTED",
    "ACCEPTED",
    "ARRIVED",
    "PICKED_UP",
    "IN_TRANSIT",
    "COMPLETED",
  ];
  const user: IUser | null = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  if (user.isBlocked === IsBlocked.BLOCKED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You are blocked. Contact Admin."
    );
  }

  const latestRide: IRide | null = await Ride.findOne({
    riderId: userId,
    rideStatus: { $in: activeStatuses },
    "pickupLocation.coordinates.0": { $exists: true },
    "pickupLocation.coordinates.1": { $exists: true },
  }).sort({ createdAt: -1 });

  if (!latestRide) {
    throw new AppError(httpStatus.BAD_REQUEST, "No active ride found.");
  }

  const [pickupLng, pickupLat] = latestRide.pickupLocation.coordinates;

  const drivers: IDriver[] = await Driver.find(
    {
      driverStatus: DriverStatus.APPROVED,
      onlineStatus: DriverOnlineStatus.ONLINE,
      // ridingStatus: { $ne: DriverRidingStatus.RIDING },
      currentLocation: { $exists: true, $ne: null },
    },
    {
      vehicle: 1,
      currentLocation: 1,
    }
  ).populate("userId", "name phone");

  const nearbyDrivers = drivers.filter((driver) => {
    if (!driver.currentLocation?.coordinates?.length) return false;

    const [driverLng, driverLat] = driver.currentLocation.coordinates;

    const distanceInMeters = haversine(
      { lat: pickupLat, lon: pickupLng },
      { lat: driverLat, lon: driverLng }
    );

    return distanceInMeters <= 1000;
  });

  return {
    success: true,
    ride: latestRide,
    count: nearbyDrivers.length,
    data: nearbyDrivers,
  };
};

const cancelRideByRider = async (userId: string, rideId: string) => {
  const session = await Ride.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found.");
    }

    const ride = await Ride.findById(rideId).session(session);

    if (!ride) {
      throw new AppError(httpStatus.NOT_FOUND, "Ride not found.");
    }

    if (String(ride.riderId) !== String(userId)) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not authorized to cancel this ride."
      );
    }

    if (
      [
        RideStatus.ACCEPTED,
        RideStatus.PICKED_UP,
        RideStatus.IN_TRANSIT,
        RideStatus.COMPLETED,
        RideStatus.CANCELLED,
      ].includes(ride.rideStatus)
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `You cannot cancel a ride that is already in ${ride.rideStatus} state`
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cancelledCountToday = await Ride.countDocuments({
      riderId: userId,
      rideStatus: RideStatus.CANCELLED,
      cancelledBy: CancelledBy.RIDER,
      "timestamps.cancelledAt": { $gte: today },
    }).session(session);

    if (cancelledCountToday >= 3) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You can cancel only 3 rides per day."
      );
    }
    ride.rideStatus = RideStatus.CANCELLED;
    ride.cancelledBy = CancelledBy.RIDER;
    ride.timestamps = {
      ...ride.timestamps,
      cancelledAt: new Date(),
    };
    await ride.save({ session });

    user.riderStatus = RiderStatus.IDLE;
    await user.save({ session });

    if (ride.driverId) {
      const driver = await Driver.findById(ride.driverId).session(session);
      if (driver) {
        driver.ridingStatus = DriverRidingStatus.IDLE;
        await driver.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    return {
      data: ride,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const giveFeedbackAndRateDriver = async (
  rideId: string,
  userId: string,
  feedback: string,
  rating: number
) => {
  const session = await Ride.startSession();
  session.startTransaction();

  try {
    const ride = await Ride.findById(rideId).session(session);
    if (!ride) throw new AppError(httpStatus.NOT_FOUND, "Ride not found");

    if (!ride.driverId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No driver assigned to this ride"
      );
    }

    if (ride.riderId.toString() !== userId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You are not authorized to rate this ride"
      );
    }

    if (ride.rating) {
      throw new AppError(httpStatus.BAD_REQUEST, "Feedback already submitted");
    }

    if (ride.rideStatus !== RideStatus.COMPLETED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Feedback allowed only for completed rides"
      );
    }

    if (rating < 1 || rating > 5) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Rating must be between 1 and 5"
      );
    }

    const rider = await User.findById(ride.riderId).session(session);

    if (!rider || rider.isBlocked === IsBlocked.BLOCKED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "User is not allowed to submit feedback"
      );
    }

    ride.feedback = feedback;
    ride.rating = rating;
    await ride.save({ session });

    const ratedRides = await Ride.find({
      driverId: ride.driverId,
      rating: { $exists: true },
    }).session(session);

    const totalRatings = ratedRides.length;
    const totalSum = ratedRides.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating =
      totalRatings === 0 ? 0 : parseFloat((totalSum / totalRatings).toFixed(1));

    await Driver.findByIdAndUpdate(
      ride.driverId,
      { rating: averageRating },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return {
      rideId: ride._id,
      driverId: ride.driverId,
      averageRating,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getFeedbacks = async () => {
  const totalRides = await Ride.countDocuments();
  const feedbackDocs = await Ride.find({
    feedback: { $exists: true, $ne: "" },
  }).select("feedback -_id");

  const feedbacks = feedbackDocs.map((doc) => doc.feedback as string);
  return {
    totalRides,
    feedbacks,
  };
};

export const RiderService = {
  getSingleRideForAdmin,
  updateRideLocation,
  getSingleRideForDriver,
  getFeedbacks,
  createRide,
  getRidesNearMe,
  getLatestAcceptedRideForDriver,
  acceptRide,
  pickupRider,
  startRide,
  payOffline,
  payOnline,
  arrivedDestination,
  getAllRidesForAdmin,
  getAllRidesForRider,
  getAllRidesForDriver,
  getSingleRideForRider,
  getDriversNearMe,
  rejectRide,
  cancelRideByRider,
  giveFeedbackAndRateDriver,
  getRequestedRideForRider,
};
