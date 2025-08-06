import axios from "axios";
import fs from "fs";

const config = {
  name: "bot",
  description: "Teach & Respond bot",
  usage: "bot hi | bot <your message>",
  cooldown: 3,
  permissions: [0, 1, 2],
  credits: "RIN"
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

// 📥 Read teach data (Sim API preferred)
async function getTeachData() {
  try {
    const res = await axios.get(TEACH_API_URL);

    // ✅ Sim API returns object like: { "hi": "hello", ... }
    if (typeof res.data === "object" && !Array.isArray(res.data)) {
      const entries = Object.entries(res.data);
      return entries.map(([_, value]) => value); // Just the replies
    }

    // ✅ fallback if it's an array
    if (Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }

  } catch (e) {
    // fallback to local
  }

  // 📁 Local fallback
  if (fs.existsSync(LOCAL_CACHE)) {
    return JSON.parse(fs.readFileSync(LOCAL_CACHE, "utf-8"));
  }

  return [];
}

// 💾 Save to local
function saveTeachData(data) {
  fs.writeFileSync(LOCAL_CACHE, JSON.stringify(data, null, 2), "utf-8");
}

// 🧠 Main logic
export async function onCall({ message, args }) {
  ensureTeachFile();

  const input = args.join(" ").trim();
  const lower = input.toLowerCase();

  let teachData = await getTeachData();
  if (!Array.isArray(teachData)) teachData = [];

  // ✅ Filter out links (only allow text)
  const filtered = teachData.filter(msg =>
    typeof msg === "string" && !msg.startsWith("http")
  );

  // ✅ Just "bot" or "bot hi" ➜ reply from filtered data
  if (input === "" || lower === "hi") {
    if (!filtered.length) return message.reply("No valid messages available.");
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    return message.reply(random);
  }

  // ➕ Save input to local
  const localData = fs.existsSync(LOCAL_CACHE)
    ? JSON.parse(fs.readFileSync(LOCAL_CACHE, "utf-8"))
    : [];

  localData.push(input);
  saveTeachData(localData);

  return message.reply("✅ Saved: " + input);
}

export default {
  config,
  onCall
};
