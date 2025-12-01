FROM node:18
<<<<<<< HEAD

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
=======
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]

>>>>>>> ca43c40f3ae77bd97fe14ccb34ffe9e3ca56c746
