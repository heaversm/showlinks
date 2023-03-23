import mongoose from "mongoose";

const StatSchema = new mongoose.Schema({
  urlRef: {
    type: String,
    required: true,
  },
  accessDate: {
    type: String,
    default: Date.now,
  },

  browser: {
    type: String,
    required: false,
    default: "",
  },
  os: {
    type: String,
    required: false,
    default: "",
  },
  device: {
    type: String,
    required: false,
    default: "",
  },
});

export default mongoose.model("Stat", StatSchema);
