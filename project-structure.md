# GrainVault Project Structure

```
grainVault/
├── package.json              # Project dependencies and scripts
├── electron.js               # Electron main process
├── preload.js                # Electron preload script for context bridge
├── app/                      # React application
│   ├── public/               # Static assets
│   │   ├── index.html        # HTML entry point
│   │   └── favicon.ico       # App icon
│   ├── src/                  # Application source
│       ├── index.js          # React entry point
│       ├── App.js            # Root React component
│       ├── styles/           # Global styles
│       ├── components/       # Reusable UI components
│       │   ├── common/       # Shared components (buttons, modals, etc.)
│       │   ├── layout/       # Layout components (header, sidebar, etc.)
│       │   ├── roll/         # Roll-specific components
│       │   └── viewer/       # Image viewer components
│       ├── pages/            # Page components
│       │   ├── Dashboard.js  # Home page/roll library
│       │   ├── RollViewer.js # Single roll view
│       │   └── Settings.js   # App settings
│       ├── hooks/            # Custom React hooks
│       ├── context/          # React context providers
│       ├── utils/            # Utility functions
│       └── services/         # Service modules
│           ├── db.js         # Database interface
│           ├── fileSystem.js # File system operations
│           └── metadata.js   # Metadata extraction/management
├── database/                 # SQLite database and schemas
└── build/                    # Build output
``` 