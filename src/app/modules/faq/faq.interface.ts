import { Types } from "mongoose";

export interface IFaq {
  _id?: Types.ObjectId;
  email: string;
  name: string;
  question: string;
  answer?: string;
}
