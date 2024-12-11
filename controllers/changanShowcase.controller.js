import changanShowcase from "../models/changanShowcase.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import fs from "fs/promises";
import path from "path";

export const createShowcase = asyncErrorHandler(async (req, res, next) => {
  const { car_brand, car_name, car_slogan } = req.body;
  const car_color = req.body.car_color ? JSON.parse(req.body.car_color) : [];

  console.log("Received Car Color:", car_color);
  console.log("Received Files:", req.files);

  if (!car_brand || !car_name) {
    return next(new CustomError(400, "Please fill all required fields."));
  }

  if (!Array.isArray(car_color) || car_color.length === 0) {
    return next(new CustomError(400, "At least one car color is required."));
  }

  const carColors = car_color.map((color, index) => {
    if (!color.color_name || color.color_name.trim() === "") {
      throw new CustomError(
        400,
        `Color name is required for color #${index + 1}.`
      );
    }

    const carImage = req.files.find(
      (file) => file.fieldname === `car_color[${index}].car_image`
    );
    const carColorFile = req.files.find(
      (file) => file.fieldname === `car_color[${index}].car_color`
    );

    console.log(
      `Car Color #${index + 1} - Car Image Fieldname: ${
        carImage ? carImage.fieldname : "Not Found"
      }`
    );
    console.log(
      `Car Color #${index + 1} - Car Color File Fieldname: ${
        carColorFile ? carColorFile.fieldname : "Not Found"
      }`
    );

    if (!carImage || !carColorFile) {
      throw new CustomError(
        400,
        `Car color #${index + 1} requires both car image and car color files.`
      );
    }

    return {
      color_name: color.color_name,
      car_image: {
        filename: carImage.filename,
        filepath: carImage.path,
      },
      car_color: {
        filename: carColorFile.filename,
        filepath: carColorFile.path,
      },
    };
  });

  const mockupFile = req.files.find((file) => file.fieldname === "mockup");
  const carBannerFile = req.files.find(
    (file) => file.fieldname === "car_banner"
  );
  const carPorcheFile = req.files.find(
    (file) => file.fieldname === "car_porche"
  );

  if (!mockupFile)
    return next(new CustomError(400, "Mockup image is required."));
  if (!carBannerFile)
    return next(new CustomError(400, "Car Banner image is required."));
  if (!carPorcheFile)
    return next(new CustomError(400, "Car Porche file is required."));

  const carExteriorFiles = req.files.filter(
    (file) => file.fieldname === "car_exterior"
  );
  const carInteriorFiles = req.files.filter(
    (file) => file.fieldname === "car_interior"
  );
  const galleryFiles = req.files.filter((file) => file.fieldname === "gallery");

  // File count validation
  if (carExteriorFiles.length > 8)
    return next(
      new CustomError(400, "Car Exterior images cannot exceed more than 8.")
    );
  if (carInteriorFiles.length > 8)
    return next(
      new CustomError(400, "Car Interior images cannot exceed more than 8.")
    );
  if (galleryFiles.length > 8)
    return next(
      new CustomError(400, "Gallery images cannot exceed more than 8.")
    );

  const carExteriorImages = carExteriorFiles.map((file) => ({
    filename: file.filename,
    filepath: file.path,
  }));
  const carInteriorImages = carInteriorFiles.map((file) => ({
    filename: file.filename,
    filepath: file.path,
  }));
  const galleryImages = galleryFiles.map((file) => ({
    filename: file.filename,
    filepath: file.path,
  }));

  const newShowcase = new changanShowcase({
    car_brand,
    car_name,
    car_slogan,
    mockup: { filename: mockupFile.filename, filepath: mockupFile.path },
    car_banner: {
      filename: carBannerFile.filename,
      filepath: carBannerFile.path,
    },
    car_porche: {
      filename: carPorcheFile.filename,
      filepath: carPorcheFile.path,
    },
    car_exterior: carExteriorImages,
    car_interior: carInteriorImages,
    gallery: galleryImages,
    car_color: carColors,
  });

  const savedShowcase = await newShowcase.save();

  res.status(201).json({
    code: 201,
    status: "success",
    message: "Showcase created successfully.",
    // data: { showcase: savedShowcase },
  });
});

export const getAllShowcases = asyncErrorHandler(async (req, res, next) => {
  const showcases = await changanShowcase.find({}).lean();

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Showcases retrieved successfully.",
    data: { showcases },
  });
});

export const getShowcaseById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const showcase = await changanShowcase.findById(id).lean();

  if (!showcase) {
    return next(new CustomError(404, "Showcase not found."));
  }

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Showcase retrieved successfully.",
    data: { showcase },
  });
});

export const deleteShowcase = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const showcase = await changanShowcase.findById(id);

  if (!showcase) {
    return next(new CustomError(404, "Showcase not found."));
  }

  const filesToDelete = [];

  if (showcase.mockup) filesToDelete.push(showcase.mockup.filepath);
  if (showcase.car_banner) filesToDelete.push(showcase.car_banner.filepath);
  if (showcase.car_porche) filesToDelete.push(showcase.car_porche.filepath);

  showcase.car_exterior.forEach((file) => filesToDelete.push(file.filepath));
  showcase.car_interior.forEach((file) => filesToDelete.push(file.filepath));
  showcase.gallery.forEach((file) => filesToDelete.push(file.filepath));

  showcase.car_color.forEach((color) => {
    if (color.car_image) filesToDelete.push(color.car_image.filepath);
    if (color.car_color) filesToDelete.push(color.car_color.filepath);
  });

  for (const filePath of filesToDelete) {
    try {
      await fs.unlink(path.resolve(filePath));
    } catch (err) {
      console.error(
        `Failed to delete file: ${filePath}. Error: ${err.message}`
      );
    }
  }

  await changanShowcase.findByIdAndDelete(id);

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Showcase and associated files deleted successfully.",
  });
});

// export const deleteShowcase = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     // Find the showcase by ID
//     const showcase = await changanShowcase.findById(id);
//     if (!showcase) {
//       return next(new CustomError(404, "Showcase not found."));
//     }

//     // Gather all file paths to delete
//     const filesToDelete = [
//       showcase.mockup.filepath,
//       showcase.car_banner.filepath,
//       showcase.car_porche.filepath,
//       ...showcase.car_exterior.map((file) => file.filepath),
//       ...showcase.car_interior.map((file) => file.filepath),
//       ...showcase.gallery.map((file) => file.filepath),
//       ...showcase.car_color.map((color) => color.car_image.filepath),
//       ...showcase.car_color.map((color) => color.car_color.filepath),
//     ];

//     // Results container for the response
//     let deletionResults = {
//       deletedFiles: [],
//       warnings: [],
//       errors: [],
//     };

//     // Attempt to delete all files
//     for (const filePath of filesToDelete) {
//       try {
//         const resolvedPath = path.resolve(filePath);

//         // Check if file exists before deleting
//         if (
//           await fs
//             .access(resolvedPath)
//             .then(() => true)
//             .catch(() => false)
//         ) {
//           await fs.unlink(resolvedPath);
//           deletionResults.deletedFiles.push(resolvedPath);
//         } else {
//           deletionResults.warnings.push(`File not found: ${resolvedPath}`);
//         }
//       } catch (err) {
//         if (err.code === "ENOENT") {
//           deletionResults.warnings.push(`File not found: ${filePath}`);
//         } else if (err.code === "EACCES" || err.code === "EPERM") {
//           deletionResults.errors.push(
//             `Permission denied for file: ${filePath}. Ensure proper access rights.`
//           );
//         } else {
//           deletionResults.errors.push(
//             `Unexpected error for file: ${filePath}. Error: ${err.message}`
//           );
//         }
//       }
//     }

//     // Delete the showcase document from the database
//     await changanShowcase.findByIdAndDelete(id);

//     // Send the appropriate response based on deletion results
//     if (deletionResults.errors.length > 0) {
//       return res.status(500).json({
//         code: 500,
//         status: "fail",
//         message: "Some files could not be deleted.",
//         data: deletionResults,
//       });
//     } else if (deletionResults.warnings.length > 0) {
//       return res.status(200).json({
//         code: 200,
//         status: "partial_success",
//         message: "Showcase deleted with warnings.",
//         data: deletionResults,
//       });
//     } else {
//       return res.status(200).json({
//         code: 200,
//         status: "success",
//         message: "Showcase and all associated files deleted successfully.",
//         data: deletionResults,
//       });
//     }
//   } catch (error) {
//     next(error);
//   }
// };

export const updateShowcase = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { car_brand, car_name, car_slogan, car_color } = req.body;

  // Find showcase by ID
  const showcase = await changanShowcase.findById(id);
  if (!showcase) {
    return next(new CustomError(404, "Showcase not found"));
  }

  if (car_brand) showcase.car_brand = car_brand;
  if (car_name) showcase.car_name = car_name;
  if (car_slogan) showcase.car_slogan = car_slogan;

  if (car_color) {
    showcase.car_color = await Promise.all(
      car_color.map(async (color, index) => {
        if (!color.color_name) {
          throw new CustomError(
            400,
            `Color name is required for color #${index + 1}.`
          );
        }

        const carImage = req.files.find(
          (file) => file.fieldname === `car_color[${index}].car_image`
        );
        const carColorFile = req.files.find(
          (file) => file.fieldname === `car_color[${index}].car_color`
        );

        if (carImage) {
          if (showcase.car_color[index]?.car_image?.filepath) {
            try {
              await fs.unlink(
                path.resolve(showcase.car_color[index].car_image.filepath)
              );
              console.log(
                `Successfully deleted old car image: ${showcase.car_color[index].car_image.filepath}`
              );
            } catch (err) {
              console.error(
                `Failed to delete old car image at ${showcase.car_color[index].car_image.filepath}: ${err.message}`
              );
            }
          }
          color.car_image = {
            filename: carImage.filename,
            filepath: carImage.path,
          };
        }

        if (carColorFile) {
          if (showcase.car_color[index]?.car_color?.filepath) {
            try {
              await fs.unlink(
                path.resolve(showcase.car_color[index].car_color.filepath)
              );
              console.log(
                `Successfully deleted old car color file: ${showcase.car_color[index].car_color.filepath}`
              );
            } catch (err) {
              console.error(
                `Failed to delete old car color file at ${showcase.car_color[index].car_color.filepath}: ${err.message}`
              );
            }
          }
          color.car_color = {
            filename: carColorFile.filename,
            filepath: carColorFile.path,
          };
        }

        return color;
      })
    );
  }

  if (req.files) {
    const mockupFile = req.files.find((file) => file.fieldname === "mockup");
    const carBannerFile = req.files.find(
      (file) => file.fieldname === "car_banner"
    );
    const carPorcheFile = req.files.find(
      (file) => file.fieldname === "car_porche"
    );

    if (mockupFile) {
      if (showcase.mockup?.filepath) {
        await fs.unlink(path.resolve(showcase.mockup.filepath));
      }
      showcase.mockup = {
        filename: mockupFile.filename,
        filepath: mockupFile.path,
      };
    }

    if (carBannerFile) {
      if (showcase.car_banner?.filepath) {
        await fs.unlink(path.resolve(showcase.car_banner.filepath));
      }
      showcase.car_banner = {
        filename: carBannerFile.filename,
        filepath: carBannerFile.path,
      };
    }

    if (carPorcheFile) {
      if (showcase.car_porche?.filepath) {
        await fs.unlink(path.resolve(showcase.car_porche.filepath));
      }
      showcase.car_porche = {
        filename: carPorcheFile.filename,
        filepath: carPorcheFile.path,
      };
    }
  }

  const updatedShowcase = await showcase.save();

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Showcase updated successfully.",
    data: { showcase: updatedShowcase },
  });
});
