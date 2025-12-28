# Fair Map

Interactive property mapping application with layer-based marker organization and geotagged image support.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

- 🗺️ **Interactive Map** - OpenLayers-based mapping with satellite imagery
- 📍 **Layer Management** - Organize markers with color-coded layers
- 🎯 **Active Layer System** - Streamlined marker creation workflow
- 📸 **Geotagged Images** - Automatic marker creation from photo GPS data
- 🏷️ **Label System** - Tag and categorize markers
- 📱 **Mobile Responsive** - Optimized bottom sheet UI for mobile devices
- 🖼️ **HEIC Support** - Automatic conversion of iPhone photos
- 🎨 **Custom Overlays** - Add and position custom image layers

## Quick Start

### Development

```bash
# Install dependencies
yarn install

# Start development servers (frontend + backend)
yarn dev

# Frontend only (http://localhost:2998)
yarn dev:client

# Backend only (http://localhost:2999)
yarn dev:server
```

### Production

```bash
# Build and run
yarn preview

# Or build separately
yarn build:server && yarn build
yarn start
```

### Docker

```bash
# Using Docker Compose
yarn docker:run

# View logs
yarn docker:logs

# Stop
yarn docker:stop

# Or manually
docker build -t fair-map .
docker run -p 3020:2999 -v $(pwd)/data:/app/data fair-map
```

## Environment Setup

Create a `.env` file:

```env
PORT=2999
DATABASE_URL=file:./data/fair-map.db
```

## Available Scripts

### Development
- `yarn dev` - Run frontend + backend concurrently
- `yarn dev:client` - Frontend only (port 2998)
- `yarn dev:server` - Backend only (port 2999)

### Building
- `yarn build` - Build frontend
- `yarn build:server` - Compile TypeScript server
- `yarn preview` - Build and run production server

### Testing
- `yarn test` - Run all tests
- `yarn test:client` - Frontend tests only
- `yarn test:server` - Server tests only

### Code Quality
- `yarn lint` - Run ESLint
- `yarn typecheck` - TypeScript type checking
- `yarn format` - Format with Prettier
- `yarn release:check` - Run all checks before release

### Docker
- `yarn docker:build` - Build Docker image
- `yarn docker:run` - Start with Docker Compose
- `yarn docker:stop` - Stop containers
- `yarn docker:logs` - View container logs

### Release
- `yarn release` - Build and push to Docker Hub
- `yarn release:check` - Verify code quality before release

### Database
- `yarn prisma:generate` - Generate Prisma client
- `yarn prisma:migrate` - Create and apply migration
- `yarn prisma:studio` - Open Prisma Studio GUI

## Releasing to Docker Hub

### Prerequisites

1. Log in to Docker Hub:
   ```bash
   docker login
   ```

2. Ensure you have push access to the repository

### Release Process

1. **Update version** in `package.json`

2. **Run pre-release checks**:
   ```bash
   yarn release:check
   ```

3. **Release to Docker Hub**:
   ```bash
   yarn release
   ```

   Or with custom Docker username:
   ```bash
   DOCKER_USERNAME=yourusername yarn release
   ```

The release script will:
- ✓ Read version from package.json
- ✓ Build Docker image with build args
- ✓ Tag with version and `latest`
- ✓ Push both tags to Docker Hub

### Environment Variables for Release

- `DOCKER_USERNAME` - Docker Hub username (default: `julianh2o`)

### Release Tags

The script creates two tags:
- `julianh2o/fair-map:1.0.0` - Version-specific tag
- `julianh2o/fair-map:latest` - Latest release

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system architecture, API endpoints, and component structure.

## Project Structure

```
fair-map/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── services/          # API client
│   └── hooks/             # Custom hooks
├── server/                # Backend Express application
│   ├── api/routes/        # API endpoints
│   ├── index.ts           # Server entry point
│   └── db.ts              # Database client
├── prisma/                # Database schema and migrations
├── data/                  # SQLite database and uploads
├── scripts/               # Build and release scripts
└── public/                # Static assets
```

## API Endpoints

### Layers
- `GET /api/layers` - List all layers
- `POST /api/layers` - Create layer
- `PUT /api/layers/:id` - Update layer
- `DELETE /api/layers/:id` - Delete layer

### Markers
- `GET /api/markers` - List all markers
- `GET /api/markers/labels` - Get all labels
- `POST /api/markers` - Create marker
- `PUT /api/markers/:id` - Update marker
- `DELETE /api/markers/:id` - Delete marker

### Upload
- `POST /api/upload/image` - Upload geotagged image

## Database

Fair Map uses SQLite with Prisma ORM:

```prisma
model Layer {
  id        String   @id @default(uuid())
  name      String
  color     String
  visible   Boolean
  markers   Marker[]
}

model Marker {
  id          String   @id @default(uuid())
  name        String
  description String?
  photo       String?
  latitude    Float
  longitude   Float
  labels      String   @default("[]")
  layerId     String
  layer       Layer    @relation(onDelete: Cascade)
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `yarn release:check` to verify code quality
5. Submit a pull request

## License

MIT

## Author

Julian Hartline - [GitHub](https://github.com/julianh2o)
