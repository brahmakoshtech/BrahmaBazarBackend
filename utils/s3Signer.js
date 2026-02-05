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
    // Check if key is already a full URL or data URI
    // Check if key is already a full URL or data URI
    if (!key || key.startsWith('data:')) {
        return key;
    }

    // If it's a URL, try to extract the key if it matches our S3 pattern
    if (key.startsWith('http')) {
        const extracted = extractKeyFromUrl(key);
        // If extracted is different, it means we found an S3 key within the URL.
        // We use that key to generate a fresh signature.
        if (extracted !== key) {
            key = extracted;
        } else {
            // It's a non-S3 URL (external), return as is
            return key;
        }
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

/**
 * Extracts the S3 key from a full URL or returns the key if it's already a key.
 * @param {string} url - The full S3 URL or object key
 * @returns {string} - The extracted S3 key
 */
export const extractKeyFromUrl = (url) => {
    if (!url || typeof url !== 'string') return url;

    // Return if it's already a key (doesn't start with http)
    if (!url.startsWith('http')) return url;

    try {
        const urlObj = new URL(url);

        // Handle S3 URLs
        if (urlObj.hostname.includes('amazonaws.com')) {
            // Decoded pathname to handle encoded characters like spaces
            let path = decodeURIComponent(urlObj.pathname);

            // Remove leading slash
            if (path.startsWith('/')) path = path.substring(1);

            // If path-style url (s3.region.amazonaws.com/bucket/key)
            // We need to remove the bucket name from the path if it exists
            // This is tricky without knowing the bucket name reliably here, 
            // but usually standard virtual-hosted style is bucket.s3.region.amazonaws.com/key

            // Simple heuristic: if the URL contains the bucket name in the host, the path is the key.
            // If not, maybe it's in the path.

            // Given the s3 setup in multer.js: bucket is process.env.AWS_BUCKET_NAME
            // But we can't access env in a pure utils function easily without dependency? 
            // s3Signer imports dotenv so we can use process.env.AWS_BUCKET_NAME

            const bucketName = process.env.AWS_BUCKET_NAME;

            // Check for path-style access
            if (path.startsWith(`${bucketName}/`)) {
                return path.replace(`${bucketName}/`, '');
            }

            return path;
        }

        // If it's some other URL, just return it (or maybe null?)
        return url;
    } catch (e) {
        return url; // Fallback
    }
};
