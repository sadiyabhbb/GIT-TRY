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
const LAST_REPLY_CACHE = "./cache/last_reply.json";
const SIM_API_URL = "http://65.109.80.126:20392/sim";

// Ensure cache folder & default messages
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

  if (!fs.existsSync(LAST_REPLY_CACHE)) {
    fs.writeFileSync(LAST_REPLY_CACHE, JSON.stringify({ last: "" }), "utf-8");
  }
}

function getLastReply() {
  if (!fs.existsSync(LAST_REPLY_CACHE)) return "";
  const data = JSON.parse(fs.readFileSync(LAST_REPLY_CACHE, "utf-8"));
  return data.last || "";
}

function setLastReply(text) {
  fs.writeFileSync(LAST_REPLY_CACHE, JSON.stringify({ last: text }, null, 2), "utf-8");
}

export async function onCall({ message, args }) {
  ensureCache();

  const input = args.join(" ").trim();
  const lower = input.toLowerCase();
  const lastBotReply = getLastReply();

  // ✅ bot or bot hi = random from local
  if (lower === "hi" || input === "") {
    const data = JSON.parse(fs.readFileSync(LOCAL_CACHE, "utf-8"));
    const filtered = data.filter(msg =>
      typeof msg === "string" && !msg.startsWith("http")
    );

    if (!filtered.length) return message.reply("⚠️ No valid messages available.");
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    setLastReply(random);
    return message.reply(random);
  }

  // 🔁 User replied same as last bot message → use that as new input
  const isLoop = input === lastBotReply;

  try {
    const res = await axios.get(SIM_API_URL, {
      params: { type: "ask", ask: isLoop ? input : input }
    });

    if (res.data && res.data.data && res.data.data.msg) {
      const reply = res.data.data.msg;
      setLastReply(reply);
      return message.reply(reply);
    }
  } catch (e) {
    // ignore error
  }

  return message.reply("⚠️ Sorry, no reply found.");
}

export default {
  config,
  onCall
};
