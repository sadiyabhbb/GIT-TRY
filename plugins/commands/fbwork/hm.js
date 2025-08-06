import axios from 'axios';

const config = {
    name: "hm",
    description: "Check temporary mail via hotmail999.com API",
    usage: "<email@example.com>",
    cooldown: 5,
    permissions: [2], // group admin
    credits: "LIKHON AHMED"
};

export async function onCall({ message, args, userPermissions }) {
    const isGroupAdmin = userPermissions.includes(2);
    if (!isGroupAdmin) return message.reply("❌ If you do not have adequate permission to use this command.");

    const email = args[0];
    if (!email || !email.includes('@')) {
        return message.reply("⚠️ Give the correct mail /tm er@example.com");
    }

    try {
        const res = await axios.get(`https://hotmail999.com/api/get_mail.php`, {
            params: { email }
        });

        const data = res.data;

        if (!data.status || !data.data || data.data.length === 0) {
            return message.reply("📭 No email was found");
        }

        const latestMail = data.data[0];
        const { subject, from_field, date, code } = latestMail;

        return message.reply(
            "📥 New Email:\n\n" +
            `👤 Sender: ${from_field}\n\n` +
            `📝 Subject: ${subject}\n\n` +
            `📅 Time: ${date}\n\n` +
            (code ? `🔐 Code: ${code}` : "❌ Not code received")
        );

    } catch (error) {
        console.error(error);
        return message.reply("❌ Faceted Code error. Please Try Again Letter.");
    }
}

export default {
    config,
    onCall
};
