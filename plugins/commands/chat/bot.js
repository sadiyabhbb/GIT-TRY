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

function saveTeachData(data) {
  fs.writeFileSync(LOCAL_CACHE, JSON.stringify(data, null, 2), "utf-8");
}

export async function onCall({ message, args }) {
  ensureTeachFile();

  const input = args.join(" ").trim();
  const lower = input.toLowerCase();

  // bot বা bot hi হলে লোকাল ফাইল থেকে র্যান্ডম রিপ্লাই
  if (input === "" || lower === "hi") {
    const data = JSON.parse(fs.readFileSync(LOCAL_CACHE, "utf-8"));
    const filtered = data.filter(msg => typeof msg === "string" && !msg.startsWith("http"));
    if (!filtered.length) return message.reply("⚠️ No valid messages available.");
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    return message.reply(random);
  }

  // SIM API কল করে রিপ্লাই নেওয়া
  try {
    const res = await axios.get(SIM_API_URL, {
      params: { type: "ask", ask: input }
    });
    const reply = res.data;
    if (reply && typeof reply === "string" && reply.trim() !== "") {
      return message.reply(reply);
    }
  } catch (err) {
    // API error হলে নীরব
  }

  // SIM API তে কিছু না আসলে ইনপুট লোকাল ফাইলে সেভ করো
  let localData = [];
  if (fs.existsSync(LOCAL_CACHE)) {
    localData = JSON.parse(fs.readFileSync(LOCAL_CACHE, "utf-8"));
  }
  localData.push(input);
  saveTeachData(localData);

  return message.reply("✅ Saved: " + input);
}

export default {
  config,
  onCall
};
