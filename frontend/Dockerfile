FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Serve the application (for production)
# For development, use Vite dev server
CMD ["npx", "serve", "-s", "dist", "-l", "3000"]