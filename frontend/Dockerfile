FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies (cached unless package.json changes)
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose Vite's default development port
EXPOSE 5173

# Default command (overridden in docker-compose for hot-reloading)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]