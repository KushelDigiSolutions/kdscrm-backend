import mongoose from "mongoose";

const mySchema = new mongoose.Schema({
  LeadOwner: String,
  LeadCreator: String,
  Company: String,
  FirstName: String,
  LastName: String,
  Title: String,
  Email: String,
  Phone: String,
  Fax: String,
  Mobile: String,
  Website: String,
  LeadSource: String,
  NoOfEmployee: String,
  Industry: String,
  LeadStatus: String,
  AnnualRevenue: String,
  Rating: String,
  EmailOptOut: Boolean,
  SkypeID: String,
  SecondaryEmail: String,
  Twitter: String,
  Street: String,
  City: String,
  State: String,
  ZipCode: String,
  Country: String,
  DescriptionInfo: String,
  image: String,
  date: String,
  LinkedIn: String,
  CompanyLinkedIn: String,
  generated: {
    type: String,
    default: false
  },
  isOpen: {
    type: String,
    default: "true",
  },
  createAt: {
    type: Date,
    default: Date.now()
  },
  status: {
    type: String,
    default: "Open"
  },
  closeDate: String,

  invoiceId: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  }],
  quatationId: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quatation'
  }],

  // dynamicFields: {
  //   type: mongoose.Schema.Types.Mixed,
  //   default: {},
  // },
  organizationId: String
});

const Lead = mongoose.model("Lead", mySchema);

export default Lead;
