import puppeteer from 'puppeteer';
import fetch from 'node-fetch';

const config = {
  name: "cfb",
  description: "Create Facebook accounts with random info and provided password",
  usage: "cfb <number> - <password>",
  cooldown: 5,
  permissions: [0, 1, 2],
  credits: "RIN"
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
  const chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
  let email = '';
  for (let i = 0; i < 7; i++) {
    email += chars.charAt(randomInt(0, chars.length - 1));
  }
  return email + '@gmail.com';
}

async function getUIDFromUsername(usernameOrEmail) {
  try {
    const res = await fetch(`https://graph.facebook.com/v17.0/${usernameOrEmail}?fields=id&access_token=350685531728|62f8ce9f74b12f84c123cc23437a4a32`);
    const json = await res.json();
    return json.id || 'Not available';
  } catch {
    return 'Not available';
  }
}

async function createFacebookAccount(name, dob, email, password) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://www.facebook.com/reg', { waitUntil: 'networkidle2', timeout: 60000 });

    await page.type('input[name="firstname"]', name.split(' ')[0]);
    await page.type('input[name="lastname"]', name.split(' ')[1]);
    await page.type('input[name="reg_email__"]', email);
    await page.type('input[name="reg_passwd__"]', password);
    await page.select('select[name="birthday_day"]', dob.day.toString());
    await page.select('select[name="birthday_month"]', dob.month.toString());
    await page.select('select[name="birthday_year"]', dob.year.toString());

    const genderSelector = ['input[value="1"]', 'input[value="2"]'][Math.floor(Math.random() * 2)];
    await page.click(genderSelector);
    await page.click('button[name="websubmit"]');
    await page.waitForTimeout(5000); // wait for next step (code input)

    const uid = await getUIDFromUsername(email.split("@")[0]);

    return {
      email,
      password,
      name,
      dob,
      uid,
      status: "Waiting for confirmation code"
    };

  } catch (err) {
    console.error("Error:", err);
    return null;
  } finally {
    await browser.close();
  }
}

export async function onCall({ message, args }) {
  if (args.length < 3) return message.reply("Usage: /cfb <number> - <password>");

  const number = parseInt(args[0]);
  if (isNaN(number) || number <= 0) return message.reply("Please enter a valid number of accounts.");

  if (args[1] !== '-') return message.reply("Use correct format: /cfb <number> - <password>");

  const password = args.slice(2).join(' ');
  if (!password) return message.reply("Please provide a password.");

  await message.reply("⏳ Creating accounts, please wait...");

  let allText = '';
  for (let i = 0; i < number; i++) {
    const name = randomName();
    const dob = randomDate();
    const email = randomEmail();

    const result = await createFacebookAccount(name, dob, email, password);
    if (result) {
      allText += `🔐 Account ${i + 1}:\n`;
      allText += `👤 Name: ${result.name}\n📧 Email: ${result.email}\n🔑 Password: ${result.password}\n📅 DOB: ${result.dob.day}/${result.dob.month}/${result.dob.year}\n🆔 UID: ${result.uid}\n📩 Status: ${result.status}\n\n`;
    } else {
      allText += `❌ Error creating account ${i + 1}\n\n`;
    }
  }

  await message.reply(`✅ Created ${number} account(s):\n\n${allText}`);
}

export default {
  config,
  onCall
};
