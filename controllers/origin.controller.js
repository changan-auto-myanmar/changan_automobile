import Origin from "../models/origin.model.js";
import CustomError from "../utils/customError.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";

// Create a new origin document (only needed once)
exports.createOriginDocument = async (req, res) => {
  try {
    const newOriginDoc = new Origin({ origins: [] });
    await newOriginDoc.save();
    res.status(201).json(newOriginDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new origin to the array
exports.addOrigin = async (req, res) => {
  try {
    const { origin } = req.body;
    const originDoc = await Origin.findOne();
    if (!originDoc)
      return res.status(404).json({ error: "Origin document not found" });
    originDoc.origins.push({ origin, addedAt: new Date() });
    await originDoc.save();
    res.status(200).json(originDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all origins
exports.getOrigins = async (req, res) => {
  try {
    const originDoc = await Origin.findOne();
    if (!originDoc)
      return res.status(404).json({ error: "Origin document not found" });
    res.status(200).json(originDoc.origins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remove an origin from the array
exports.removeOrigin = async (req, res) => {
  try {
    const { origin } = req.body;
    const originDoc = await Origin.findOne();
    if (!originDoc)
      return res.status(404).json({ error: "Origin document not found" });
    originDoc.origins = originDoc.origins.filter((o) => o.origin !== origin);
    await originDoc.save();
    res.status(200).json(originDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Extend an origin's duration
exports.extendOrigin = async (req, res) => {
  try {
    const { origin } = req.body;
    const originDoc = await Origin.findOne();
    if (!originDoc)
      return res.status(404).json({ error: "Origin document not found" });
    const targetOrigin = originDoc.origins.find((o) => o.origin === origin);
    if (targetOrigin) {
      targetOrigin.addedAt = new Date();
      await originDoc.save();
      res.status(200).json(originDoc);
    } else {
      res.status(404).json({ error: "Origin not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
