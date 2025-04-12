# GrainVault Technical Implementation

## Technology Stack

### Frontend
- **Electron.js**: Cross-platform desktop application framework
- **React.js**: UI component library
- **React Router**: Navigation between views
- **Styled-components**: Component-level styling
- **React Context API**: State management
- **Framer Motion**: Animations and transitions

### Backend
- **Node.js**: Runtime environment for backend logic
- **SQLite**: Lightweight relational database for metadata
- **Better-SQLite3**: Fast SQLite library for Node.js
- **Sharp**: Image processing library for thumbnails and optimization
- **Exif-Parser**: Extract metadata from image files

## Key Implementation Components

### Electron Setup
```javascript
// electron.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Handle creating/removing shortcuts on Windows
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the index.html or development server
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'app/build/index.html'));
  }
};

app.on('ready', createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for file operations
ipcMain.handle('select-directory', async () => {
  // Directory selection logic
});

ipcMain.handle('read-directory', async (event, dirPath) => {
  // Read directory contents
});

// Other IPC handlers for database operations
```

### Database Schema
```sql
-- schema.sql

-- Roll table to store collections of images
CREATE TABLE rolls (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  film_stock TEXT,
  camera TEXT,
  lens TEXT,
  iso INTEGER,
  date_taken TEXT,
  date_imported TEXT NOT NULL,
  notes TEXT,
  thumbnail_path TEXT,
  image_count INTEGER NOT NULL
);

-- Images table to store individual image metadata
CREATE TABLE images (
  id TEXT PRIMARY KEY,
  roll_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  path TEXT NOT NULL,
  index_in_roll INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  format TEXT,
  file_size INTEGER,
  date_modified TEXT,
  FOREIGN KEY (roll_id) REFERENCES rolls (id)
);

-- Tags table for roll categorization
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Junction table for roll-tag relationship
CREATE TABLE roll_tags (
  roll_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (roll_id, tag_id),
  FOREIGN KEY (roll_id) REFERENCES rolls (id),
  FOREIGN KEY (tag_id) REFERENCES tags (id)
);

-- Film stocks table for dropdown selection
CREATE TABLE film_stocks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_color BOOLEAN NOT NULL DEFAULT 1,
  iso INTEGER
);

-- Cameras table for dropdown selection
CREATE TABLE cameras (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Lenses table for dropdown selection
CREATE TABLE lenses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
```

### Database Service
```javascript
// services/db.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { app } = require('electron');

class DatabaseService {
  constructor() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'grainvault.db');
    
    // Ensure directory exists
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    
    this.db = new Database(dbPath);
    this.initialize();
  }
  
  initialize() {
    // Check if tables exist, if not create them
    const tableCheck = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='rolls'"
    ).get();
    
    if (!tableCheck) {
      const schema = fs.readFileSync(
        path.join(__dirname, '../database/schema.sql'),
        'utf8'
      );
      
      this.db.exec(schema);
      this.seedDefaultData();
    }
  }
  
  seedDefaultData() {
    // Add some default film stocks
    const filmStocks = [
      { id: uuidv4(), name: 'Portra 400', is_color: 1, iso: 400 },
      { id: uuidv4(), name: 'HP5 Plus', is_color: 0, iso: 400 },
      { id: uuidv4(), name: 'Ektar 100', is_color: 1, iso: 100 },
      // Add more default film stocks
    ];
    
    const insertFilmStock = this.db.prepare(
      'INSERT INTO film_stocks (id, name, is_color, iso) VALUES (?, ?, ?, ?)'
    );
    
    filmStocks.forEach(stock => {
      insertFilmStock.run(stock.id, stock.name, stock.is_color, stock.iso);
    });
  }
  
  // Roll CRUD operations
  getRolls() {
    return this.db.prepare('SELECT * FROM rolls ORDER BY date_imported DESC').all();
  }
  
  getRollById(id) {
    return this.db.prepare('SELECT * FROM rolls WHERE id = ?').get(id);
  }
  
  addRoll(rollData) {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO rolls (
        id, name, path, film_stock, camera, lens, iso, 
        date_taken, date_imported, notes, thumbnail_path, image_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      rollData.name,
      rollData.path,
      rollData.filmStock,
      rollData.camera,
      rollData.lens,
      rollData.iso,
      rollData.dateTaken,
      new Date().toISOString(),
      rollData.notes,
      rollData.thumbnailPath,
      rollData.imageCount
    );
    
    return id;
  }
  
  // More database methods for CRUD operations
}

module.exports = new DatabaseService();
```

### File System Service
```javascript
// services/fileSystem.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const exifParser = require('exif-parser');

class FileSystemService {
  constructor() {
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.tif', '.tiff'];
  }
  
  // Read a directory and find image files
  async readDirectory(dirPath) {
    try {
      const files = await fs.promises.readdir(dirPath);
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return this.supportedFormats.includes(ext);
      });
      
      return imageFiles.map(file => ({
        filename: file,
        path: path.join(dirPath, file)
      }));
    } catch (error) {
      console.error('Error reading directory:', error);
      throw error;
    }
  }
  
  // Generate thumbnail for a roll
  async generateThumbnail(imagePath, outputPath, size = 300) {
    try {
      await sharp(imagePath)
        .resize(size, size, { fit: 'cover' })
        .toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw error;
    }
  }
  
  // Extract metadata from an image file
  extractMetadata(imagePath) {
    try {
      const buffer = fs.readFileSync(imagePath);
      const parser = exifParser.create(buffer);
      const result = parser.parse();
      
      const stats = fs.statSync(imagePath);
      const dimensions = this.getImageDimensions(imagePath);
      
      return {
        width: dimensions.width,
        height: dimensions.height,
        format: path.extname(imagePath).slice(1).toUpperCase(),
        size: stats.size,
        dateModified: stats.mtime.toISOString(),
        exif: result.tags
      };
    } catch (error) {
      console.error('Error extracting metadata:', error);
      return {
        format: path.extname(imagePath).slice(1).toUpperCase(),
        size: fs.statSync(imagePath).size,
        dateModified: fs.statSync(imagePath).mtime.toISOString()
      };
    }
  }
  
  // Helper method to get image dimensions
  getImageDimensions(imagePath) {
    try {
      const metadata = sharp(imagePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height
      };
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      return { width: 0, height: 0 };
    }
  }
}

module.exports = new FileSystemService();
```

## React Components Implementation

### React Context for State Management
```jsx
// context/RollContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  rolls: [],
  currentRoll: null,
  currentImage: null,
  loading: false,
  error: null,
  filmStocks: [],
  cameras: [],
  lenses: []
};

// Create context
const RollContext = createContext();

// Reducer function
const rollReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_ROLLS_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_ROLLS_SUCCESS':
      return { ...state, rolls: action.payload, loading: false };
    case 'FETCH_ROLLS_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_CURRENT_ROLL':
      return { ...state, currentRoll: action.payload, currentImage: null };
    case 'SET_CURRENT_IMAGE':
      return { ...state, currentImage: action.payload };
    case 'ADD_ROLL_SUCCESS':
      return { ...state, rolls: [action.payload, ...state.rolls] };
    // More actions for CRUD operations
    default:
      return state;
  }
};

// Provider component
export const RollProvider = ({ children }) => {
  const [state, dispatch] = useReducer(rollReducer, initialState);
  
  // Load rolls on initial render
  useEffect(() => {
    const fetchRolls = async () => {
      dispatch({ type: 'FETCH_ROLLS_START' });
      try {
        const rolls = await window.electron.getRolls();
        dispatch({ type: 'FETCH_ROLLS_SUCCESS', payload: rolls });
      } catch (error) {
        dispatch({ type: 'FETCH_ROLLS_ERROR', payload: error.message });
      }
    };
    
    fetchRolls();
  }, []);
  
  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [filmStocks, cameras, lenses] = await Promise.all([
          window.electron.getFilmStocks(),
          window.electron.getCameras(),
          window.electron.getLenses()
        ]);
        
        dispatch({ type: 'SET_REFERENCE_DATA', payload: { filmStocks, cameras, lenses } });
      } catch (error) {
        console.error('Error loading reference data:', error);
      }
    };
    
    loadReferenceData();
  }, []);
  
  return (
    <RollContext.Provider value={{ state, dispatch }}>
      {children}
    </RollContext.Provider>
  );
};

// Custom hook for using the context
export const useRollContext = () => {
  const context = useContext(RollContext);
  if (context === undefined) {
    throw new Error('useRollContext must be used within a RollProvider');
  }
  return context;
};
```

### Main App Component
```jsx
// App.js
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { RollProvider } from './context/RollContext';
import { GlobalStyle } from './styles/GlobalStyle';
import { lightTheme, darkTheme } from './styles/themes';
import { useThemeContext } from './context/ThemeContext';

import Dashboard from './pages/Dashboard';
import RollViewer from './pages/RollViewer';
import Settings from './pages/Settings';
import Header from './components/layout/Header';

const App = () => {
  const { theme } = useThemeContext();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  
  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStyle />
      <RollProvider>
        <Router>
          <Header />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/roll/:id" element={<RollViewer />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Router>
      </RollProvider>
    </ThemeProvider>
  );
};

export default App;
```

## Electron IPC Bridge (Preload Script)
```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');
const { dialog } = require('@electron/remote');

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
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings)
});
```

## Development Roadmap

1. **Phase 1: MVP Setup**
   - Set up Electron + React project structure
   - Implement database schema and basic CRUD operations
   - Create basic UI components

2. **Phase 2: Core Functionality**
   - Implement roll import functionality
   - Build roll library view with sorting/filtering
   - Create roll viewer with basic navigation

3. **Phase 3: Enhanced Features**
   - Add metadata editing capabilities
   - Implement search functionality
   - Create settings page for application preferences

4. **Phase 4: Optimization & Polish**
   - Optimize image loading for better performance
   - Add animations and transitions
   - Implement light/dark themes

5. **Phase 5: Distribution**
   - Set up build process for Windows and macOS
   - Create installers
   - Write documentation 