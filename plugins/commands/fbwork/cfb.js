import fs from "fs";
import path from "path";

const config = {
  name: "cfb",
  description: "Create random Facebook account entries with your password",
  usage: "/cfb [amount] - [password]",
  cooldown: 5,
  permissions: [0, 1, 2],
  credits: "RIN"
};

function getRandomName() {
  const firstNames = ["Rafi", "Nayeem", "Sami", "Tanzim", "Nayan", "Rifat", "Shakib", "Tamim"];
  const lastNames = ["Hossain", "Ahmed", "Khan", "Rahman", "Mia", "Islam", "Hasan", "Sikder"];
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

function getRandomDOB() {
  const year = Math.floor(Math.random() * (2003 - 1985 + 1)) + 1985;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;
}

function generateRandomEmail(name) {
  const domains = ["@gmail.com", "@hotmail.com", "@yahoo.com"];
  const clean = name.toLowerCase().replace(/\s/g, "") + Math.floor(100 + Math.random() * 9999);
  return clean + domains[Math.floor(Math.random() * domains.length)];
}

export async function onCall({ message, args }) {
  const text = args.join(" ").trim();
  if (!text.includes("-")) return message.reply("❌ Use format: /cfb [amount] - [password]");

  const [amountPart, passwordPart] = text.split("-").map(s => s.trim());
  const amount = parseInt(amountPart) || 1;
  const password = passwordPart;

  if (!password) return message.reply("❌ Password is required.");

  const accounts = [];

  for (let i = 0; i < amount; i++) {
    const name = getRandomName();
    const dob = getRandomDOB();
    const email = generateRandomEmail(name);
    accounts.push(`👤 Name: ${name}\n📧 Email: ${email}\n🎂 DOB: ${dob}\n🔑 Pass: ${password}`);
  }

  if (accounts.length === 1) {
    return message.reply(accounts[0]);
  } else {
    const output = accounts.join("\n\n");
    const filePath = path.join(process.cwd(), "cache", "fb_accounts.txt");

    if (!fs.existsSync("cache")) fs.mkdirSync("cache");
    fs.writeFileSync(filePath, output, "utf-8");

    return message.reply({
      body: `✅ Created ${amount} accounts with password "${password}".`,
      attachment: fs.createReadStream(filePath)
    });
  }
}

export default {
  config,
  onCall
};
