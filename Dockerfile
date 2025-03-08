
# Dockerfile:
FROM --platform=linux/amd64 node:20-slim AS base

# Create app directory
WORKDIR /app
# Copy artifacts over
COPY pnpm-lock.yaml package.json ./

# Install pnpm
RUN npm install -g pnpm

# Download environmet variables and pass into .env file
# RUN apt-get update -y && apt-get install -y awscli jq openssl
# COPY script.sh ./
# RUN chmod +x script.sh
# RUN ./script.sh

# Install dependencies
RUN pnpm i

# If you are building your code for production
# RUN npm ci --omit=dev

# Bundle app source
COPY . .

# Generate and push prisma file
RUN pnpm run db:generate
RUN pnpm run db:push

# Build the project
RUN pnpm run build

# Expose the app
EXPOSE 8080

# Start the application
CMD ["pnpm", "start"]
