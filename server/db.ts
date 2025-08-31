import mongoose from "mongoose";

let isConnected = false;

export async function connectDB(uri?: string) {
  if (isConnected) return mongoose.connection;
  const mongoUri = uri || process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is not set");
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri, { dbName: "flowfinance" });
  isConnected = true;
  return mongoose.connection;
}
