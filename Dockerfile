# Use the official Node.js image as a base image
FROM node:20.8.0

# Install Sox
RUN apt-get update && apt-get install -y sox

# Copy the local project files into the container
COPY . /usr/src/app

# Set the working directory
WORKDIR /usr/src/app

# Install the project dependencies
RUN npm install

# Run the bot
CMD ["node", "index.js"]
