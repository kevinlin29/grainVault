const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const exifParser = require('exif-parser');
const { app } = require('electron');
const { v4: uuidv4 } = require('uuid');

class FileSystemService {
  constructor() {
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.arw', '.raw', '.cr2', '.nef', '.orf', '.rw2'];
    this.userDataPath = app.getPath('userData');
    this.thumbnailsPath = path.join(this.userDataPath, 'thumbnails');
    this.compressedPath = path.join(this.userDataPath, 'compressed');
    
    // Ensure directories exist
    if (!fs.existsSync(this.thumbnailsPath)) {
      fs.mkdirSync(this.thumbnailsPath, { recursive: true });
    }
    
    if (!fs.existsSync(this.compressedPath)) {
      fs.mkdirSync(this.compressedPath, { recursive: true });
    }
    
    console.log('FileSystemService initialized');
    console.log('Thumbnails directory:', this.thumbnailsPath);
    console.log('Compressed images directory:', this.compressedPath);
  }
  
  /**
   * Read a directory and find image files
   * @param {string} dirPath - The directory path to read
   * @returns {Promise<Array>} - Array of image file objects
   */
  async readDirectory(dirPath) {
    try {
      console.log(`Reading directory: ${dirPath}`);
      const files = await fs.promises.readdir(dirPath);
      
      // Filter for supported image formats
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return this.supportedFormats.includes(ext);
      });
      
      console.log(`Found ${imageFiles.length} supported image files`);
      
      // Sort files naturally (1, 2, 10 instead of 1, 10, 2)
      imageFiles.sort((a, b) => {
        // Extract numbers from filenames for natural sorting
        const aNum = a.match(/\d+/) ? parseInt(a.match(/\d+/)[0]) : 0;
        const bNum = b.match(/\d+/) ? parseInt(b.match(/\d+/)[0]) : 0;
        
        if (aNum === bNum) {
          return a.localeCompare(b);
        }
        return aNum - bNum;
      });
      
      // Return file objects with path and metadata
      return Promise.all(imageFiles.map(async (file, index) => {
        const filePath = path.join(dirPath, file);
        const metadata = await this.extractMetadata(filePath);
        
        return {
          filename: file,
          path: filePath,
          index: index,
          metadata
        };
      }));
    } catch (error) {
      console.error('Error reading directory:', error);
      throw error;
    }
  }
  
  /**
   * Generate a thumbnail for a roll from an image
   * @param {string} imagePath - Path to the source image
   * @param {number} size - Size of the thumbnail (width & height)
   * @returns {Promise<string>} - Path to the generated thumbnail
   */
  async generateThumbnail(imagePath, size = 300) {
    try {
      console.log(`Generating thumbnail for: ${imagePath}, size: ${size}px`);
      
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Source image does not exist: ${imagePath}`);
      }
      
      // Ensure the thumbnails directory exists
      if (!fs.existsSync(this.thumbnailsPath)) {
        fs.mkdirSync(this.thumbnailsPath, { recursive: true });
        console.log(`Created thumbnails directory: ${this.thumbnailsPath}`);
      }
      
      // Create a unique filename for the thumbnail
      const thumbnailFilename = `${uuidv4()}.jpg`;
      const outputPath = path.join(this.thumbnailsPath, thumbnailFilename);
      
      console.log(`Saving thumbnail to: ${outputPath}`);
      
      // Generate thumbnail using sharp
      await sharp(imagePath)
        .resize(size, size, { fit: 'cover' })
        .jpeg({ quality: 80 }) // Ensure output is JPEG with decent quality
        .toFile(outputPath);
      
      // Verify that the thumbnail was created
      if (!fs.existsSync(outputPath)) {
        throw new Error(`Failed to create thumbnail at: ${outputPath}`);
      }
      
      console.log(`Thumbnail successfully generated at: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      
      // Provide a fallback if thumbnail generation fails
      const defaultThumbnailPath = path.join(__dirname, '..', 'app', 'public', 'default-thumbnail.jpg');
      
      if (fs.existsSync(defaultThumbnailPath)) {
        console.log(`Using default thumbnail: ${defaultThumbnailPath}`);
        return defaultThumbnailPath;
      }
      
      throw error;
    }
  }
  
  /**
   * Extract metadata from an image file
   * @param {string} imagePath - Path to the image
   * @returns {Promise<Object>} - Object containing image metadata
   */
  async extractMetadata(imagePath) {
    try {
      // Read file stats
      const stats = await fs.promises.stat(imagePath);
      
      // Read first few bytes for EXIF data
      const buffer = Buffer.alloc(65635); // Allocate buffer for EXIF data
      const fd = await fs.promises.open(imagePath, 'r');
      await fd.read(buffer, 0, 65635, 0);
      await fd.close();
      
      // Extract EXIF data if available
      let exif = {};
      try {
        const parser = exifParser.create(buffer);
        const result = parser.parse();
        exif = result.tags;
      } catch (exifError) {
        console.log('No EXIF data found or error parsing:', exifError);
      }
      
      // Get image dimensions
      const dimensions = await this.getImageDimensions(imagePath);
      
      return {
        filename: path.basename(imagePath),
        width: dimensions.width,
        height: dimensions.height,
        format: path.extname(imagePath).slice(1).toUpperCase(),
        size: stats.size,
        dateModified: stats.mtime.toISOString(),
        exif
      };
    } catch (error) {
      console.error('Error extracting metadata:', error);
      // Return basic metadata if there's an error
      return {
        filename: path.basename(imagePath),
        format: path.extname(imagePath).slice(1).toUpperCase(),
        size: 0,
        width: 0,
        height: 0,
        dateModified: new Date().toISOString(),
        exif: {}
      };
    }
  }
  
  /**
   * Get dimensions of an image using sharp
   * @param {string} imagePath - Path to the image
   * @returns {Promise<Object>} - Object with width and height
   */
  async getImageDimensions(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height
      };
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      return { width: 0, height: 0 };
    }
  }
  
  /**
   * Read an image file as a buffer
   * @param {string} imagePath - Path to the image
   * @returns {Promise<Buffer>} - Image buffer
   */
  async readImage(imagePath) {
    try {
      return await fs.promises.readFile(imagePath);
    } catch (error) {
      console.error('Error reading image:', error);
      throw error;
    }
  }
  
  /**
   * Clean up unused thumbnails (not currently associated with any rolls)
   * @param {Array<string>} activeThumbnailPaths - Array of thumbnail paths in use
   * @returns {Promise<number>} - Number of thumbnails deleted
   */
  async cleanupThumbnails(activeThumbnailPaths) {
    try {
      const thumbnailFiles = await fs.promises.readdir(this.thumbnailsPath);
      let deletedCount = 0;
      
      for (const thumbnailFile of thumbnailFiles) {
        const thumbnailPath = path.join(this.thumbnailsPath, thumbnailFile);
        
        // Check if this thumbnail is in the active list
        const isActive = activeThumbnailPaths.some(activePath => 
          activePath === thumbnailPath || activePath.endsWith(thumbnailFile)
        );
        
        if (!isActive) {
          // Delete unused thumbnail
          await fs.promises.unlink(thumbnailPath);
          deletedCount++;
        }
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up thumbnails:', error);
      return 0;
    }
  }
  
  /**
   * Generate a compressed version of an image
   * @param {string} imagePath - Path to the source image
   * @param {Object} options - Compression options
   * @param {number} options.quality - JPEG quality (1-100)
   * @param {number} options.width - Max width for resizing
   * @returns {Promise<string>} - Path to the compressed image
   */
  async compressImage(imagePath, options = { quality: 85, width: 1920 }) {
    try {
      console.log(`Compressing image: ${imagePath}`);
      
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Source image does not exist: ${imagePath}`);
      }
      
      // Create a unique filename for the compressed image
      const ext = path.extname(imagePath);
      const basename = path.basename(imagePath, ext);
      const compressedFilename = `${basename}_compressed_${uuidv4()}.jpg`;
      const outputPath = path.join(this.compressedPath, compressedFilename);
      
      console.log(`Saving compressed image to: ${outputPath}`);
      
      // Get original image dimensions
      const dimensions = await this.getImageDimensions(imagePath);
      
      // Calculate new dimensions while preserving aspect ratio
      let newWidth = options.width;
      let newHeight = Math.round(options.width * (dimensions.height / dimensions.width));
      
      // Don't upscale images
      if (dimensions.width < newWidth) {
        newWidth = dimensions.width;
        newHeight = dimensions.height;
      }
      
      // Compress image using sharp
      await sharp(imagePath)
        .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: options.quality, progressive: true })
        .toFile(outputPath);
      
      // Verify that the compressed image was created
      if (!fs.existsSync(outputPath)) {
        throw new Error(`Failed to create compressed image at: ${outputPath}`);
      }
      
      console.log(`Image successfully compressed at: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error('Error compressing image:', error);
      // If compression fails, return the original path
      return imagePath;
    }
  }
  
  /**
   * Batch compress all images in a directory
   * @param {string} dirPath - Directory containing images
   * @param {Object} options - Compression options
   * @returns {Promise<Object>} - Mapping of original paths to compressed paths
   */
  async batchCompressImages(dirPath, options = { quality: 85, width: 1920 }) {
    try {
      console.log(`Batch compressing images in directory: ${dirPath}`);
      const images = await this.readDirectory(dirPath);
      
      if (images.length === 0) {
        return {};
      }
      
      console.log(`Found ${images.length} images to compress`);
      
      const compressionMap = {};
      
      // Process images sequentially to avoid memory issues
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        console.log(`Compressing image ${i+1}/${images.length}: ${image.filename}`);
        
        try {
          const compressedPath = await this.compressImage(image.path, options);
          compressionMap[image.path] = compressedPath;
        } catch (error) {
          console.error(`Error compressing image ${image.filename}:`, error);
          compressionMap[image.path] = image.path; // Use original if compression fails
        }
      }
      
      return compressionMap;
    } catch (error) {
      console.error('Error in batch compression:', error);
      return {};
    }
  }
}

module.exports = new FileSystemService(); 