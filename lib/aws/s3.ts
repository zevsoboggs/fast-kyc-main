import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AWS_CONFIG, S3_CONFIG } from './config';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const s3Client = new S3Client(AWS_CONFIG);

export interface UploadOptions {
  folder?: string;
  contentType?: string;
  encrypt?: boolean;
}

export async function uploadFile(
  file: Buffer,
  fileName: string,
  options: UploadOptions = {}
): Promise<{ key: string; url: string }> {
  try {
    let processedFile = file;
    let finalContentType = options.contentType || 'application/octet-stream';
    let fileExt = fileName.split('.').pop()?.toLowerCase();

    // Convert WebP and other formats to JPEG for AWS Textract compatibility
    const needsConversion = ['webp', 'gif', 'bmp', 'tiff', 'tif', 'heic', 'heif'].includes(fileExt || '');
    const needsOptimization = options.folder?.includes('verifications'); // Optimize document images

    if (needsConversion || needsOptimization) {
      console.log(`Processing image for AWS Textract: ${fileExt}`);

      let pipeline = sharp(file);

      // Enhance image for better OCR
      if (needsOptimization) {
        pipeline = pipeline
          .resize(2000, 2000, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .normalize() // Improve contrast
          .sharpen() // Enhance edges
          .toColorspace('srgb'); // Ensure proper color space
      }

      processedFile = await pipeline
        .jpeg({
          quality: 95,
          chromaSubsampling: '4:4:4' // Better quality
        })
        .toBuffer();

      fileExt = 'jpg';
      finalContentType = 'image/jpeg';
    }

    const uniqueFileName = `${uuidv4()}.${fileExt}`;
    const key = options.folder
      ? `${options.folder}/${uniqueFileName}`
      : uniqueFileName;

    const uploadParams: any = {
      Bucket: S3_CONFIG.bucket,
      Key: key,
      Body: processedFile,
      ContentType: finalContentType,
    };

    // Add server-side encryption with KMS
    if (options.encrypt && S3_CONFIG.kmsKeyId) {
      uploadParams.ServerSideEncryption = 'aws:kms';
      uploadParams.SSEKMSKeyId = S3_CONFIG.kmsKeyId;
    }

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    return {
      key,
      url: `https://${S3_CONFIG.bucket}.s3.${AWS_CONFIG.region}.amazonaws.com/${key}`,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`Failed to upload file: ${error}`);
  }
}

export async function getFile(key: string): Promise<Buffer> {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: key,
    });

    const response = await s3Client.send(command);
    const stream = response.Body as any;

    return Buffer.from(await stream.transformToByteArray());
  } catch (error) {
    console.error('S3 get file error:', error);
    throw new Error(`Failed to get file: ${error}`);
  }
}

export async function deleteFile(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('S3 delete file error:', error);
    throw new Error(`Failed to delete file: ${error}`);
  }
}

export async function getSignedUploadUrl(
  fileName: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<{ uploadUrl: string; key: string }> {
  try {
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExt}`;
    const key = `uploads/${uniqueFileName}`;

    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return { uploadUrl, key };
  } catch (error) {
    console.error('S3 signed URL error:', error);
    throw new Error(`Failed to generate signed URL: ${error}`);
  }
}

export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('S3 signed download URL error:', error);
    throw new Error(`Failed to generate signed download URL: ${error}`);
  }
}
