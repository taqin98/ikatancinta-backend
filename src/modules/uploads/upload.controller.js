import { createUpload, getUploads } from "./upload.service.js";

export async function listUploadsController(_req, res, next) {
  try {
    res.json(await getUploads());
  } catch (error) {
    next(error);
  }
}

export async function createUploadController(req, res, next) {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "File is required" });
      return;
    }

    if (!req.body?.orderId && !req.body?.order_id) {
      res.status(422).json({ success: false, message: "orderId is required" });
      return;
    }

    res.status(201).json({
      success: true,
      ...(await createUpload({ file: req.file, body: req.body })),
    });
  } catch (error) {
    next(error);
  }
}
