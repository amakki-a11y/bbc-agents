# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage - use serve
FROM node:18-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files
COPY --from=build /app/dist ./dist

# Railway provides PORT env variable
ENV PORT=3000
EXPOSE $PORT

# Serve the static files (-s for SPA mode)
CMD serve dist -s -l $PORT
