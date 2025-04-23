const CLOUDINARY_UPLOAD_PRESET = 'cryptchat';
const CLOUDINARY_CLOUD_NAME = 'dp8bfdbab';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Upload an image to Cloudinary
 * @param {File} file - The file to upload
 * @param {Function} progressCallback - Optional callback for upload progress
 * @returns {Promise<string>} - The URL of the uploaded image
 */
export const uploadImage = async (file, progressCallback = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    // Create XMLHttpRequest to track progress
    const xhr = new XMLHttpRequest();
    
    const uploadPromise = new Promise((resolve, reject) => {
      xhr.open('POST', CLOUDINARY_UPLOAD_URL, true);
      
      // Setup progress tracking if callback provided
      if (progressCallback) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            progressCallback(progress);
          }
        };
      }
      
      xhr.onload = function() {
        if (this.status >= 200 && this.status < 300) {
          const response = JSON.parse(this.response);
          resolve(response.secure_url);
        } else {
          reject(new Error(`Upload failed with status ${this.status}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(formData);
    });
    
    return await uploadPromise;
    
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {File[]} files - Array of files to upload
 * @param {Function} progressCallback - Optional callback for upload progress
 * @returns {Promise<string[]>} - Array of URLs of the uploaded images
 */
export const uploadMultipleImages = async (files, progressCallback = null) => {
  try {
    const uploadPromises = Array.from(files).map(async (file, index) => {
      const url = await uploadImage(file, (progress) => {
        if (progressCallback) {
          // Calculate overall progress
          const individualProgress = progress / files.length;
          const previousFilesProgress = (index / files.length) * 100;
          progressCallback(Math.round(previousFilesProgress + individualProgress));
        }
      });
      return url;
    });
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple images to Cloudinary:', error);
    throw new Error('Failed to upload images');
  }
};

export default {
  uploadImage,
  uploadMultipleImages,
  CLOUD_NAME: CLOUDINARY_CLOUD_NAME
};
