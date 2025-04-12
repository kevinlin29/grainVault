# GrainVault Component Architecture

## Core Components and Data Flow

```
                                 ┌─────────────────┐
                                 │     App.js      │
                                 │  (Root Layout)  │
                                 └────────┬────────┘
                                          │
                    ┌───────────┬─────────┴────────┬────────────┐
                    ▼           ▼                  ▼            ▼
          ┌─────────────────┐  ┌─────────────┐  ┌─────────┐  ┌─────────┐
          │    Header       │  │  Dashboard  │  │  Roll   │  │ Settings│
          │   Component     │  │    Page     │  │ Viewer  │  │  Page   │
          └─────────────────┘  └──────┬──────┘  └────┬────┘  └─────────┘
                                      │               │
                                      ▼               ▼
                               ┌─────────────┐  ┌─────────────────┐
                               │ RollLibrary │  │  ImageViewer    │
                               │  Component  │  │   Component     │
                               └──────┬──────┘  └────────┬────────┘
                                      │                  │
                                      ▼                  ▼
                               ┌─────────────┐    ┌─────────────┐
                               │  RollCard   │    │ ImageDisplay│
                               │ Component   │    │  Component  │
                               └─────────────┘    └─────────────┘
```

## Data Management

```
┌───────────────────────┐      ┌───────────────────────┐
│      Context API      │      │     SQLite Database   │
│  (Application State)  │◄────►│   (Metadata Storage)  │
└──────────┬────────────┘      └───────────────────────┘
           │
           ▼
┌─────────────────────────┐    ┌───────────────────────┐
│     Service Layer       │    │      File System      │
│ (Data Access & Actions) │◄──►│    (Image Storage)    │
└─────────────────────────┘    └───────────────────────┘
```

## Component Details

### Layout Components
- **Header**: Navigation, search bar, import button, theme toggle
- **Sidebar** (optional): Alternative navigation for larger screens

### Page Components
- **Dashboard**: Home page displaying the roll library
- **RollViewer**: Displays images from a selected roll with metadata
- **Settings**: Application configuration options

### Roll Management
- **RollLibrary**: Grid/list view of all rolls with filtering/sorting
- **RollCard**: Thumbnail preview of a roll with basic metadata
- **ImportRoll**: Modal/wizard for importing new rolls

### Image Viewing
- **ImageViewer**: Container for displaying roll images
- **ImageDisplay**: Individual image display with zoom/pan
- **MetadataPanel**: Side panel showing image/roll metadata

### Common Components
- **SearchBar**: Global search for rolls and metadata
- **FilterControls**: UI for filtering rolls by film stock, date, etc.
- **SortControls**: UI for sorting rolls
- **ThemeToggle**: Light/dark mode switch
- **Modal**: Reusable modal component for forms/dialogs

## Data Models

### Roll
```
{
  id: string,              // Unique identifier
  name: string,            // User-defined name
  path: string,            // File system path
  filmStock: string,       // Film stock used
  camera: string,          // Camera used (optional)
  lens: string,            // Lens used (optional)
  iso: number,             // ISO setting (optional)
  dateTaken: Date,         // When photos were taken (optional)
  dateImported: Date,      // When roll was imported
  notes: string,           // User notes
  tags: string[],          // User-defined tags
  thumbnailPath: string,   // Path to generated thumbnail
  imageCount: number       // Number of images in roll
}
```

### Image
```
{
  id: string,              // Unique identifier
  rollId: string,          // Reference to parent roll
  filename: string,        // Original filename
  path: string,            // File system path
  index: number,           // Position in roll
  metadata: {              // Image-specific metadata
    width: number,
    height: number,
    format: string,
    size: number,
    dateModified: Date,
    // Any EXIF data extracted
  }
}
``` 