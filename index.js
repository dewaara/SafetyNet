import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/auth.js";
const router = express.Router();

const app = express();
dotenv.config();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);

// MongoDB Connection
const PORT = process.env.PORT || 8000;
const MONGOURL = process.env.MONGO_URL;

mongoose
  .connect(MONGOURL,{ useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log('Server running on http://localhost:${PORT}');
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));


  // Token Generation Functions
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn: "7d" });
};

// Middleware to Verify Access Token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(403).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};


const complaintSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  medium: String,
  category: String,
  date: String,
  time: String,
  complaint: String,
  name: String,
  phone: String,
  imageBase64: String,
});

const ComplaintModel = mongoose.model("complaints", complaintSchema); 


const websiteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  email: { type: String, required: true },
  androidId: { type: String, required: true },
  urls: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },

});

const WebsiteInfoModel = mongoose.model("websiteInfo", websiteSchema); 


app.post("/pushData", verifyToken, async (req, res) => {
  try {
    const { medium, category, date, time, complaint, name, phone, imageBase64 } = req.body;

    const newComplaint = new ComplaintModel({
      userId: req.user.id,
      medium,
      category,
      date,
      time,
      complaint,
      name,
      phone,
      imageBase64,
    });

    await newComplaint.save();

    res.status(201).json({
      message: "Complaint data saved successfully!",
      data: newComplaint,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
});

//  GET: Fetch Complaint Data (optional filter)
app.get("/pushData", async (req, res) => {
  try {
    const { date } = req.query;
    const filter = date ? { date } : {};
    const data = await ComplaintModel.find(filter);
    res.status(200).json({
      message: "Complaint data fetched successfully",
      data,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/browsingAdd", verifyToken, async (req, res) => {
  try {
    const { email, androidId, urls, timestamp } = req.body;

    // Basic validation
    if (!email || !androidId || !urls) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const websiteInfo = new WebsiteInfoModel({
      userId: req.user.id,
      email,
      androidId,
      urls,
      timestamp: timestamp ? new Date(timestamp) : Date.now(),
    });

    await websiteInfo.save();

    res.status(201).json({
      message: "Website info data saved successfully!",
      data: websiteInfo,
    });
  } catch (err) {
    console.error("Error saving website info:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/auth/browsingAdd", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Fetch all browsing info for the email
    const data = await WebsiteInfoModel.find({ email });

    if (!data.length) {
      return res.status(404).json({ message: "No data found for this email" });
    }

    res.status(200).json({
      message: `Browsing data for ${email} fetched successfully`,
      data,
    });
  } catch (err) {
    console.error("Error fetching browsing info:", err);
    res.status(500).json({ error: err.message });
  }
});



