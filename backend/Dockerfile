FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
