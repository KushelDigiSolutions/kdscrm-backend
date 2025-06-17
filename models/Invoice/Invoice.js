import mongoose from "mongoose";

const mySchema = new mongoose.Schema({
    User: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    InvoiceNo:String,
    GstNo:String,
    SacCode:String,
    PlacedSupply:String,
    BillTo:String,
    ShipTo:String,
    ClientName:String,
    Address:String,
    Mobile:Number,
    Email:String,
    ItemDescription:String,
    Qty:String,
    Price:String,
    Amount:String,
    BalanceAmount:String,
    Note:String,
    currency:String,
    ts: {
      type: String,
      default: new Date().getTime()
  },
  },{timestamps:true});

  const Invoice = mongoose.model("Invoice", mySchema);

  export default Invoice;