import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Config from "../../config/s3.js";
import { ApiError } from "../../utils/index.js";
import crypto from "crypto";

class S3Service {
  constructor() {
    this.client = s3Config.getClient();
    this.bucketName = s3Config.getBucketName();
  }

  generateFileName(originalName) {
    const ext = originalName.split(".").pop();
    const uniqueId = crypto.randomBytes(16).toString("hex");
    return `${uniqueId}.${ext}`;
  }

  async uploadFile(fileBuffer, originalName, mimeType, folder = "items") {
    try {
      const fileName = this.generateFileName(originalName);
      const key = `${folder}/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      });
      await this.client.send(command);

      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    } catch (error) {
      console.error("S3 upload error:", error);
      throw ApiError.internal("Failed to upload file");
    }
  }

  async deleteFile(fileUrl) {
    try {
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1);

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.client.send(command);
    } catch (error) {
      console.error("S3 delete error:", error);
    }
  }

  async getSignedUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      console.error("S3 signed URL error:", error);
      throw ApiError.internal("Failed to generate signed URL");
    }
  }
}

export default new S3Service();
