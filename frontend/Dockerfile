# Use Node.js LTS version
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files first to leverage Docker caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy TypeScript config
# COPY tsconfig.json ./

# Copy the entire src directory
COPY src/ ./src/

# Copy other necessary files
COPY public/ ./public/

# Start the development server
CMD ["npm", "start"]