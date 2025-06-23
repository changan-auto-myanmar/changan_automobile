import express from "express";
import {
  createCsrContent,
  addImagesToCsrContent,
  getAllCsrContents,
  getCsrContentById,
  deleteCsrDocument,
  deleteCsrImage,
  updateCsrTextContent,
  replaceCsrImage,
} from "../controllers/csr.controller.js";
import multerImageUpload from "../middlewares/multerImageUpload.middleware.js";
const router = express.Router();

router.post("/csr", multerImageUpload.array("csrImages", 5), createCsrContent);
router.get("/csr/public", getAllCsrContents);
router.get("/csr/public/:id", getCsrContentById);
router.post(
  "/csr/:id",
  multerImageUpload.array("csrImages", 5),
  addImagesToCsrContent
);
router.patch("/csr/text/:id", updateCsrTextContent);
router.patch(
  "/csr/image/:id/:imageId",
  multerImageUpload.single("csrImages"),
  replaceCsrImage
);
router.delete("/csr/:id", deleteCsrDocument);
router.delete("/csr/:id/image/:imageId", deleteCsrImage);

export default router;
