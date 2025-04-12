# GrainVault

Film organization and inventory management application for photographers who shoot film.

## Overview

GrainVault is a desktop application designed to help film photographers organize and manage their scanned film rolls. It provides a clean, modern interface for importing, viewing, and managing collections of film photographs.

### Key Features

- **Roll Management**: Import and organize photographs by roll
- **Metadata Handling**: Store and edit film stock, camera, lens, and other metadata
- **Image Compression**: Automatically create compressed versions of large images for faster viewing
- **Clean UI**: Minimalist, modern interface with light/dark theme support
- **Cross-Platform**: Works on both Windows and macOS

## Development

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/grainvault.git
cd grainvault
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

This will start both the React development server and Electron application in development mode.

4. For production mode without development server or browser window:
```bash
npm run start-prod
```

### Project Structure

```
grainVault/
├── electron.js               # Electron main process
├── preload.js                # Electron preload script
├── app/                      # React application
│   ├── public/               # Static assets
│   └── src/                  # Application source
├── database/                 # SQLite database and schemas
├── services/                 # Backend services (file system, compression)
└── build/                    # Build output
```

### Building for Production

To create a production build:

```bash
npm run build
```

To create installable packages for Windows and macOS:

```bash
npm run make
```

To package the application (without installers):

```bash
npm run package
```

## Architecture

GrainVault uses:
- Electron.js for cross-platform desktop capabilities
- React.js for the user interface
- SQLite for local metadata storage
- Node.js for backend operations
- Sharp.js for image processing and compression

## Image Compression

GrainVault includes a batch compression feature that:
- Creates smaller, optimized versions of your original image files
- Never modifies the original files
- Maintains a compression map to track relationships between originals and compressed versions
- Automatically regenerates compressed versions if they're missing

This provides faster viewing of large image collections while preserving the original files.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
