const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

async function textToSpeech(text, userId) {
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID}`,
      {
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.9,
          similarity_boost: 0.1,
        },
      },
      {
        headers: {
          accept: "audio/mpeg",
          "xi-api-key": process.env.XI_API_KEY,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    const audioDir = `./audio/${userId}`;
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const audioPath = `${audioDir}/output.mp3`;
    fs.writeFileSync(audioPath, response.data);
    console.log("Audio saved to output.mp3");
    return audioPath;
  } catch (error) {
    console.error(error);
  }
}

function cleanupAudio(audioDir) {
  fs.rmdir(audioDir, { recursive: true }, (err) => {
    if (err) {
      console.error(`Error deleting directory: ${err.message}`);
    } else {
      console.log("Audio directory deleted");
    }
  });
}

module.exports = {
  textToSpeech,
  cleanupAudio,
};
