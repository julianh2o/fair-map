#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOCKER_USERNAME="${DOCKER_USERNAME:-julianh2o}"
IMAGE_NAME="fair-map"
FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}"

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")

if [ -z "$VERSION" ]; then
    echo -e "${RED}Error: Could not read version from package.json${NC}"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Docker Release Script for Fair Map${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Version: ${YELLOW}${VERSION}${NC}"
echo -e "Image: ${YELLOW}${FULL_IMAGE_NAME}${NC}"
echo ""

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Get build metadata
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

echo -e "${GREEN}Building Docker image...${NC}"
docker build \
    --build-arg VERSION="${VERSION}" \
    --build-arg BUILD_DATE="${BUILD_DATE}" \
    --build-arg VCS_REF="${VCS_REF}" \
    -t "${FULL_IMAGE_NAME}:${VERSION}" \
    -t "${FULL_IMAGE_NAME}:latest" \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Pushing to Docker Hub...${NC}"

# Push version tag
echo -e "Pushing ${YELLOW}${FULL_IMAGE_NAME}:${VERSION}${NC}"
docker push "${FULL_IMAGE_NAME}:${VERSION}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Version tag pushed${NC}"
else
    echo -e "${RED}✗ Failed to push version tag${NC}"
    exit 1
fi

# Push latest tag
echo -e "Pushing ${YELLOW}${FULL_IMAGE_NAME}:latest${NC}"
docker push "${FULL_IMAGE_NAME}:latest"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Latest tag pushed${NC}"
else
    echo -e "${RED}✗ Failed to push latest tag${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Release complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Version: ${YELLOW}${VERSION}${NC}"
echo -e "Tags pushed:"
echo -e "  - ${YELLOW}${FULL_IMAGE_NAME}:${VERSION}${NC}"
echo -e "  - ${YELLOW}${FULL_IMAGE_NAME}:latest${NC}"
echo ""
echo -e "To pull this image:"
echo -e "  ${GREEN}docker pull ${FULL_IMAGE_NAME}:${VERSION}${NC}"
echo -e "  ${GREEN}docker pull ${FULL_IMAGE_NAME}:latest${NC}"
echo ""
