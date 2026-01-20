FROM node:18-alpine

WORKDIR /app

# Copy prisma schema first
COPY prisma ./prisma/

# Copy package files
COPY package*.json ./

# Install dependencies (this will run postinstall which needs prisma schema)
RUN npm install

# Copy the rest of the code
COPY . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
