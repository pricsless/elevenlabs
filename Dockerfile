# Use a stable version of Node.js
FROM node:16

# Copy the local project files into the container
COPY . /usr/src/app

# Set the working directory
WORKDIR /usr/src/app

# Ensure index.js is executable
RUN chmod +x /usr/src/app/index.js

# Install the project dependencies
RUN npm install

# Specify the user to run the commands
USER node

# Run the bot
CMD ["node", "index.js"]
