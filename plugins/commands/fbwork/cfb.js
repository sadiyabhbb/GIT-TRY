import fs from "fs";
import puppeteer from "puppeteer";

const config = {
  name: "cfb",
  description: "Create Facebook accounts with random data and given password",
  usage: "cfb <number> - <password>",
  cooldown: 5,
  permissions: [0, 1, 2],
  credits: "RIN",
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate() {
  const year = randomInt(1985, 2003);
  const month = randomInt(1, 12);
  const day = randomInt(1, 28);
  return { day, month, year };
}

function randomName() {
  const firstNames = ["John", "Alex", "Michael", "Chris", "David", "James", "Robert", "Daniel"];
  const lastNames = ["Smith", "Johnson", "Brown", "Williams", "Jones", "Miller", "Davis"];
  const first = firstNames[randomInt(0, firstNames.length - 1)];
  const last = lastNames[randomInt(0, lastNames.length - 1)];
  return `${first} ${last}`;
}

function randomEmail() {
  const chars = "abcdefghijklmnopqrstuvwxyz1234567890";
  let email = "";
  for (let i = 0; i < 7; i++) {
    email += chars.charAt(randomInt(0, chars.length - 1));
  }
  return email + "@gmail.com";
}

async function createFacebookAccount(name, dob, emailOrPhone, password) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    await page.goto("https://www.facebook.com/r.php", { waitUntil: "networkidle2" });

    // পূরণ করো ফর্ম ফিল্ড
    await page.type("input[name=firstname]", name.split(" ")[0]);
    await page.type("input[name=lastname]", name.split(" ")[1]);
    await page.type("input[name=reg_email__]", emailOrPhone);
    await page.type("input[name=reg_passwd__]", password);

    // জন্মদিন সিলেক্ট
    await page.select("select[name=birthday_day]", dob.day.toString());
    await page.select("select[name=birthday_month]", dob.month.toString());
    await page.select("select[name=birthday_year]", dob.year.toString());

    // গার্ডিয়ান সিলেক্টর অথবা অন্য কোন ক্ষেত্র থাকলে প্রয়োজন মতো এখানে যোগ করো

    // তুমি চাইলে এখানে সাবমিট ক্লিক করতে পারো, কিন্তু তুমি বলেছো থামাতে হবে কোড এন্ট্রি জায়গায়
    // তাই নিচের লাইন কমেন্ট করে রেখেছি
    // await page.click("button[name=websubmit]");

    await page.waitForTimeout(3000); // একটু অপেক্ষা

    // ব্রাউজার বন্ধ করো না, তুমি এখানে থামাতে চাও, তাই return এর আগে বন্ধ করো না

    return {
      emailOrPhone,
      password,
      name,
      dob,
      status: "Stopped before confirmation code",
    };
  } catch (error) {
    console.error("Error during account creation:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

export async function onCall({ message, args }) {
  try {
    if (args.length < 3) return message.reply("Usage: cfb <number> - <password>");

    const numberCount = parseInt(args[0]);
    if (isNaN(numberCount) || numberCount <= 0) return message.reply("Please enter a valid number.");

    if (args[1] !== "-") return message.reply("Use this format: cfb <number> - <password>");

    const password = args.slice(2).join(" ");
    if (!password) return message.reply("Please provide a password.");

    let results = [];

    for (let i = 0; i < numberCount; i++) {
      const name = randomName();
      const dob = randomDate();
      const email = randomEmail();

      const account = await createFacebookAccount(name, dob, email, password);
      results.push(account);
    }

    // ফলাফল ফাইলে লিখো
    const lines = results.map(
      (r, idx) =>
        `Account #${idx + 1}\nEmail/Phone: ${r.emailOrPhone}\nPassword: ${r.password}\nName: ${r.name}\nDOB: ${r.dob.day}/${r.dob.month}/${r.dob.year}\nStatus: ${r.status}\n\n`
    );
    const filename = `cfb_accounts_${Date.now()}.txt`;
    fs.writeFileSync(filename, lines.join(""), "utf-8");

    await message.reply(`✅ Created ${numberCount} accounts. Credentials sent in file:`, { files: [filename] });

    // ইচ্ছে হলে ফাইল ডিলিট করো
    // fs.unlinkSync(filename);
  } catch (e) {
    await message.reply("❌ Error: " + e.message);
  }
}

export default {
  config,
  onCall,
};
