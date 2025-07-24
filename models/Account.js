// models/Account.js
import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
    accountOwner: { type: String },
    accountName: { type: String, required: true },
    parentAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
    accountNumber: { type: String },
    website: { type: String },
    tickerSymbol: { type: String },
    accountType: { type: String, enum: ['None', 'Customer', 'Partner', 'Vendor'], default: 'None' },
    ownership: { type: String, enum: ['None', 'Private', 'Public'], default: 'None' },
    industry: { type: String, default: 'None' },
    annualRevenue: { type: Number },
    sicCode: { type: String },
    exchangeRate: { type: Number, default: 1 },
    currency: { type: String, default: 'INR' },

    billingStreet: { type: String },
    billingCity: { type: String },
    billingState: { type: String },
    billingCode: { type: String },
    billingCountry: { type: String },

    shippingStreet: { type: String },
    shippingCity: { type: String },
    shippingState: { type: String },
    shippingCode: { type: String },
    shippingCountry: { type: String },

    description: { type: String },
    organizationId: { type: String }
}, {
    timestamps: true
});

// module.exports = mongoose.model('Account', accountSchema);



const AccountModel = mongoose.model('Account', accountSchema);
export default AccountModel;