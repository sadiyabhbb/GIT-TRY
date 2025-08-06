import axios from "axios";
import fs from "fs";

const config = {
  name: "bot",
  description: "Auto bot reply via SIM API only",
  usage: "bot hi | bot <your message>",
  cooldown: 3,
  permissions: [0, 1, 2],
  credits: "RIN"
};

const LOCAL_CACHE = "./cache/teach.json";
const SIM_API_URL = "http://65.109.80.126:20392/sim";

function ensureTeachFile() {
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
}

export async function onCall({ message, args }) {
  ensureTeachFile();

  const input = args.join(" ").trim();

  // SIM API কল করে রিপ্লাই নেওয়া
  try {
    const res = await axios.get(SIM_API_URL, {
      params: { type: "ask", ask: input || "hi" }
    });
    const reply = res.data;
    if (reply && typeof reply === "string" && reply.trim() !== "") {
      return message.reply(reply);
    } else {
      // যদি API থেকে কোনো রিপ্লাই না আসে
      return message.reply("⚠️ Sorry, no reply found.");
    }
  } catch (err) {
    return message.reply("⚠️ API error. Please try again later.");
  }
}

export default {
  config,
  onCall
};
