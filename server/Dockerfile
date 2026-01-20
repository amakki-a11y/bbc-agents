FROM node:18-slim

# Install OpenSSL (required by Prisma)
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy prisma schema FIRST (needed for postinstall script)
COPY prisma ./prisma/

# Copy package files
COPY package*.json ./

# Install dependencies (postinstall runs prisma generate)
RUN npm install

# Copy the rest of the code
COPY . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
