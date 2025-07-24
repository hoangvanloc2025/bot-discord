const { Client, GatewayIntentBits, ChannelType } = require("discord.js");
const dotenv = require("dotenv");
dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
    ],
});

client.once("ready", async () => {
    console.log(`✅ Bot đang chạy với tên ${client.user.tag}`);
    await updateStats(); // cập nhật ban đầu
    setInterval(updateStats, 10 * 1000); // cập nhật mỗi phút
});

async function updateStats() {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return console.error("❌ Không tìm thấy server");

    await guild.members.fetch();

    const totalMembers = guild.memberCount;
    const botCount = guild.members.cache.filter((m) => m.user.bot).size;
    const humanCount = totalMembers - botCount;
    const onlineCount = guild.members.cache.filter(
        (m) => !m.user.bot && m.presence?.status === "online",
    ).size;
    const offlineCount = humanCount - onlineCount;

    const stats = [
        {
            name: `📊 THỐNG KÊ MÁY CHỦ`,
            type: ChannelType.GuildCategory,
            key: "category",
        },
        { name: `All members: ${totalMembers}`, emoji: "", key: "total" },
        { name: `👥 | Thành Viên: ${humanCount}`, emoji: "👥", key: "humans" },
        { name: `🤖 | Bots: ${botCount}`, emoji: "🤖", key: "bots" },
        { name: `🟢 | Online: ${onlineCount}`, emoji: "🟢", key: "online" },
        { name: `🔴 | Offline: ${offlineCount}`, emoji: "🔴", key: "offline" },
    ];

    // Kiểm tra category đã tồn tại chưa
    let category = guild.channels.cache.find(
        (c) =>
            c.name === "📊 THỐNG KÊ MÁY CHỦ" &&
            c.type === ChannelType.GuildCategory,
    );
    if (!category) {
        category = await guild.channels.create({
            name: "📊 THỐNG KÊ MÁY CHỦ",
            type: ChannelType.GuildCategory,
        });
    }

    // Tạo hoặc cập nhật các kênh voice
    for (let stat of stats.slice(1)) {
        let channel = guild.channels.cache.find(
            (c) =>
                c.name.startsWith(stat.emoji || "") &&
                c.parentId === category.id &&
                c.type === ChannelType.GuildVoice,
        );
        if (!channel) {
            channel = await guild.channels.create({
                name: stat.name,
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: ["Connect"],
                    },
                ],
            });
        } else {
            // cập nhật tên
            await channel.setName(stat.name).catch(console.error);
        }
    }
}
client.login(process.env.TOKEN);
