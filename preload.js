const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Database operations
  getRolls: () => ipcRenderer.invoke('get-rolls'),
  getRollById: (id) => ipcRenderer.invoke('get-roll-by-id', id),
  addRoll: (rollData) => ipcRenderer.invoke('add-roll', rollData),
  updateRoll: (id, rollData) => ipcRenderer.invoke('update-roll', id, rollData),
  deleteRoll: (id) => ipcRenderer.invoke('delete-roll', id),
  
  // File system operations
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
  generateThumbnail: (imagePath, outputPath, size) => 
    ipcRenderer.invoke('generate-thumbnail', imagePath, outputPath, size),
  
  // Reference data
  getFilmStocks: () => ipcRenderer.invoke('get-film-stocks'),
  addFilmStock: (name, isColor, iso) => 
    ipcRenderer.invoke('add-film-stock', name, isColor, iso),
  getCameras: () => ipcRenderer.invoke('get-cameras'),
  getLenses: () => ipcRenderer.invoke('get-lenses'),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  
  // Images
  getAllImages: () => ipcRenderer.invoke('get-all-images'),
  getImageById: (id) => ipcRenderer.invoke('get-image-by-id', id),
  getImagesByRollId: (rollId, useCompressed = true) => ipcRenderer.invoke('get-images-by-roll-id', rollId, useCompressed),
  createImage: (image) => ipcRenderer.invoke('create-image', image),
  updateImage: (id, image) => ipcRenderer.invoke('update-image', id, image),
  deleteImage: (id) => ipcRenderer.invoke('delete-image', id),
  
  // Compression operations
  compressImage: (imagePath, options) => ipcRenderer.invoke('compress-image', imagePath, options),
  batchCompressImages: (dirPath, options) => ipcRenderer.invoke('batch-compress-images', dirPath, options),
  
  // Tags
  getTags: () => ipcRenderer.invoke('get-tags'),
  addTag: (name) => ipcRenderer.invoke('add-tag', name),
  getRollTags: (rollId) => ipcRenderer.invoke('get-roll-tags', rollId),
  addRollTag: (rollId, tagId) => ipcRenderer.invoke('add-roll-tag', rollId, tagId),
  removeRollTag: (rollId, tagId) => ipcRenderer.invoke('remove-roll-tag', rollId, tagId),
}); 