# CLAUDE.md

## Special instructions
IMPORTANT: Do not build or release unless specifically asked or granted permission.
IMPORTANT: When significant work is completed, perform a `yarn format > /dev/null && yarn lint && yarn typecheck && yarn build` to verify the code quality.
IMPORTANT: **Always use the API_BASE constant for any uploaded files or backend resources.** Relative URLs like `/uploads/...` will fail in development mode because the client (port 2998) and server (port 2999) are on different ports. Import and use `API_BASE` from `src/services/api.ts` and construct URLs like `${API_BASE.replace('/api', '')}/uploads/filename.jpg`. In production, relative URLs work because everything is served from the same origin.
IMPORTANT: **Prevent Map Flashing/Flickering:** The map component in `src/components/Map/Map.tsx` uses refs (`onMarkerClickRef`, `onLongPressRef`) to store callback functions. This prevents the main map initialization useEffect from re-running when callbacks change. The main useEffect should ONLY depend on `[center, zoom]`. Never add callback props like `onMarkerClick` or `onLongPress` to this dependency array, as it will cause the map to reinitialize and tiles to flash when state changes occur in parent components.

## Project Overview

Fair Map is an interactive property mapping application with a React/TypeScript frontend and Express backend. It provides comprehensive tools for managing geographic markers, layers, and geotagged images on an OpenLayers-based interactive map.

**Key Features:**
- Interactive map with layer-based marker organization
- Geotagged image upload with EXIF GPS extraction
- Active layer system for streamlined marker creation
- Mobile-responsive UI with bottom sheet design
- Drag-and-drop marker repositioning
- Label-based marker categorization
- HEIC/HEIF image conversion support
- Satellite and custom image overlay support

## Commands

```bash
# Development
yarn dev                    # Run frontend + backend concurrently
yarn dev:client            # Frontend only (port 2998)
yarn dev:server            # Backend only (port 2999)

# Building
yarn build                 # Build frontend
yarn build:server          # Compile TypeScript server to JavaScript

# Production
yarn start                 # Run production server (YOU MUST build first)
yarn preview              # Build and run production server

# Testing
yarn test                 # Run all tests
yarn test:client          # Frontend tests only
yarn test:server          # Server tests only

# Code Quality
yarn lint                 # Run ESLint
yarn typecheck            # TypeScript type checking
yarn format               # Format with Prettier

# Database (Prisma)
yarn prisma:generate       # Generate Prisma client (auto-runs on postinstall)
yarn prisma:migrate        # Create and apply new migration
yarn prisma:migrate:deploy # Apply pending migrations (production)
yarn prisma:studio         # Open Prisma Studio GUI
```

## Architecture

For detailed information about the system architecture, directory structure, key patterns, API endpoints, and important files, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Database Management

**Prisma 7 Configuration**
- Database connection URL is configured in `prisma.config.ts` (not in schema.prisma)
- The Prisma client is automatically generated on `yarn install` (postinstall hook)
- When schema changes are made, `yarn dev:server` automatically runs migrations and regenerates the client
- Nodemon watches `prisma/schema.prisma` and restarts the server when it changes

**Important Notes**
- If you manually edit `prisma/schema.prisma`, the dev server will auto-restart
- After pulling schema changes from git, run `yarn install` or `yarn prisma:generate` to update the client
- The server MUST be restarted after Prisma client regeneration to avoid schema inconsistencies
- Database URL is set via `DATABASE_URL` environment variable in `.env`
