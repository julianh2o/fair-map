# Architecture

## Overview

Fair Map is an interactive property mapping application built with React/TypeScript frontend and Express backend. It provides comprehensive tools for managing geographic markers, layers, and geotagged images on an interactive map interface powered by OpenLayers.

## System Architecture

### Frontend (React/TypeScript)

**Stack:**
- React 19
- TypeScript
- Material-UI v7
- React Router v7
- OpenLayers 10 (interactive mapping)
- Emotion (CSS-in-JS)
- Exifr (EXIF/GPS data extraction)

**Entry Point:** `src/index.tsx` → `src/App.tsx` → `src/pages/Home.tsx`

**Key Components:**
- `Map/` - OpenLayers-based interactive map with satellite/image overlay support
- `LayerManager/` - Mobile-responsive panel for managing layers, markers, and navigation
- `MarkerDialog/` - Dialog for creating/editing markers with labels and layer selection
- `MarkerDetails/` - Detailed view for individual markers with editing capabilities
- `MarkersList/` - List view of all markers grouped by layer
- `ImageUpload/` - Geotagged image upload with EXIF parsing
- `LabelsInput/` - Autocomplete label selector with multi-label support
- `OverlayControls/` - Controls for positioning and adjusting image overlays

**Directory Structure:**
- `src/components/` - Reusable UI components
- `src/pages/` - Route-based page components (Home)
- `src/services/` - API client and service layer
- `src/hooks/` - Custom React hooks (useGeolocation)
- `src/utils/` - Utility functions and constants
- `src/styles/` - Theme and styling configuration

**Features:**
- Interactive map with OpenLayers
- Layer-based marker organization with colors
- Active layer system for marker creation
- Drag-and-drop marker repositioning
- Geotagged image upload (EXIF GPS extraction)
- HEIC/HEIF image conversion support
- Label-based marker categorization
- Mobile-responsive bottom sheet UI
- Satellite and custom image overlay support
- User geolocation tracking

### Backend (Express/TypeScript)

**Stack:**
- Express 5
- TypeScript
- Prisma ORM v7
- SQLite database
- Multer (file uploads)
- Sharp (image processing)
- heic-convert (HEIC/HEIF conversion)

**Entry Point:** `server/index.ts`

**Database Schema:**
```prisma
model Layer {
  id        String   @id @default(uuid())
  name      String
  color     String   @default("#FF5733")
  visible   Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  markers   Marker[]
}

model Marker {
  id          String   @id @default(uuid())
  name        String
  description String?
  photo       String?
  latitude    Float
  longitude   Float
  labels      String   @default("[]")  // JSON array
  layerId     String
  layer       Layer    @relation(onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**API Endpoints:**

**Layers** (`/api/layers`):
- `GET /api/layers` - Fetch all layers with marker counts
- `POST /api/layers` - Create new layer (name, color)
- `PUT /api/layers/:id` - Update layer (name, color, visible)
- `DELETE /api/layers/:id` - Delete layer (cascades to markers)

**Markers** (`/api/markers`):
- `GET /api/markers` - Fetch all markers (optional layerId filter)
- `GET /api/markers/labels` - Get all unique labels used
- `POST /api/markers` - Create marker (name, description, photo, lat/lon, layerId, labels)
- `PUT /api/markers/:id` - Update marker (all fields including layerId for layer switching)
- `DELETE /api/markers/:id` - Delete marker

**Upload** (`/api/upload`):
- `POST /api/upload/image` - Upload image (converts HEIC/HEIF to JPEG, max 10MB)

### Environment Configuration

**Development:**
- Frontend: `http://localhost:2998`
- Backend: `http://localhost:2999`
- Separate servers with CORS enabled
- Hot reloading for both frontend and backend

**Production:**
- Same-origin serving (backend serves static build from `/build/public`)
- Environment detection in `src/services/api.ts` uses `window.location.hostname`

**Environment Variables (.env):**
```
PORT=2999                   # Optional, defaults to 2999
DATABASE_URL=file:./data/fair-map.db
```

**API Configuration:**
The frontend automatically detects whether it's running in development or production mode:
- **Development** (localhost): API calls go to `http://localhost:2999/api`
- **Production**: API calls use relative path `/api` (same origin as frontend)

**CRITICAL:** Always use `API_BASE` constant for uploaded files or backend resources. Relative URLs like `/uploads/...` will fail in development mode due to different ports.

## Key Files

### Frontend
- `src/pages/Home.tsx` - Main application page with map and state management
- `src/components/Map/Map.tsx` - OpenLayers map component with markers and overlays
- `src/components/LayerManager/LayerManager.tsx` - Layer/marker management panel
- `src/components/MarkerDetails/MarkerDetails.tsx` - Marker detail view with editing
- `src/components/ImageUpload/ImageUpload.tsx` - Geotagged image upload handler
- `src/services/api.ts` - API client with typed endpoints
- `src/hooks/useGeolocation.ts` - Browser geolocation hook
- `src/utils/constants.ts` - Application constants

### Backend
- `server/index.ts` - Express server setup
- `server/api/routes/layers.ts` - Layer CRUD endpoints
- `server/api/routes/markers.ts` - Marker CRUD endpoints
- `server/api/routes/upload.ts` - Image upload and processing
- `server/db.ts` - Prisma client initialization
- `prisma/schema.prisma` - Database schema
- `prisma.config.ts` - Prisma configuration (Prisma 7)

### Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration for frontend
- `server/tsconfig.json` - TypeScript configuration for backend
- `.env` - Environment variables
- `Dockerfile` - Multi-stage production build
- `docker-compose.yml` - Docker deployment configuration

## Directory Structure

```
fair-map/
├── src/                       # Frontend source
│   ├── components/            # React components
│   │   ├── Map/              # OpenLayers map component
│   │   ├── LayerManager/     # Layer management panel
│   │   ├── MarkerDialog/     # Marker creation/edit dialog
│   │   ├── MarkerDetails/    # Marker details view
│   │   ├── MarkersList/      # Markers list view
│   │   ├── ImageUpload/      # Image upload component
│   │   ├── LabelsInput/      # Label autocomplete input
│   │   └── OverlayControls/  # Image overlay controls
│   ├── pages/                # Page components
│   │   └── Home.tsx          # Main map page
│   ├── services/             # API and services
│   │   └── api.ts            # API client
│   ├── hooks/                # Custom hooks
│   │   └── useGeolocation.ts # Geolocation hook
│   ├── utils/                # Utilities
│   └── styles/               # Styling and theme
├── server/                   # Backend source
│   ├── api/                  # API routes
│   │   └── routes/           # Route handlers
│   │       ├── layers.ts     # Layer endpoints
│   │       ├── markers.ts    # Marker endpoints
│   │       └── upload.ts     # Upload endpoint
│   ├── index.ts              # Express server
│   ├── config.ts             # Server config
│   └── db.ts                 # Database client
├── prisma/                   # Database
│   ├── schema.prisma         # Schema definition
│   └── migrations/           # Database migrations
├── data/                     # Runtime data
│   ├── fair-map.db           # SQLite database
│   └── uploads/              # Uploaded images
├── build/                    # Production build output
│   ├── public/               # Built frontend
│   └── *.js                  # Built backend
└── public/                   # Static assets
    ├── property_drawing.png  # Property overlay images
    ├── house_lower_middle.png
    └── house_upper.png
```

## Key Features

### 1. Layer Management
- Create, edit, and delete layers
- Assign colors to layers for visual organization
- Toggle layer visibility
- Active layer system - new markers automatically assigned to active layer
- Move markers between layers

### 2. Marker System
- Create markers via long-press on map
- Edit marker name, description, and labels
- Drag markers to reposition
- Attach photos to markers
- Group markers by layer
- Filter and search by labels
- Click markers for details

### 3. Image Upload
- Upload geotagged photos (JPEG, PNG, HEIC, etc.)
- Automatic EXIF GPS extraction
- HEIC/HEIF to JPEG conversion
- Markers automatically created at photo GPS coordinates
- Images stored in `/data/uploads/`

### 4. Map Interface
- OpenLayers-based interactive map
- Satellite imagery layer
- Custom image overlays with positioning controls
- User location tracking
- Crosshairs animation when navigating to markers
- Mobile-responsive touch controls

## Building for Production

```bash
# Build both frontend and backend
yarn build:server && yarn build

# Run production server
yarn start

# Or build and preview in one command
yarn preview
```

The production server serves the built frontend from the backend and handles all API requests on the same origin.

## Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# The application will be available on port 3020
```

The Docker setup uses a multi-stage build for optimized image size and includes automatic database migrations on startup.
