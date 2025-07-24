import mongoose from 'mongoose';

const mySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    organizationId: { type: String, required: true },
  },
  { timestamps: true }
);

// Add compound unique index: name + organizationId
mySchema.index({ name: 1, organizationId: 1 }, { unique: true });

const LeadStat = mongoose.model('LeadStat', mySchema);

export default LeadStat;
