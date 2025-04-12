const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';
const DatabaseService = require('./database/db');
const FileSystemService = require('./services/fileSystem');

// Initialize remote module
require('@electron/remote/main').initialize();

// Handle creating/removing shortcuts on Windows
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  console.log('Creating main window...');
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: true,
      webSecurity: false,
    },
  });

  // Enable remote module for renderer
  require('@electron/remote/main').enable(mainWindow.webContents);
  
  // Add error handling for the window
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load window:', errorCode, errorDescription);
    mainWindow.loadFile(path.join(__dirname, 'error.html'));
  });

  // Load the index.html of the app or the dev server in development
  if (isDev) {
    console.log('Running in development mode, loading from http://localhost:3000');
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    const appPath = path.join(__dirname, 'app', 'build', 'index.html');
    console.log('Running in production mode, loading from', appPath);
    
    // Check if the file exists
    if (fs.existsSync(appPath)) {
      mainWindow.loadFile(appPath);
    } else {
      console.error('Could not find React app build at:', appPath);
      // Try alternative path
      const altPath = path.join(__dirname, 'build', 'index.html');
      console.log('Trying alternative path:', altPath);
      
      if (fs.existsSync(altPath)) {
        mainWindow.loadFile(altPath);
      } else {
        console.error('Could not find React app build at alternative path either');
        mainWindow.loadFile(path.join(__dirname, 'error.html'));
      }
    }
  }
};

// Create window when app is ready
app.whenReady().then(() => {
  console.log('App is ready, creating window');
  createWindow();
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers

// File system operations
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (result.canceled) {
    return null;
  }
  
  return result.filePaths[0];
});

ipcMain.handle('read-directory', async (event, dirPath) => {
  return await FileSystemService.readDirectory(dirPath);
});

ipcMain.handle('generate-thumbnail', async (event, imagePath, outputPath, size) => {
  return await FileSystemService.generateThumbnail(imagePath, outputPath, size);
});

// Database operations
ipcMain.handle('get-rolls', async () => {
  const rolls = await DatabaseService.getRolls();
  
  // Check if directories exist for each roll
  return rolls.map(roll => {
    roll.directory_exists = fs.existsSync(roll.path);
    return roll;
  });
});

ipcMain.handle('get-roll-by-id', async (event, id) => {
  const roll = await DatabaseService.getRollById(id);
  
  if (roll) {
    // Check if the roll's directory still exists
    roll.directory_exists = fs.existsSync(roll.path);
  }
  
  return roll;
});

ipcMain.handle('add-roll', async (event, rollData) => {
  return DatabaseService.addRoll(rollData);
});

ipcMain.handle('update-roll', async (event, id, rollData) => {
  return DatabaseService.updateRoll(id, rollData);
});

ipcMain.handle('delete-roll', async (event, id) => {
  return DatabaseService.deleteRoll(id);
});

// Reference data operations
ipcMain.handle('get-film-stocks', async () => {
  return DatabaseService.getFilmStocks();
});

ipcMain.handle('add-film-stock', async (event, name, isColor, iso) => {
  return DatabaseService.addFilmStock(name, isColor, iso);
});

ipcMain.handle('get-cameras', async () => {
  return DatabaseService.getCameras();
});

ipcMain.handle('get-lenses', async () => {
  return DatabaseService.getLenses();
});

// Settings operations
ipcMain.handle('get-settings', async () => {
  return DatabaseService.getSettings();
});

ipcMain.handle('update-settings', async (event, settings) => {
  return DatabaseService.updateSettings(settings);
});

// Helper to resolve file URLs and paths
const resolveFilePath = (filePath) => {
  // Handle file:// URLs
  if (filePath.startsWith('file://')) {
    filePath = filePath.replace(/^file:\/\//, '');
    
    // On Windows, also handle the leading slash
    if (process.platform === 'win32' && filePath.startsWith('/')) {
      filePath = filePath.substring(1);
    }
  }
  
  return path.normalize(filePath);
};

// Image operations
ipcMain.handle('get-images-by-roll-id', async (event, rollId, useCompressed = true) => {
  console.log(`Fetching images for roll: ${rollId}, useCompressed: ${useCompressed}`);
  
  try {
    // 1. Get the roll info to find its directory
    const roll = await DatabaseService.getRollById(rollId);
    
    if (!roll) {
      console.error(`Roll not found: ${rollId}`);
      return [];
    }
    
    console.log(`Roll directory: ${roll.path}`);
    
    // 2. Check if directory exists
    if (!fs.existsSync(roll.path)) {
      console.error(`Directory does not exist: ${roll.path}`);
      return [];
    }
    
    // 3. Read images directly from the directory
    console.log(`Reading images directly from directory: ${roll.path}`);
    const images = await FileSystemService.readDirectory(roll.path);
    console.log(`Found ${images.length} images in directory ${roll.path}`);
    
    // 4. If compression is enabled, check if we need to compress the images
    let compressionMap = {};
    
    if (useCompressed && images.length > 0) {
      // Check if we already have a compression map for this roll
      try {
        const compressionMapPath = path.join(FileSystemService.compressedPath, `${rollId}_compression_map.json`);
        
        if (fs.existsSync(compressionMapPath)) {
          // Load existing compression map
          const mapData = await fs.promises.readFile(compressionMapPath, 'utf8');
          compressionMap = JSON.parse(mapData);
          console.log(`Loaded existing compression map with ${Object.keys(compressionMap).length} entries`);
          
          // Verify all compressed images still exist
          let needsRecompression = false;
          
          for (const [original, compressed] of Object.entries(compressionMap)) {
            if (!fs.existsSync(compressed)) {
              console.log(`Compressed image not found: ${compressed}`);
              needsRecompression = true;
              break;
            }
          }
          
          if (needsRecompression) {
            console.log('Some compressed images are missing, regenerating...');
            compressionMap = await FileSystemService.batchCompressImages(roll.path);
            await fs.promises.writeFile(compressionMapPath, JSON.stringify(compressionMap), 'utf8');
          }
        } else {
          // Generate new compression map
          console.log('No compression map found, generating compressed images...');
          compressionMap = await FileSystemService.batchCompressImages(roll.path);
          await fs.promises.writeFile(compressionMapPath, JSON.stringify(compressionMap), 'utf8');
        }
      } catch (error) {
        console.error('Error managing compression map:', error);
        // Continue with original images
      }
    }
    
    // 5. Map filesystem images to the format expected by the UI
    const mappedImages = images.map((image, index) => {
      // Use compressed path if available, otherwise use original
      const imagePath = useCompressed && compressionMap[image.path] 
        ? compressionMap[image.path] 
        : image.path;
        
      return {
        id: `${rollId}_${index}`,  // Generate a synthetic ID
        roll_id: rollId,
        filename: image.filename,
        path: imagePath,
        original_path: image.path,
        index_in_roll: index,
        width: image.metadata.width || 0,
        height: image.metadata.height || 0,
        format: image.metadata.format || '',
        file_size: image.metadata.size || 0,
        date_modified: image.metadata.dateModified || new Date().toISOString(),
        is_compressed: imagePath !== image.path
      };
    });
    
    // 6. Update the roll's image count in the database if needed
    if (roll.image_count !== images.length) {
      console.log(`Updating roll image count from ${roll.image_count} to ${images.length}`);
      await DatabaseService.updateRoll(rollId, { image_count: images.length });
    }
    
    console.log(`Returning ${mappedImages.length} images`);
    return mappedImages;
  } catch (error) {
    console.error(`Error reading images for roll ${rollId}:`, error);
    return [];
  }
});

// Add a test handler to check if an image file exists and is readable
ipcMain.handle('test-image-file', async (event, imagePath) => {
  console.log(`Testing image file access: ${imagePath}`);
  
  try {
    const normalizedPath = resolveFilePath(imagePath);
    console.log(`Normalized path: ${normalizedPath}`);
    
    const exists = fs.existsSync(normalizedPath);
    console.log(`File exists: ${exists}`);
    
    if (exists) {
      // Try to read the file stats to verify it's accessible
      const stats = await fs.promises.stat(normalizedPath);
      return {
        exists: true,
        isFile: stats.isFile(),
        size: stats.size,
        path: normalizedPath
      };
    }
    
    return { exists: false };
  } catch (error) {
    console.error(`Error testing image file: ${error.message}`);
    return { 
      exists: false, 
      error: error.message 
    };
  }
});

ipcMain.handle('get-image-by-id', async (event, id) => {
  return DatabaseService.getImageById(id);
});

// Tags operations
ipcMain.handle('get-tags', async () => {
  return DatabaseService.getTags();
});

ipcMain.handle('add-tag', async (event, name) => {
  return DatabaseService.addTag(name);
});

ipcMain.handle('get-roll-tags', async (event, rollId) => {
  return DatabaseService.getRollTags(rollId);
});

ipcMain.handle('add-roll-tag', async (event, rollId, tagId) => {
  return DatabaseService.addRollTag(rollId, tagId);
});

ipcMain.handle('remove-roll-tag', async (event, rollId, tagId) => {
  return DatabaseService.removeRollTag(rollId, tagId);
});

// Add compression IPC handlers
ipcMain.handle('compress-image', async (event, imagePath, options) => {
  try {
    return await FileSystemService.compressImage(imagePath, options);
  } catch (error) {
    console.error('Error compressing image:', error);
    return null;
  }
});

ipcMain.handle('batch-compress-images', async (event, dirPath, options) => {
  try {
    return await FileSystemService.batchCompressImages(dirPath, options);
  } catch (error) {
    console.error('Error batch compressing images:', error);
    return {};
  }
}); 