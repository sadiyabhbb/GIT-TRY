import axios from "axios";
import fs from "fs";

const config = {
  name: "bot",
  description: "Teach & Respond bot",
  usage: "bot hi | bot <your message>",
  cooldown: 3,
  permissions: [0, 1, 2],
  credits: "LIKHON AHMED"
};

const TEACH_API_URL = "https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json";
const LOCAL_CACHE = "./cache/teach.json";

// 🔰 Ensure file/folder with default messages
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

// 📥 Read teach data
async function getTeachData() {
  try {
    const res = await axios.get(TEACH_API_URL);
    if (Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch (e) {
    // fallback to local
  }

  if (fs.existsSync(LOCAL_CACHE)) {
    return JSON.parse(fs.readFileSync(LOCAL_CACHE, "utf-8"));
  }

  return [];
}

// 💾 Save to local
function saveTeachData(data) {
  fs.writeFileSync(LOCAL_CACHE, JSON.stringify(data, null, 2), "utf-8");
}

export async function onCall({ message, args }) {
  ensureTeachFile();

  const input = args.join(" ").trim();
  if (!input) return message.reply("Please type something after 'bot'.");

  let teachData = await getTeachData();
  if (!Array.isArray(teachData)) teachData = [];

  const lower = input.toLowerCase();

  if (lower === "hi" || lower === "") {
    if (!teachData.length) return message.reply("No data available.");
    const random = teachData[Math.floor(Math.random() * teachData.length)];
    return message.reply(random);
  }

  // Add to local teach file
  teachData.push(input);
  saveTeachData(teachData);

  return message.reply("✅ Saved: " + input);
}

export default {
  config,
  onCall
};
