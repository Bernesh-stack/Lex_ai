import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true, 
        unique: true,
        lowercase: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    documentsCount: {
      type: Number,
      default: 0,
    },
 },
 { timestamps: true }
)

const User = mongoose.model('User', Schema);
export default User;
