import axios from "axios";
import fs from "fs";

const config = {
  name: "bot",
  description: "Auto chat with loop using SIM API",
  usage: "bot hi | bot <your message>",
  cooldown: 3,
  permissions: [0, 1, 2],
  credits: "RIN"
};

const LOCAL_CACHE = "./cache/teach.json";
const LAST_REPLIES_FILE = "./cache/last_bot_replies.json";
const SIM_API_URL = "http://65.109.80.126:20392/sim";

function ensureCache() {
  const defaultData = [
    "Hello! How can I help you today?",
    "I'm always here for you!",
    "What's up? 😊",
    "Need any help?",
    "Hi there! I'm your bot buddy.",
    "Bot is alive 😎",
    "Ready to respond anytime!",
    "How’s your day going?"
  ];

  if (!fs.existsSync("./cache")) fs.mkdirSync("./cache");

  if (!fs.existsSync(LOCAL_CACHE)) {
    fs.writeFileSync(LOCAL_CACHE, JSON.stringify(defaultData, null, 2), "utf-8");
  }

  if (!fs.existsSync(LAST_REPLIES_FILE)) {
    fs.writeFileSync(LAST_REPLIES_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function saveLastReply(text) {
  let replies = [];
  if (fs.existsSync(LAST_REPLIES_FILE)) {
    replies = JSON.parse(fs.readFileSync(LAST_REPLIES_FILE, "utf-8"));
  }

  // Limit to last 10 replies max
  if (replies.length >= 10) replies.shift();
  replies.push(text);

  fs.writeFileSync(LAST_REPLIES_FILE, JSON.stringify(replies, null, 2), "utf-8");
}

function wasBotLastReply(text) {
  if (!fs.existsSync(LAST_REPLIES_FILE)) return false;
  const replies = JSON.parse(fs.readFileSync(LAST_REPLIES_FILE, "utf-8"));
  return replies.includes(text);
}

export async function onCall({ message, args }) {
  ensureCache();

  const inputText = args.join(" ").trim();
  const replyText = message?.reply_message?.text?.trim();
  let finalAskText = "";

  if (inputText) {
    finalAskText = inputText;
  } else if (replyText && wasBotLastReply(replyText)) {
    finalAskText = replyText;
  }

  // bot or hi → random msg
  if (finalAskText.toLowerCase() === "hi" || finalAskText === "") {
    const data = JSON.parse(fs.readFileSync(LOCAL_CACHE, "utf-8"));
    const filtered = data.filter(msg =>
      typeof msg === "string" && !msg.startsWith("http")
    );

    if (!filtered.length) return message.reply("⚠️ No valid messages available.");
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    saveLastReply(random);
    return message.reply(random);
  }

  // Ask SIM API
  try {
    const res = await axios.get(SIM_API_URL, {
      params: { type: "ask", ask: finalAskText }
    });

    if (res.data && res.data.data && res.data.data.msg) {
      const reply = res.data.data.msg;
      saveLastReply(reply);
      return message.reply(reply);
    }
  } catch (e) {
    return message.reply("⚠️ API error. Try again.");
  }

  return message.reply("⚠️ Sorry, no reply found.");
}

export default {
  config,
  onCall
};
