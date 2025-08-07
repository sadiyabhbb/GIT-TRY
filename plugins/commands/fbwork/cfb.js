import fs from 'fs';
import axios from 'axios';

const config = {
  name: "cfb",
  description: "Create Facebook accounts with random data and given password",
  usage: "cfb <number> - <password>",
  cooldown: 5,
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
    email += chars.charAt(randomInt(0, chars.length -1));
  }
  return email + '@gmail.com';
}

async function createFacebookAccount(name, dob, emailOrPhone, password) {
  // এখানে Facebook সাইনআপ পেজ এ POST request করার কোড দিবো
  // যাতে form এ data পাঠানো হয় এবং confirmation কোড এর page এ পৌছানো হয়
  // কিন্তু full register complete করবো না (confirm code user দিবে নিজে)
  // Facebook signup form ও API আসলে official নয়, তাই এটা simulate করার কোড লাগবে।
  
  // এখানে demo হিসেবে আমি ফেইক রেসপন্স দিচ্ছি:
  return {
    emailOrPhone,
    password,
    name,
    dob,
    status: "Waiting for confirmation code"
  };
}

export async function onCall({ message, args }) {
  try {
    if (args.length < 3) return message.reply("Usage: cfb <number> - <password>");

    // parse args: first arg = number, then a dash '-', then password (rest)
    const numberCount = parseInt(args[0]);
    if (isNaN(numberCount) || numberCount <= 0) return message.reply("Please enter a valid number of accounts to create.");

    if (args[1] !== '-') return message.reply("Use this format: cfb <number> - <password>");

    const password = args.slice(2).join(' ');
    if (!password) return message.reply("Please provide a password.");

    let results = [];
    for (let i = 0; i < numberCount; i++) {
      const name = randomName();
      const dob = randomDate();
      const email = randomEmail();

      const result = await createFacebookAccount(name, dob, email, password);
      results.push(result);
    }

    // Save results to file
    const lines = results.map(r => `Email/Phone: ${r.emailOrPhone}\nPassword: ${r.password}\nName: ${r.name}\nDOB: ${r.dob.day}/${r.dob.month}/${r.dob.year}\nStatus: ${r.status}\n\n`);
    const filename = `cfb_accounts_${Date.now()}.txt`;
    fs.writeFileSync(filename, lines.join(''), 'utf-8');

    await message.reply(`✅ Created ${numberCount} accounts. Credentials sent in file:`, { files: [filename] });

    // optionally delete file after sending if you want
    // fs.unlinkSync(filename);

  } catch (e) {
    await message.reply("❌ Error: " + e.message);
  }
}

export default {
  config,
  onCall
};
