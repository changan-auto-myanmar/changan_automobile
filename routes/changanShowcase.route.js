import express from "express";
import {
  createShowcase,
  getAllShowcases,
  getShowcaseById,
  deleteShowcase,
  updateShowcase,
} from "../controllers/changanShowcase.controller.js";
import { dynamicFieldsUpload } from "../middlewares/dynamicFilesFeildsMiddleware.js";

const router = express.Router();

const carColorFields = Array.from({ length: 10 }, (_, index) => ({
  name: `car_color[${index}].car_image`,
  maxCount: 1,
}));

const carColorNames = Array.from({ length: 10 }, (_, index) => ({
  name: `car_color[${index}].car_color`,
  maxCount: 1,
}));

const fieldsConfig = [...carColorFields, ...carColorNames];

router.post("/showcase", dynamicFieldsUpload(fieldsConfig), createShowcase);
router.get("/showcases", getAllShowcases);
router.get("/showcase/:id", getShowcaseById);
router.delete("/showcase/:id", deleteShowcase);
router.put("/showcase/:id", dynamicFieldsUpload(fieldsConfig), updateShowcase);

export default router;
