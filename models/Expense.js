import mongoose from "mongoose";

const mySchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    itemCode: {
      type: String,
    },
    quantity: {
      type: String,
    },
    unit: {
      type: String,
    },
    purchasePrice: {
      type: String,
    },
    salesPrice: {
      type: String,
    },
    purchaseDate: {
      type: String,
    },
    category: {
      type: String,
    },
    organizationId: String

  },
  { timestamps: true }
);

const Clients = mongoose.model("Expense", mySchema);

export default Clients;
