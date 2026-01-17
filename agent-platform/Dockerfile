# /Users/anandkirang/CascadeProjects/enterprise-ai-dev-platform/agent-platform/Dockerfile

# Base Image
FROM node:18-alpine

# Working Directory
WORKDIR /app

# Install Dependencies
COPY package.json tsconfig.json ./
RUN npm install

# Copy Source
COPY . .

# Build (if necessary, or just run via ts-node)
# For production, we might compile tsc, but for now ts-node is fine
# RUN npm run build

# Expose API Port
EXPOSE 3000

# Start Command
CMD ["npx", "ts-node", "src/main.ts"]
