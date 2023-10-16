# Use the official Node.js image as a base image
FROM node:20.8.0

# Install Sox
RUN apt-get update && apt-get install -y sox

ENV XI_API_KEY=f66ce86fac3d2fbcbdecc5416880c694
ENV VOICE_ID=pNInz6obpgDQGcFmaJgB
ENV TELEGRAM_TOKEN=6561581101:AAHhdEj7wPV0WX9GOuDVgXWimld5uJQhxCQ

# Copy the local project files into the container
COPY . /usr/src/app

# Set the working directory
WORKDIR /usr/src/app

# Install the project dependencies
RUN npm install

# Run the bot
CMD ["node", "index.js"]
