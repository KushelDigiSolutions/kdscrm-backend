import mongoose from "mongoose";

export const connectDb = async () => {
  await mongoose
    .connect(process.env.MONGO_DB, {
      dbName: process.env.MONGO_DB_NAME,
    })
    .then(() => console.log('✅ MONGO Database connected successfully!'))
    .catch((e) => console.log("❌ MONGO Database connection failed:", e.message));
};
