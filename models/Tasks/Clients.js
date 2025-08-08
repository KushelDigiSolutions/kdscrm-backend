import mongoose from "mongoose";
import jwt from "jsonwebtoken"

const mySchema = new mongoose.Schema(
  {
    Name: {
      type: String,
    },
    Email: {
      type: String,
    },
    Password: {
      type: String
    },
    role: {
      type: String,
      default: "client"
    },
    City: {
      type: String,
    },
    State: {
      type: String,
    },
    ZipCode: {
      type: String,
    },
    PhoneNumber: {
      type: String,
    },
    Country: {
      type: String,
    },
    Address: {
      type: String,
    },
    isDisable: {
      type: Boolean,
      default: false
    },
    Company: {
      type: String,
    }, Currency: {
      type: String,
    }, Language: {
      type: String,
    }, countryCode: {
      type: String,
    },
    organizationId: String
  },
  { timestamps: true }
);

mySchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.SK,
    {
      expiresIn: "500d",
    }
  );
};

const Clients = mongoose.model("Clients", mySchema);

export default Clients;
