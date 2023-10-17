const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const express = require("express");
require("dotenv").config();
const { textToSpeech, cleanupAudio } = require("./textToSpeach");

const TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true, filepath: false });

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Hello World!"));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  setInterval(() => {
    require("http").get(`http://your-app.herokuapp.com`);
  }, 10 * 60 * 1000); // every 25 minutes
});

const lastUserMessage = {};
const CHANNEL_USERNAME = "@Spotife";

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Hello Friend - Send me a text message and I will convert it to speech 🎙️"
  );
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const membership = await bot.getChatMember(CHANNEL_USERNAME, userId);
  if (
    membership.status !== "member" &&
    membership.status !== "creator" &&
    membership.status !== "administrator"
  ) {
    return bot.sendMessage(
      chatId,
      "Please subscribe to our channel to use this bot  [Subscribe here](https://t.me/Spotife)",
      { parse_mode: "Markdown" }
    );
  }

  if (msg.text && msg.text !== "/start") {
    const chatId = msg.chat.id;
    lastUserMessage[chatId] = msg.text;

    if (msg.text.length > 2500) {
      bot.sendMessage(
        chatId,
        "The message is too long, please try with another one."
      );
    } else {
      const YesOrNo = {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Yes", callback_data: "yes" }],
            [{ text: "No", callback_data: "no" }],
          ],
        },
      };
      bot.sendMessage(chatId, `Do you want to convert this to voice?`, YesOrNo);
    }
  }
});

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id; // User ID is obtained from query
  const messageId = query.message.message_id;

  bot.deleteMessage(chatId, messageId);

  if (query.data === "yes") {
    const userText = lastUserMessage[chatId];
    if (userText) {
      const audioPath = await textToSpeech(userText, userId);
      if (audioPath) {
        const audioStream = fs.createReadStream(audioPath);
        await bot.sendAudio(chatId, audioStream, {
          caption: "@elvenlabsBot",
        });
        cleanupAudio(userId); // Call cleanupAudio here with userId
      } else {
        bot.sendMessage(
          chatId,
          "Failed to convert text to speech. Please try again."
        );
      }
    } else {
      bot.sendMessage(
        chatId,
        "I didn't catch that. Please send the text again."
      );
    }
  }
});

console.log("bot is running ..");
