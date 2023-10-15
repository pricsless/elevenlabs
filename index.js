const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
require("dotenv").config();
const { exec } = require("child_process");
const { textToSpeech, cleanupAudio } = require("./textToSpeach");

const TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true, filepath: false });

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
        const pitchOptions = {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Yes", callback_data: "pitch_yes" }],
              [{ text: "No", callback_data: "pitch_no" }],
            ],
          },
        };
        bot.sendMessage(
          chatId,
          `Do you want to make the voice deeper ?`,
          pitchOptions
        );
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
  } else if (query.data === "pitch_yes" || query.data === "pitch_no") {
    const audioDir = `./audio/${userId}`;
    const audioPath = `${audioDir}/output.mp3`;
    if (query.data === "pitch_yes") {
      exec(
        `sox ${audioPath} ${audioDir}/output2.mp3 pitch -375`,
        async (error, stdout, stderr) => {
          if (error) {
            console.error(
              `Error executing pitch modification: ${error.message}`
            );
            return;
          }
          const modifiedAudioStream = fs.createReadStream(
            `${audioDir}/output2.mp3`
          );
          await bot.sendAudio(chatId, modifiedAudioStream, {
            caption: "@elvenlabsBot",
          });

          cleanupAudio(audioDir);
        }
      );
    } else {
      setTimeout(() => {
        cleanupAudio(audioDir);
      }, 5000); // 600000 milliseconds = 10 minutes
    }
  }
});

console.log("bot is running ..");
