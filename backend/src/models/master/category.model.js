import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    id: { type: Number },
    name: { type: String, required: true },
    description: { type: String },
    brand_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
      },
    ],
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true, id: false },
);

categorySchema.index({ id: 1, user_id: 1 });

export default mongoose.model("Category", categorySchema);
