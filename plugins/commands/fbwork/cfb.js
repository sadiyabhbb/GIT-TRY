import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const config = {
  name: "cfb",
  description: "Create Facebook accounts with random data and given password",
  usage: "cfb <number> - <password>",
  cooldown: 10,
  permissions: [0,1,2],
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
  for(let i = 0; i < 7; i++) {
    email += chars.charAt(randomInt(0, chars.length - 1));
  }
  return email + '@gmail.com';
}

async function createFacebookAccount(name, dob, email, password) {
  const browser = await puppeteer.launch({
    headless: true, // false করলে ব্রাউজার দেখাবে
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    await page.goto('https://www.facebook.com/r.php', { waitUntil: 'networkidle2' });

    // পূর্ণ নাম বসানো
    await page.type('input[name="firstname"]', name.split(' ')[0], { delay: 50 });
    await page.type('input[name="lastname"]', name.split(' ')[1], { delay: 50 });

    // ইমেইল বা ফোন বসানো
    await page.type('input[name="reg_email__"]', email, { delay: 50 });
    await page.type('input[name="reg_email_confirmation__"]', email, { delay: 50 });

    // পাসওয়ার্ড বসানো
    await page.type('input[name="reg_passwd__"]', password, { delay: 50 });

    // জন্মদিন নির্বাচন
    await page.select('select[name="birthday_day"]', dob.day.toString());
    await page.select('select[name="birthday_month"]', dob.month.toString());
    await page.select('select[name="birthday_year"]', dob.year.toString());

    // লিঙ্গ নির্বাচন (পুরুষ ধরেছি, চাইলে পরিবর্তন করো)
    await page.click('input[value="2"]'); // Male = 2

    // সাবমিট বোতাম ক্লিক
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('button[name="websubmit"]'),
    ]);

    // 3 সেকেন্ড অপেক্ষা (waitForTimeout নেই, তাই Promise setTimeout)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // এখানে আমরা ধরে নিচ্ছি যে পরবর্তী ধাপে কোড বসাতে হবে, তাই অপেক্ষা করবো ইউজার করার জন্য
    // আর সে কাজ তুমি নিজে করবে

    await browser.close();

    return {
      email,
      password,
      name,
      dob,
      status: "Waiting for confirmation code"
    };

  } catch (err) {
    await browser.close();
    throw err;
  }
}

export async function onCall({ message, args }) {
  try {
    if (args.length < 3) return message.reply("Usage: cfb <number> - <password>");

    const numberCount = parseInt(args[0]);
    if (isNaN(numberCount) || numberCount <= 0) return message.reply("Please enter a valid number of accounts.");

    if (args[1] !== '-') return message.reply("Format: cfb <number> - <password>");

    const password = args.slice(2).join(' ');
    if (!password) return message.reply("Please provide a password.");

    let results = [];

    for (let i = 0; i < numberCount; i++) {
      try {
        const name = randomName();
        const dob = randomDate();
        const email = randomEmail();

        const res = await createFacebookAccount(name, dob, email, password);
        results.push(res);

        // ছোট একটা বিরতি দিতে পারো (optional)
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        message.reply(`Error creating account ${i+1}: ${e.message}`);
      }
    }

    // ফাইল তৈরি করো
    const lines = results.map(r => 
      `Email: ${r.email}\nPassword: ${r.password}\nName: ${r.name}\nDOB: ${r.dob.day}/${r.dob.month}/${r.dob.year}\nStatus: ${r.status}\n\n`
    );

    const filename = `cfb_accounts_${Date.now()}.txt`;
    fs.writeFileSync(filename, lines.join(''), 'utf-8');

    await message.reply(`✅ Created ${results.length} accounts. Credentials sent in file:`, { files: [filename] });

    // চাইলে ফাইল ডিলিট করতে পারো
    // fs.unlinkSync(filename);

  } catch (e) {
    await message.reply("❌ Error: " + e.message);
  }
}

export default {
  config,
  onCall
};
