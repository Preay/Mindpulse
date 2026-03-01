import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

export class S3Service {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
    this.bucket = process.env.AWS_S3_BUCKET || 'mindpulse-audio';
  }

  async uploadAudio(audioBuffer: Buffer, userId: string): Promise<{ key: string; url: string }> {
    const key = `journals/${userId}/${crypto.randomUUID()}.wav`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: audioBuffer,
      ContentType: 'audio/wav',
      ServerSideEncryption: 'AES256',
    });

    await this.client.send(command);

    // Generate presigned URL (valid for 7 days)
    const getCommand = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const url = await getSignedUrl(this.client, getCommand, { expiresIn: 7 * 24 * 60 * 60 });

    return { key, url };
  }

  async deleteAudio(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  async generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }
}
