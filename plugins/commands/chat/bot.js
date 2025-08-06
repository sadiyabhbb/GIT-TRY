import axios from "axios";
import fs from "fs";

const config = {
  name: "bot",
  description: "Teach & Respond bot (SIM API + local)",
  usage: "bot hi | bot <your message>",
  cooldown: 3,
  permissions: [0, 1, 2],
  credits: "RIN"
};

const SIM_API = "http://65.109.80.126:20392/sim";
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

// 💾 Save input to local file
function saveTeachData(data) {
  fs.writeFileSync(LOCAL_CACHE, JSON.stringify(data, null, 2), "utf-8");
}

// 📁 Load from local cache
function loadLocalData() {
  if (fs.existsSync(LOCAL_CACHE)) {
    const data = JSON.parse(fs.readFileSync(LOCAL_CACHE, "utf-8"));
    return Array.isArray(data) ? data : [];
  }
  return [];
}

// 🧠 Main function
export async function onCall({ message, args }) {
  ensureTeachFile();

  const input = args.join(" ").trim();
  if (!input) {
    return message.reply("❌ Please type something after 'bot'.");
  }

  try {
    // 🔗 API call
    const res = await axios.get(SIM_API, {
      params: { type: "ask", ask: input }
    });

    const reply = res.data;

    // ✅ Valid reply
    if (reply && typeof reply === "string" && reply.trim() !== "" && !reply.startsWith("http")) {
      return message.reply(reply);
    }

    // ⛔ Invalid or no match
    return message.reply("⚠️ No valid messages available.");

  } catch (e) {
    // 🌐 API failed, fallback to local
    const localData = loadLocalData();
    const filtered = localData.filter(
      msg => typeof msg === "string" && !msg.startsWith("http")
    );

    if (filtered.length) {
      const random = filtered[Math.floor(Math.random() * filtered.length)];
      return message.reply(random);
    } else {
      return message.reply("❌ Error reaching SIM API and no local messages found.");
    }
  }
}

export default {
  config,
  onCall
};
