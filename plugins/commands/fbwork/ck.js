import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import randomUseragent from 'random-useragent';

puppeteer.use(StealthPlugin());

const config = {
  name: "ck",
  description: "Create Facebook accounts safely with realistic behavior",
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

function randomEmail(prefix = "likhon420x") {
  const chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(randomInt(0, chars.length - 1));
  }
  return `${prefix}${rand}@gmail.com`;
}

async function simulateHumanMouseMovement(page) {
  const width = 1920;
  const height = 1080;
  for (let i = 0; i < 10; i++) {
    const x = randomInt(0, width);
    const y = randomInt(0, height);
    await page.mouse.move(x, y, { steps: randomInt(10, 25) });
    await page.waitForTimeout(randomInt(100, 300));
  }
}

async function createFacebookAccount(name, dob, emailOrPhone, password, proxy = null) {
  const launchArgs = ['--no-sandbox', '--disable-setuid-sandbox'];
  if (proxy) launchArgs.push(`--proxy-server=${proxy}`);

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: launchArgs
  });

  let uid = null;

  try {
    const page = await browser.newPage();
    const userAgent = randomUseragent.getRandom();
    await page.setUserAgent(userAgent);

    await page.goto('https://www.facebook.com/reg', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await simulateHumanMouseMovement(page);

    await page.type('input[name="firstname"]', name.split(' ')[0], { delay: 80 });
    await page.type('input[name="lastname"]', name.split(' ')[1], { delay: 80 });
    await page.type('input[name="reg_email__"]', emailOrPhone, { delay: 80 });

    await page.waitForTimeout(randomInt(500, 1000));
    await page.type('input[name="reg_passwd__"]', password, { delay: 80 });

    await page.select('select[name="birthday_day"]', dob.day.toString());
    await page.select('select[name="birthday_month"]', dob.month.toString());
    await page.select('select[name="birthday_year"]', dob.year.toString());

    const genderSelector = ['input[value="1"]', 'input[value="2"]'][Math.floor(Math.random() * 2)];
    await page.click(genderSelector);
    await page.waitForTimeout(randomInt(500, 1000));

    await page.click('button[name="websubmit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

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
    await browser.close();
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

      const proxy = null; // Optional: use a proxy from list here
      const result = await createFacebookAccount(name, dob, email, password, proxy);

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

      await new Promise(r => setTimeout(r, randomInt(4000, 8000))); // Random delay
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
