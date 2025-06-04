// utils/imageUploadToCloudinary.js
import cloudinary from "../configs/cloudinary.config.js"; // Ensure this path is correct
import streamifier from "streamifier";

// export const imageUploadToCloudinary = async (fileBuffer, folderName) => {
//   console.log("--- Inside imageUploadToCloudinary Utility ---");
//   console.log(
//     "1. fileBuffer received:",
//     fileBuffer ? `Length: ${fileBuffer.length} bytes` : "No fileBuffer received"
//   );
//   console.log("2. folderName received:", folderName);

//   if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
//     console.error("Error: Provided fileBuffer is invalid or empty.");
//     // Throw an error immediately if the buffer is bad
//     throw new Error("Invalid or empty image data provided for upload.");
//   }

//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       {
//         folder: folderName,
//         resource_type: "image",
//       },
//       (err, result) => {
//         console.log("--- Cloudinary upload_stream callback fired ---");
//         if (err) {
//           console.error("3. Cloudinary upload error:", err);
//           // Reject the promise with a detailed error
//           reject(
//             new Error(
//               `Cloudinary upload failed: ${err.message || JSON.stringify(err)}`
//             )
//           );
//         } else {
//           console.log("4. Cloudinary upload result (success):", result);
//           if (result && result.secure_url) {
//             console.log("5. Secure URL obtained:", result.secure_url);
//             resolve(result.secure_url);
//           } else {
//             console.error(
//               "6. Cloudinary upload succeeded, but secure_url was not found in the result:",
//               result
//             );
//             // This case indicates an unexpected result from Cloudinary
//             reject(
//               new Error(
//                 "Cloudinary upload succeeded, but no secure_url was returned."
//               )
//             );
//           }
//         }
//       }
//     );
//     // Pipe the buffer to the Cloudinary upload stream
//     streamifier.createReadStream(fileBuffer).pipe(stream);
//   });
// };

export const imageUploadToCloudinary = async (fileBuffer, folderName) => {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    throw new Error("Invalid or empty image data provided for upload.");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        resource_type: "image",
      },
      (err, result) => {
        if (err) {
          reject(
            new Error(
              `Cloudinary upload failed: ${err.message || JSON.stringify(err)}`
            )
          );
        } else {
          if (result && result.secure_url) {
            resolve(result.secure_url);
          } else {
            reject(
              new Error(
                "Cloudinary upload succeeded, but no secure_url was returned."
              )
            );
          }
        }
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

export const extractPublicId = (url) => {
  if (!url) {
    return null;
  }
  const parts = url.split("/");
  const imageName = parts.pop();
  const nameWithoutExtension = imageName.split(".")[0];
  const publicId =
    parts.slice(parts.length - 2).join("/") + "/" + nameWithoutExtension;
  return publicId;
};
