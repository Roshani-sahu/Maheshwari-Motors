import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    id: { type: Number },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["party", "supplier"],
      required: true,
    },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    gstin: { type: String },
    is_gst: { type: Number, enum: [0, 1], default: 1 },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    transport_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transport",
      default: null,
    },
    area_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Area",
      default: null,
    },
    balance: { type: Number, default: 0 },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, id: false },
);

contactSchema.index({ id: 1, user_id: 1 });
contactSchema.index({ type: 1, user_id: 1 });

export default mongoose.model("Contact", contactSchema);
