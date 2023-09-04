import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema({
  request__title: {
    type: String,
    required: true,
  },
  request__description: {
    type: String,
    required: true,
  },
  request__category: {
    type: String,
    required: true,
  },
  request__priority: {
    type: String,
    required: true,
  },
  request__username: {
    type: String,
    required: true,
  },
  request__date: {
    type: String,
    default: Date.now,
  },
});

export default mongoose.model("Request", RequestSchema);
