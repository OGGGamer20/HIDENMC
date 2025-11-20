// ==================== IMPORTS ====================
const {
    Client,
    GatewayIntentBits,
    Partials,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    PermissionsBitField,
    ChannelType
} = require("discord.js");
const util = require("minecraft-server-util");
require("dotenv").config();

// ==================== CLIENT ====================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

// ==================== CONFIG ====================
const TOKEN = process.env.TOKEN;
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
const LOGO_URL = "https://discord.com/channels/1406103800208687196/1433693841768190004/1441079094161707029";
const BANNER_URL = process.env.BANNER_URL || null;
const MC_IP = "play.hidenmc.qzz.io";
const MC_PORT = 25501;
const TRANSCRIPT_CHANNEL_ID = "1428387638158692485";

// In-memory claim counts
const staffClaims = new Map();
function adjustClaimCount(staffId, delta) {
    const prev = staffClaims.get(staffId) || 0;
    const next = Math.max(0, prev + delta);
    if (next === 0) staffClaims.delete(staffId);
    else staffClaims.set(staffId, next);
}
function parseClaimerIdFromTopic(topic) {
    if (!topic) return null;
    const m = topic.match(/\((\d+)\)\s*$/);
    return m ? m[1] : null;
}

// ==================== READY ====================
client.once("ready", async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    client.user.setPresence({
        activities: [{ name: "Made by OGG", type: 0 }],
        status: "online"
    });

    const logChannelId = "1428387626460778558";
    try {
        const logChannel = await client.channels.fetch(logChannelId);
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setTitle("<:accept:1413801088112394250> Bot is Active")
                .setDescription("The ticket bot is now **online** and ready to use.\n\nMade by OGG GAMER 💻")
                .setColor("Orange")
                .setThumbnail(client.user.displayAvatarURL())
                .setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
    } catch (err) {
        console.error("Failed to send ready log:", err);
    }
});

// ==================== MESSAGE COMMANDS ====================
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const msg = message.content.toLowerCase();

    // ---- STATUS ----
    if (msg === "~status") {
        try {
            const result = await util.status(MC_IP, MC_PORT, { timeout: 5000 });
            const embed = new EmbedBuilder()
                .setTitle("🎮 Hiden MC  Status")
                .setColor("Orange")
                .addFields(
                    { name: "✅ Status", value: "Online", inline: true },
                    { name: "🌐 IP", value: MC_IP, inline: true },
                    { name: "👥 Players", value: `${result.players.online} / ${result.players.max}`, inline: true },
                    { name: "🛠 Version", value: result.version.name || "Unknown", inline: true },
                    { name: "💬 MOTD", value: (result.motd?.clean || "No MOTD").replace(/§./g, ""), inline: false }
                )
                .setFooter({ text: "Hiden MC  • Made by OGG" })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error("STATUS ERROR:", err);
            return message.channel.send("⚠️ Unable to fetch server status. Please try again later.");
        }
    }

    // ---- TICKET PANEL ----
    if (msg === "~ticketpanel") {
        const embed = new EmbedBuilder()
            .setTitle("🎫 Hiden MC | Support")
            .setDescription(
`Need help? Choose an option below to open a ticket.
Each user may have 1 active ticket. Once your issue is resolved, you can close it.

🛠 Support — General help
💸 Purchase — Store / payment help
🚨 Report — Report cheaters or bugs
🧾 Appeal — Punishment appeals`
            )
            .setColor("Orange")
            .setThumbnail(LOGO_URL);
        if (BANNER_URL) embed.setImage(BANNER_URL);

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("ticket_menu")
                .setPlaceholder("Select a ticket type")
                .addOptions([
                    { label: "Support", value: "support", description: "General help", emoji: "🛠" },
                    { label: "Purchase", value: "purchase", description: "Store / payment help", emoji: "💸" },
                    { label: "Report", value: "report", description: "Report cheaters or bugs", emoji: "🚨" },
                    { label: "Appeal", value: "appeal", description: "Punishment appeals", emoji: "🧾" }
                ])
        );

        return message.channel.send({ embeds: [embed], components: [row] });
    }

    // ---- RULES ----
    if (msg === "~rules") {
        const embed = new EmbedBuilder()
            .setTitle(" # Hiden MC • Rules")
            .setColor("Orange")
            .setThumbnail(LOGO_URL)
            .setDescription(
`<:blocky_java:1426214091210625175>  **Minecraft Rules**

1. **No Hacks / Cheats** – X-Ray, KillAura, or any client mods = PERMA BAN.
2. **No Cross-Teaming** – You can ally, but betrayal or teaming in events is NOT allowed.
3. **No Dupes / Exploits** – Report bugs immediately; abusing = wipe + ban.
4. **No Combat Logging** – Don’t leave to avoid death or losing hearts.
5. **No Spawn Killing / Trapping** – Give new players a fair chance.
6. **No Lag Machines / Redstone Spam** – Keep server performance stable.
7. **No Inappropriate Builds / Skins / Names.**
8. **Respect Staff & Players** – No toxicity, hate, or personal attacks.
9. **Heart Trading** – Allowed only if both sides agree (no scams).
10. **Use Common Sense** – If it feels unfair, it probably is.

### <:discord:1426189322142617681>  **Discord Rules**

1. **Be Respectful** – No harassment, hate speech, or drama.
2. **No NSFW / Political / Religious content.**
3. **No Spamming / Flooding / Caps abuse.**
4. **No Self-Promotion or Advertising** without permission.
5. **Listen to Staff** – Their decisions are final.
6. **Follow Discord’s ToS & Hiden MC Guidelines.**

### <:barrier:1426201503173185627>  **Punishments**

Rule breaks = **Mute / Kick / Ban / Heart Reset** depending on severity.
Play fair, respect others, and **enjoy the Lifesteal experience!**`
            )
            .setFooter({ text: "Hiden MC • Follow the rules to stay safe!" })
            .setTimestamp();

        return message.channel.send({ embeds: [embed] });
    }

// ---- INFO ----
if (msg === "~info") {
    const embed = new EmbedBuilder()
        .setTitle("<a:bowarrow:1439270777261396019> Hiden MC | INFORMATION <a:bowarrow:1439270777261396019>")
        .setColor("Orange")
        .setDescription(
`Welcome to hidenMc, this channel contains all the helpful information you'll require! If you need further help, please contact our team via tickets!

### <a:Fire:1439270925546557491> __IMPORTANT__
> <a:book:1426506951424086087> Visit <#1423996437557018766> for rules
> <:emoji_35:1426506816543522859> Visit <#1428426035539742873> for store & info

### <:pixelhearts:1439270996992327720> __NEED SUPPORT?__
> Open a ticket in <#1428426035539742873> <a:blocks:1426506556031238156>

### <a:report:1439271095776706614>   __APPLY FOR STAFF__
> See <#1428387603396169863>

<a:party:1439271171190292490> **Join now! \`PLAY.HIDENMC.QZZ.IO\` | \`25501\`**`
        )
        .setThumbnail(LOGO_URL)
        .setImage(BANNER_URL || null)
        .setFooter({ text: "Hiden MC • Made by OGG Gamer" })
        .setTimestamp();
    return message.channel.send({ embeds: [embed] });
}

    // ---- MEDIA ----
    if (msg === "~media") {
        const embed = new EmbedBuilder()
            .setTitle("<:Youtube:1436756487690125352> Youtuber Rank Requirements")
            .setColor("Orange")
            .setThumbnail(LOGO_URL)
            .setDescription(
`<:star_mc:1436756140674256957> **SMOL**
• YouTube/Shorts: 500+ subscribers
• Avg views: 100+ per long video / 300+ per short
• At least 1 video on our server
• Must be active in Discord

<:star_mc:1436756140674256957> **MEDIA**
• YouTube/Shorts: 1k+ subscribers
• Avg views: 200+ per long video / 600+ per short
• 2+ videos on server weekly
• Good quality (720p+)

<:star_mc:1436756140674256957> **Media+**
• YouTube/Shorts: 20k+ subscribers
• Avg views: 500+ per long video / 1k+ per short
• 4+ videos on server weekly
• Must positively represent Hiden Network`
            )
            .setFooter({ text: "Hiden MC • Youtuber Requirements" })
            .setTimestamp();
        return message.channel.send({ embeds: [embed] });
    }

    // ---- STAFF ----
    if (msg === "~staff") {
        const embed = new EmbedBuilder()
            .setTitle("📋 Staff Application")
            .setColor("Orange")
            .setDescription(
`<:star_mc:1436756140674256957> **Basic Info**
• Minecraft IGN?
• Discord tag?
• Timezone?
• Age?

<:star_mc:1436756140674256957> **Availability**
• Hours you can contribute?
• Any unavailable times?

<:star_mc:1436756140674256957> **Experience & Skills**
• Previous staff experience?
• Skills/tools (plugins, bots, panels)?

<:star_mc:1436756140674256957> **Scenario-Based**
• Player accuses someone of hacking with no proof — what do you do?
• Two players argue with offensive language — how do you handle it?

<:star_mc:1436756140674256957> **Final**
• Are you staff on any other servers?
• Anything else we should know?`
            )
            .setFooter({ text: "Hiden MC • Staff Application" })
            .setTimestamp();
        return message.channel.send({ embeds: [embed] });
    }

// ---- IP COMMAND ----
if (msg === "ip") {
    const embed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle("HIDEN MC • HOW TO JOIN")
        .setThumbnail(LOGO_URL)
        .setDescription(
`# <a:vulcan_earthgif:1439275000707289128> Java Edition (Computer/PC)

**__Steps to Follow:__**
> • Launch Minecraft
> • Click Multiplayer
> • Click Add Server
> • Server Address: \`play.hidenmc.qzz.io\`
> • Port: \`25501\`
> • Click Done and join!

# <:bedrock:1439275055912587264> PE / Bedrock (Mobile)

**__Steps to Follow:__**
> • Click Servers
> • Click Add Server
> • Server Name: Anything you like
> • Server Address: \`play.hidenmc.qzz.io\`
> • Port: \`25501\`
> • Click Save & Join

# <:vulcan_console:1439274944218402936> Consoles (PS / Xbox / Switch)

**__Steps to Follow:__**
> • Follow [Xbox, Playstation, and Switch Tutorial](https://youtu.be/E1bvCKyMrx8?si=N1nQnxf-vm0ofSUO)
> • Server Name: Anything you like
> • Server Address: \`play.hidenmc.qzz.io\`
> • Port: \`25501\``
        )
        .setFooter({ text: "discord.gg/hidenmc • Made by Orange" })
        .setTimestamp();
    return message.channel.send({ embeds: [embed] });
}
});

// ==================== TICKET INTERACTIONS ====================
const ticketCategories = {
    support: { name: "support", emoji: "🛠" },
    purchase: { name: "purchase", emoji: "💸" },
    report: { name: "report", emoji: "🚨" },
    appeal: { name: "appeal", emoji: "🧾" }
};

client.on("interactionCreate", async (interaction) => {
    if (interaction.isStringSelectMenu()) {
        const type = interaction.values[0];
        if (!ticketCategories[type]) return;

        const existing = interaction.guild.channels.cache.find(c => c.topic?.includes(interaction.user.id));
        if (existing) return interaction.reply({ content: `⚠️ You already have a ticket: ${existing}`, ephemeral: true });

        const ch = await interaction.guild.channels.create({
            name: `${type}-${interaction.user.username}`.toLowerCase().replace(/\s/g, "-"),
            type: ChannelType.GuildText,
            topic: `(Owner: ${interaction.user.id}) Ticket Type: ${type}`,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                { id: STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
            ]
        });

        await ch.send({ content: `🎫 <@${interaction.user.id}> your **${type}** ticket has been created! <@&${STAFF_ROLE_ID}> will assist you shortly.` });

        const embed = new EmbedBuilder()
            .setColor("Orange")
            .setDescription(`👋🏻 Hello <@${interaction.user.id}>\n\nOur staff team will shortly assist you.`)
            .setFooter({ text: "Hiden MC Ticket" })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("claim_ticket").setLabel("Claim").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("close_ticket").setLabel("Close").setStyle(ButtonStyle.Danger)
        );

        await ch.send({ embeds: [embed], components: [row] });
        return interaction.reply({ content: `✅ Your ticket has been created: ${ch}`, ephemeral: true });
    }

    if (interaction.isButton()) {
        if (!interaction.channel.topic?.includes("Ticket Type")) return;
        const logChannel = await client.channels.fetch(TRANSCRIPT_CHANNEL_ID);

        // CLAIM
        if (interaction.customId === "claim_ticket") {
            const claimerId = interaction.user.id;
            const embed = new EmbedBuilder()
                .setColor("Green")
                .setDescription(`✅ <@${claimerId}> has claimed this ticket.`)
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: "You claimed the ticket!", ephemeral: true });
        }

        // CLOSE
        if (interaction.customId === "close_ticket") {
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            const content = messages.map(m => `[${m.author.tag}] ${m.content}`).reverse().join("\n");
            const buffer = Buffer.from(content, "utf-8");

            const embed = new EmbedBuilder()
                .setTitle("📜 Ticket Transcript")
                .setDescription(`Ticket **${interaction.channel.name}** closed by <@${interaction.user.id}>`)
                .setColor("Orange")
                .setTimestamp();

            await logChannel.send({ embeds: [embed], files: [{ attachment: buffer, name: `${interaction.channel.name}.txt` }] });
            await interaction.channel.delete();
        }
    }
});

// ==================== LOGIN ====================
client.login(TOKEN);
