import puppeteer from 'puppeteer';

const config = {
  name: "cfb",
  description: "Create Facebook accounts with random data and given password",
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
  const firstNames = ["John", "Alex", "Michael", "Chris", "David", "James", "Robert", "Daniel", "Emma", "Lily", "Sophia"];
  const lastNames = ["Smith", "Johnson", "Brown", "Williams", "Jones", "Miller", "Davis", "Watson"];
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

async function createFacebookAccount(name, dob, emailOrPhone, password) {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 80,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--window-size=1280,800',
      '--disable-extensions',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36'
    ]
  });

  let uid = null;

  try {
    const page = await browser.newPage();
    await page.goto('https://www.facebook.com/reg', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    const [first, last] = name.split(' ');

    await page.type('input[name="firstname"]', first, { delay: 100 });
    await page.type('input[name="lastname"]', last || 'Doe', { delay: 100 });
    await page.type('input[name="reg_email__"]', emailOrPhone, { delay: 100 });

    // Wait and check if Facebook adds confirm email field
    await page.waitForTimeout(1500);
    const confirmEmailSelector = 'input[name="reg_email_confirmation__"]';
    const confirmEmailExists = await page.$(confirmEmailSelector);
    if (confirmEmailExists) {
      await page.type(confirmEmailSelector, emailOrPhone, { delay: 100 });
    }

    await page.type('input[name="reg_passwd__"]', password, { delay: 100 });

    await page.select('select[name="birthday_day"]', dob.day.toString());
    await page.select('select[name="birthday_month"]', dob.month.toString());
    await page.select('select[name="birthday_year"]', dob.year.toString());

    const genderSelector = ['input[value="1"]', 'input[value="2"]'][Math.floor(Math.random() * 2)];
    await page.click(genderSelector);
    await page.waitForTimeout(2000);

    await page.$eval('button[name="websubmit"]', btn => btn.click());
    await page.waitForTimeout(8000); // Wait for potential redirect or error

    const cookies = await page.cookies();
    const c_user = cookies.find(c => c.name === 'c_user');
    if (c_user) uid = c_user.value;

    return {
      emailOrPhone,
      password,
      name,
      dob,
      uid: uid || '❓NotAvailable',
      status: "🕓 Waiting for confirmation code"
    };

  } catch (err) {
    console.error('Error creating account:', err.message);
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
      const email = randomEmail();

      const result = await createFacebookAccount(name, dob, email, password);

      if (result) {
        results.push(result);
      } else {
        await message.reply(`❌ Error creating account ${i + 1}`);
      }
    }

    if (!results.length) return message.reply("❌ No accounts were created.");

    let outputLines = results.map(acc => {
      const dd = acc.dob.day.toString().padStart(2, '0');
      const mm = acc.dob.month.toString().padStart(2, '0');
      const yyyy = acc.dob.year;
      return `${acc.uid}\t${acc.name}\t${acc.emailOrPhone}\t${acc.password}\t${dd}/${mm}/${yyyy}`;
    });

    let finalOutput = outputLines.join('\n');

    await message.reply(`✅ Created ${results.length} account(s):\n\n` + finalOutput);

  } catch (e) {
    await message.reply("❌ Error: " + e.message);
  }
}

export default {
  config,
  onCall
};
