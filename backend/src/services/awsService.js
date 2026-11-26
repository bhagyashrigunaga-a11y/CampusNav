
/**
 * CampusNav - AWS Services Integration
 * Amazon S3: Floor Plan Storage
 * Amazon CloudWatch: Application Metrics
 */

const fs = require('fs');
const path = require('path');

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} = require('@aws-sdk/client-s3');

const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const {
  CloudWatchClient,
  PutMetricDataCommand
} = require('@aws-sdk/client-cloudwatch');

const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const S3_BUCKET_NAME = process.env.CAMPUSNAV_S3_BUCKET;

const s3 = new S3Client({
  region: AWS_REGION
});

const cloudWatch = new CloudWatchClient({
  region: AWS_REGION
});

class AwsService {
  constructor() {
    console.log(`[AWS] Region: ${AWS_REGION}`);
  }

  async uploadFloorPlan(fileBuffer, fileName, mimeType) {
    if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
      throw new Error('The floor plan file is empty or invalid.');
    }

    const timestamp = Date.now();
    const cleanName = `${timestamp}-${path.basename(fileName || 'floor-plan').replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const key = `floor-plans/${cleanName}`;
    const extension = path.extname(fileName || '').toLowerCase();
    const mimeTypesByExtension = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp'
    };
    const contentType = mimeType || mimeTypesByExtension[extension] || 'application/octet-stream';

    if (S3_BUCKET_NAME) {
      try {
        const signedUrl = await this.getFloorPlanUrl(key);
        await s3.send(new PutObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType
        }));

        await this.logMetric('FloorPlanUploadSuccess', 1);

        return {
          success: true,
          storage: 's3',
          key,
          bucket: S3_BUCKET_NAME,
          url: signedUrl
        };
      } catch (err) {
        console.error('[AWS S3] Upload failed; trying local storage:', err.message);
        return this.saveFloorPlanLocally(fileBuffer, cleanName, err);
      }
    }

    return this.saveFloorPlanLocally(fileBuffer, cleanName);
  }

  saveFloorPlanLocally(fileBuffer, cleanName, s3Error) {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');

    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, cleanName);
      fs.writeFileSync(filePath, fileBuffer, { flag: 'wx' });

      return {
        success: true,
        storage: 'local',
        url: `/uploads/${cleanName}`,
        filePath
      };
    } catch (localError) {
      const message = s3Error
        ? `S3 upload failed (${s3Error.message}); local storage also failed (${localError.message}).`
        : `Local floor plan storage failed (${localError.message}).`;
      throw new Error(message);
    }
  }

  async getFloorPlanUrl(key) {
    if (!S3_BUCKET_NAME) {
      return key;
    }

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key
    });

    return await getSignedUrl(s3, command, {
      expiresIn: 3600
    });
  }

  async logMetric(metricName, value, unit = 'Count', dimensions = {}) {
    const metricDimensions = Object.entries(dimensions).map(
      ([Name, Value]) => ({ Name, Value: String(Value) })
    );

    try {
      await cloudWatch.send(new PutMetricDataCommand({
        Namespace: 'CampusNav',
        MetricData: [{
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Dimensions: metricDimensions,
          Timestamp: new Date()
        }]
      }));

      console.log(`[CloudWatch] Published ${metricName}: ${value}`);

      return { success: true, metricName, value };
    } catch (err) {
      console.error('[CloudWatch] Metric publishing failed:', err.message);
      return { success: false, metricName, error: err.message };
    }
  }
}

module.exports = new AwsService();
