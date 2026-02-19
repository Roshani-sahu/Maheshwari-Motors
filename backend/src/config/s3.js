import { S3Client } from "@aws-sdk/client-s3";
import env from "./env.js";

class S3Config {
  constructor() {
    this.client = null;
  }

  getClient() {
    if (!this.client) {
      this.client = new S3Client({
        region: env.AWS_REGION,
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      });
    }
    return this.client;
  }

  getBucketName() {
    return env.AWS_S3_BUCKET_NAME;
  }
}

export default new S3Config();
