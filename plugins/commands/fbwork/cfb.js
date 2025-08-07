import fs from "fs";
import puppeteer from "puppeteer";

const config = {
  name: "cfb",
  description: "Create Facebook accounts with random data and given password",
  usage: "cfb <number> - <password>",
  cooldown: 10,
  permissions: [0, 1, 2],
  credits: "RIN"
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate() {
  return {
    day: randomInt(1, 28),
    month: randomInt(1, 12),
    year: randomInt(1985, 2003)
  };
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
  for (let i = 0; i < 8; i++) {
    email += chars.charAt(randomInt(0, chars.length - 1));
  }
  return email + "@gmail.com";
}

async function createFbAccount(name, dob, email, password) {
  const browser = await puppeteer.launch({
    headless: false,  // ব্রাউজার চালু থাকবে, তুমি নিজে দেখতে পারবে
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  try {
    await page.goto("https://www.facebook.com/r.php", { waitUntil: "networkidle2" });

    const [firstName, lastName] = name.split(" ");

    await page.type('input[name="firstname"]', firstName, { delay: 50 });
    await page.type('input[name="lastname"]', lastName, { delay: 50 });
    await page.type('input[name="reg_email__"]', email, { delay: 50 });
    await page.type('input[name="reg_passwd__"]', password, { delay: 50 });

    await page.select('select[name="birthday_day"]', dob.day.toString());
    await page.select('select[name="birthday_month"]', dob.month.toString());
    await page.select('select[name="birthday_year"]', dob.year.toString());

    // Male gender select (value="2")
    await page.click('input[name="sex"][value="2"]');

    // এখানে থামবে, তুমি ভেরিফিকেশন নিজে করো
    console.log(`Filled form for ${email}`);

    // তুমি চাইলে ব্রাউজার রেখে দিতে পারো, নিজে ভেরিফাই করো
    // await browser.close();

    return { email, password, name, dob, status: "Waiting for manual verification" };

  } catch (err) {
    await browser.close();
    throw err;
  }
}

export async function onCall({ message, args }) {
  if (args.length < 3) {
    return message.reply("Usage: cfb <number> - <password>");
  }

  const count = parseInt(args[0]);
  if (isNaN(count) || count < 1) {
    return message.reply("Please enter a valid number of accounts to create.");
  }

  if (args[1] !== "-") {
    return message.reply("Use this format: cfb <number> - <password>");
  }

  const password = args.slice(2).join(" ");
  if (!password) {
    return message.reply("Please provide a password.");
  }

  let results = [];

  for (let i = 0; i < count; i++) {
    const name = randomName();
    const dob = randomDate();
    const email = randomEmail();

    try {
      const result = await createFbAccount(name, dob, email, password);
      results.push(result);
    } catch (e) {
      message.reply(`Error creating account ${i + 1}: ${e.message}`);
    }
  }

  // Save to file
  const lines = results.map(r =>
    `Email: ${r.email}\nPassword: ${r.password}\nName: ${r.name}\nDOB: ${r.dob.day}/${r.dob.month}/${r.dob.year}\nStatus: ${r.status}\n\n`
  );

  const filename = `cfb_accounts_${Date.now()}.txt`;
  fs.writeFileSync(filename, lines.join(""), "utf-8");

  await message.reply(`✅ Created ${results.length} accounts. Credentials sent in file:`, {
    files: [filename]
  });
}

export default {
  config,
  onCall
};
