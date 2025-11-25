/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { faqServices } from "./faq.service";
import { IFaq } from "./faq.interface";

const askQuestion = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload: IFaq = {
      ...req.body,
    };

    const faq = await faqServices.askQuestion(payload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Question submitted successfully",
      data: faq,
    });
  }
);

const replyQuestion = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { answer } = req.body;

    const updatedFaq = await faqServices.replyQuestion(id, { answer });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Answer submitted successfully",
      data: updatedFaq,
    });
  }
);

const getAllFaqs = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const faqs = await faqServices.getAllFaqs(query as Record<string, string>);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All FAQs retrieved successfully",
    data: faqs,
  });
});

const getSingleFaq = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const faq = await faqServices.getSingleFaq(id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "FAQ retrieved successfully",
    data: faq,
  });
});

export const faqController = {
  askQuestion,
  replyQuestion,
  getAllFaqs,
  getSingleFaq,
};
