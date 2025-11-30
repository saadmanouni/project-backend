FROM node:18

WORKDIR /app

# Copy only backend package files
COPY project/backend/package*.json ./

# Install build tools required for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ \
    && npm install -g node-gyp

# Install backend dependencies (forces recompilation)
RUN npm install --build-from-source

# Copy backend source code
COPY project/backend .

EXPOSE 3001

CMD ["npm", "start"]
