/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import PDFDocument from "pdfkit";
import AppError from "../errorHelpers/AppError";
import { Types } from "mongoose";

export interface IInvoiceData {
  transactionId: string;
  rideDate: Date;
  userName: string;
  totalFare: number;

  // additional fields
  travelDistance: number;
  riderId: Types.ObjectId;
  driverId?: Types.ObjectId;
  pickupLocation?: string | null;
  destinationLocation?: string | null;
  completedAt?: Date;
}

export const generatePdf = async (
  invoiceData: IInvoiceData
): Promise<Buffer> => {
  try {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffer: Uint8Array[] = [];

      doc.on("data", (chunk) => buffer.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffer)));
      doc.on("error", (err) => reject(err));

      // Header
      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("Ride Invoice", { align: "center" });
      doc.moveDown(1);

      // Transaction & Customer Info
      doc.font("Helvetica-Bold").fontSize(12).text("Transaction ID:");
      doc.font("Helvetica").text(invoiceData.transactionId);
      doc.moveDown(0.5);

      doc.font("Helvetica-Bold").text("Ride Date:");
      doc.font("Helvetica").text(invoiceData.rideDate.toLocaleString());
      doc.moveDown(0.5);

      doc.font("Helvetica-Bold").text("Customer Name:");
      doc.font("Helvetica").text(invoiceData.userName);
      doc.moveDown(1);

      // Ride Details
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("Ride Details", { underline: true });
      doc.moveDown(0.5);

      const details = [
        { label: "Travel Distance", value: `${invoiceData.travelDistance} km` },
        {
          label: "Completed At",
          value: invoiceData.completedAt?.toLocaleString() || "N/A",
        },
      ];

      details.forEach((detail) => {
        doc
          .font("Helvetica-Bold")
          .text(`${detail.label}: `, { continued: true });
        doc.font("Helvetica").text(detail.value);
        doc.moveDown(0.3);
      });

      doc.moveDown(1);
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text(`Total Amount: $${invoiceData.totalFare.toFixed(2)}`, {
          align: "right",
        });
      doc.moveDown(2);

      // Footer
      doc
        .fontSize(12)
        .text("Thank you for riding with us!", { align: "center" });
      doc
        .fontSize(10)
        .fillColor("gray")
        .text("Powered by Cario-Rides", { align: "center" });

      doc.end();
    });
  } catch (error: any) {
    console.log(error);
    throw new AppError(401, `PDF creation error: ${error.message}`);
  }
};
