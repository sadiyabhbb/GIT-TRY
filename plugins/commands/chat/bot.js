import axios from "axios";
import fs from "fs";

const config = {
  name: "bot",
  description: "Auto bot reply via SIM API",
  usage: "bot hi | bot <your message>",
  cooldown: 3,
  permissions: [0, 1, 2],
  credits: "RIN"
};

const LOCAL_CACHE = "./cache/teach.json";
const SIM_API_URL = "http://65.109.80.126:20392/sim";

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

// 🧠 Main function
export async function onCall({ message, args }) {
  ensureTeachFile();

  const input = args.join(" ").trim();
  const lower = input.toLowerCase();

  // ✅ If "bot" or "bot hi" ➜ random from local file
  if (lower === "hi" || input === "") {
    const data = JSON.parse(fs.readFileSync(LOCAL_CACHE, "utf-8"));
    const filtered = data.filter(msg =>
      typeof msg === "string" && !msg.startsWith("http")
    );

    if (!filtered.length) return message.reply("⚠️ No valid messages available.");
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    return message.reply(random);
  }

  // 🤖 Try SIM API
  try {
    const res = await axios.get(SIM_API_URL, {
      params: { type: "ask", ask: input }
    });

    const reply = res.data?.data?.msg;

    if (reply && typeof reply === "string" && reply.trim() !== "") {
      return message.reply(reply);
    }
  } catch (err) {
    console.error("SIM API error:", err.message);
  }

  // ❌ If SIM gives no reply
  return message.reply("⚠️ Sorry, no reply found.");
}

export default {
  config,
  onCall
};
