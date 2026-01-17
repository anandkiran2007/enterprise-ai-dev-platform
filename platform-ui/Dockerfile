# /Users/anandkirang/CascadeProjects/enterprise-ai-dev-platform/platform-ui/Dockerfile

# Base Image
FROM node:18-alpine

# Working Directory
WORKDIR /app

# Install Dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy Source
COPY . .

# Build Next.js App
RUN npm run build

# Expose Next.js Port
EXPOSE 3001

# Start Command
CMD ["npm", "start", "--", "-p", "3001"]
