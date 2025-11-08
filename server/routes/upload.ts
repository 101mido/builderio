import { RequestHandler } from "express";
import { UploadPayload, UploadResponse } from "@shared/api";

export const handleUpload: RequestHandler = async (req, res) => {
  try {
    const payloadString = req.body.payload;

    if (!payloadString) {
      return res.status(400).json({
        success: false,
        message: "Missing payload in request",
      } as UploadResponse);
    }

    let payload: UploadPayload;
    try {
      payload = JSON.parse(payloadString);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON in payload",
      } as UploadResponse);
    }

    // Validate required fields
    if (!payload.source || !payload.destination || !payload.audios_list) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: source, destination, or audios_list",
      } as UploadResponse);
    }

    if (!Array.isArray(payload.audios_list) || payload.audios_list.length === 0) {
      return res.status(400).json({
        success: false,
        message: "audios_list must be a non-empty array",
      } as UploadResponse);
    }

    // Get uploaded files
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    if (!files || !files.files) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      } as UploadResponse);
    }

    const uploadedFiles = files.files;

    // In a real implementation, you would:
    // 1. Process each file according to the payload
    // 2. Call webhooks with results
    // 3. Store files in appropriate locations
    // 4. Handle errors appropriately

    console.log("Upload request received:");
    console.log("Source:", payload.source);
    console.log("Destination:", payload.destination);
    console.log("Files count:", uploadedFiles.length);
    console.log("Audio entries:", payload.audios_list.length);
    console.log("Webhooks:", payload.audios_list.map((a) => a.webhook));

    // For now, just acknowledge successful reception
    const response: UploadResponse = {
      success: true,
      message: `Successfully received ${uploadedFiles.length} file(s) for processing`,
      processedFiles: uploadedFiles.length,
    };

    res.json(response);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during upload",
    } as UploadResponse);
  }
};
