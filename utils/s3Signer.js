import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

/**
 * Generates a presigned URL for a given S3 object key.
 * @param {string} key - The S3 object key (path in bucket)
 * @returns {Promise<string>} - The signed URL
 */
export const generateSignedUrl = async (key) => {
    // console.log("🔑 Signing Key:", key);
    // Check if key is already a full URL (legacy support or external links)
    if (!key || key.startsWith('http')) {
        // console.log("⏩ Skipping (already URL):", key);
        return key;
    }

    try {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
        });

        // 24 hours expiry (86400 seconds)
        const url = await getSignedUrl(s3, command, { expiresIn: 86400 });
        // console.log("✅ Signed URL:", url.substring(0, 50) + "...");
        return url;
    } catch (error) {
        console.error("❌ Signing Error:", error);
        return key; // Fallback to key on error
    }
};

/**
 * Helper to process an array of images/keys
 * @param {Array<string>} keys 
 * @returns {Promise<Array<string>>}
 */
export const signUrls = async (keys) => {
    if (!keys || !Array.isArray(keys)) return [];

    return await Promise.all(keys.map(async (key) => {
        return await generateSignedUrl(key);
    }));
};
