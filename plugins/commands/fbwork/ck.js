import puppeteer from 'puppeteer';

const config = {
  name: "ck",
  description: "Create Facebook accounts with human-like automation (no extra deps)",
  usage: "cfb <number> - <password>",
  cooldown: 5,
  permissions: [0, 1, 2],
  credits: "RIN"
};

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// Simple linear mouse movement simulation
async function humanMouseMove(page, start, end, steps = 25) {
  const xStep = (end.x - start.x) / steps;
  const yStep = (end.y - start.y) / steps;
  for (let i = 0; i <= steps; i++) {
    await page.mouse.move(Math.round(start.x + xStep * i), Math.round(start.y + yStep * i));
    await delay(15 + Math.random() * 25);
  }
}

// Human-like typing with delay per character
async function typeLikeHuman(page, selector, text) {
  for (const char of text) {
    await page.type(selector, char);
    await delay(80 + Math.random() * 120);
  }
}

// Random int helper
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random date generator
function randomDate() {
  const year = randomInt(1985, 2003);
  const month = randomInt(1, 12);
  const day = randomInt(1, 28);
  return { day, month, year };
}

// Random name generator
function randomName() {
  const firstNames = ["John", "Alex", "Michael", "Chris", "David", "James", "Robert", "Daniel"];
  const lastNames = ["Smith", "Johnson", "Brown", "Williams", "Jones", "Miller", "Davis"];
  const first = firstNames[randomInt(0, firstNames.length - 1)];
  const last = lastNames[randomInt(0, lastNames.length - 1)];
  return `${first} ${last}`;
}

// Email with fixed prefix + random string
function randomEmail(prefix = "likhon420x") {
  const chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(randomInt(0, chars.length - 1));
  }
  return `${prefix}${rand}@gmail.com`;
}

// Main Facebook account creation
async function createFacebookAccount(name, dob, emailOrPhone, password) {
  const browser = await puppeteer.launch({
    headless: false, // headful for more natural
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let uid = null;

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Manual user agent (no random-useragent lib)
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

    await page.goto('https://www.facebook.com/reg', { waitUntil: 'networkidle2' });

    // Human-like mouse move & typing for firstname
    await humanMouseMove(page, { x: 0, y: 0 }, { x: 200, y: 300 });
    await typeLikeHuman(page, 'input[name="firstname"]', name.split(' ')[0]);
    await delay(randomInt(500, 1200));

    // Lastname
    await humanMouseMove(page, { x: 200, y: 300 }, { x: 400, y: 300 });
    await typeLikeHuman(page, 'input[name="lastname"]', name.split(' ')[1]);
    await delay(randomInt(500, 1200));

    // Email
    await humanMouseMove(page, { x: 400, y: 300 }, { x: 200, y: 350 });
    await typeLikeHuman(page, 'input[name="reg_email__"]', emailOrPhone);
    await delay(randomInt(500, 1200));

    // Password
    await humanMouseMove(page, { x: 200, y: 350 }, { x: 400, y: 400 });
    await typeLikeHuman(page, 'input[name="reg_passwd__"]', password);
    await delay(randomInt(500, 1200));

    // DOB select (direct selection)
    await page.select('select[name="birthday_day"]', dob.day.toString());
    await delay(randomInt(300, 700));
    await page.select('select[name="birthday_month"]', dob.month.toString());
    await delay(randomInt(300, 700));
    await page.select('select[name="birthday_year"]', dob.year.toString());
    await delay(randomInt(500, 1000));

    // Gender click (male=2, female=1)
    const genderSelector = ['input[value="1"]', 'input[value="2"]'][Math.floor(Math.random() * 2)];
    const genderBox = await page.$(genderSelector);
    const box = await genderBox.boundingBox();
    await humanMouseMove(page, { x: 400, y: 400 }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    await delay(randomInt(300, 700));
    await genderBox.click();

    await delay(randomInt(1000, 2000));

    // Submit button
    const submitBtn = await page.$('button[name="websubmit"]');
    const btnBox = await submitBtn.boundingBox();
    await humanMouseMove(page, { x: box.x + box.width / 2, y: box.y + box.height / 2 }, { x: btnBox.x + btnBox.width / 2, y: btnBox.y + btnBox.height / 2 });
    await delay(randomInt(300, 700));
    await submitBtn.click();

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

    // Try to get UID
    const url = page.url();
    const match = url.match(/profile\.php\?id=(\d+)/);
    if (match && match[1]) {
      uid = match[1];
    } else {
      const cookies = await page.cookies();
      const c_user = cookies.find(c => c.name === 'c_user');
      if (c_user) uid = c_user.value;
    }

    return {
      emailOrPhone,
      password,
      name,
      dob,
      uid: uid || '❓ Not available',
      status: "🕓 Waiting for confirmation code"
    };

  } catch (err) {
    console.error('Error creating account:', err);
    return null;
  } finally {
    // await browser.close(); // keep open for manual verification if needed
  }
}

export async function onCall({ message, args }) {
  try {
    if (args.length < 3) return message.reply("Usage: cfb <number> - <password>");

    const numberCount = parseInt(args[0]);
    if (isNaN(numberCount) || numberCount <= 0) return message.reply("Please enter a valid number.");

    if (args[1] !== '-') return message.reply("Use format: cfb <number> - <password>");

    const password = args.slice(2).join(' ');
    if (!password) return message.reply("Please provide a password.");

    let results = [];
    for (let i = 0; i < numberCount; i++) {
      const name = randomName();
      const dob = randomDate();
      const email = randomEmail("likhon420x");

      const result = await createFacebookAccount(name, dob, email, password);

      if (result) {
        results.push(result);
        await message.reply(
          `✅ Account ${i + 1} created:\n` +
          `👤 Name: ${result.name}\n` +
          `📧 Email: ${result.emailOrPhone}\n` +
          `🔑 Password: ${result.password}\n` +
          `🎂 DOB: ${result.dob.day}/${result.dob.month}/${result.dob.year}\n` +
          `🆔 UID: ${result.uid}\n` +
          `📨 Status: ${result.status}`
        );
      } else {
        await message.reply(`❌ Error creating account ${i + 1}`);
      }

      await delay(randomInt(4000, 9000)); // Random delay between accounts
    }

    if (!results.length) return message.reply("❌ No accounts were created.");

  } catch (e) {
    await message.reply("❌ Error: " + e.message);
  }
}

export default {
  config,
  onCall
};
