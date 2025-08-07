import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

const config = {
  name: "cfb",
  description: "Create Facebook accounts with random Gmail and return UID",
  usage: "cfb <number> - <password>",
  cooldown: 5,
  permissions: [0, 1, 2],
  credits: "RIN"
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate() {
  const year = randomInt(1985, 2002);
  const month = randomInt(1, 12);
  const day = randomInt(1, 28);
  return { day, month, year };
}

function randomName() {
  const firstNames = ["John", "Alex", "Michael", "Chris", "David", "James"];
  const lastNames = ["Smith", "Johnson", "Brown", "Williams", "Jones"];
  return `${firstNames[randomInt(0, firstNames.length - 1)]} ${lastNames[randomInt(0, lastNames.length - 1)]}`;
}

function randomEmail() {
  const chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
  let email = '';
  for (let i = 0; i < 8; i++) {
    email += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return email + "@gmail.com";
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createFacebookAccount(name, dob, email, password) {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/' + randomInt(90, 116) + '.0.0.0 Safari/537.36');

    await page.goto('https://www.facebook.com/reg', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const [firstName, lastName] = name.split(' ');
    await page.type('input[name="firstname"]', firstName, { delay: randomInt(100, 200) });
    await page.type('input[name="lastname"]', lastName, { delay: randomInt(100, 200) });
    await page.type('input[name="reg_email__"]', email, { delay: randomInt(100, 200) });
    await delay(1000);
    await page.type('input[name="reg_email_confirmation__"]', email, { delay: randomInt(100, 200) });
    await page.type('input[name="reg_passwd__"]', password, { delay: randomInt(100, 200) });

    await page.select('select[name="birthday_day"]', dob.day.toString());
    await page.select('select[name="birthday_month"]', dob.month.toString());
    await page.select('select[name="birthday_year"]', dob.year.toString());

    const genderSelector = ['input[value="1"]', 'input[value="2"]'][randomInt(0, 1)];
    await page.click(genderSelector);

    await delay(1500);
    await page.click('button[name="websubmit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

    await delay(4000);

    let uid = null;
    const cookies = await page.cookies();
    const c_user = cookies.find(c => c.name === 'c_user');
    if (c_user) uid = c_user.value;

    return {
      name,
      email,
      password,
      dob,
      uid: uid || "❓ Not available",
      status: "🕓 Waiting for confirmation code"
    };

  } catch (err) {
    console.error("❌ Error:", err.message);
    return null;
  } finally {
    await browser.close();
  }
}

export async function onCall({ message, args }) {
  if (args.length < 3) return message.reply("Usage: cfb <number> - <password>");

  const count = parseInt(args[0]);
  if (isNaN(count) || count <= 0) return message.reply("Invalid number");

  if (args[1] !== '-') return message.reply("Format: /cfb <number> - <password>");

  const password = args.slice(2).join(" ");
  if (!password) return message.reply("Please provide a password.");

  const results = [];
  for (let i = 0; i < count; i++) {
    const name = randomName();
    const dob = randomDate();
    const email = randomEmail();

    const result = await createFacebookAccount(name, dob, email, password);
    if (result) {
      results.push(result);
      await message.reply(
        `✅ Account ${i + 1} created:\n👤 Name: ${result.name}\n📧 Email: ${result.email}\n🔑 Password: ${result.password}\n🎂 DOB: ${result.dob.day}/${result.dob.month}/${result.dob.year}\n🆔 UID: ${result.uid}\n📨 Status: ${result.status}`
      );
    } else {
      await message.reply(`❌ Error creating account ${i + 1}`);
    }
  }
}

export default {
  config,
  onCall
};
