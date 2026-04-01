# 🤖 Telegram Bot Controller (PC WSS)

Bot Telegram untuk mengontrol client (PC) secara real-time menggunakan WebSocket + HTTP API.

---

## 🚀 Fitur

* 📡 Kontrol client via Telegram
* 🖥 Monitoring client online/offline
* 🎥 Live screen streaming (viewer)
* 📢 Broadcast message ke semua client
* ⚡ Remote command:

  * Shutdown
  * Restart
  * Sleep
  * Send Message
  * Change Wallpaper
* 🌐 HTTP API endpoint untuk kontrol manual
* 💾 Integrasi database (status client)

---

## 🛠 Tech Stack

* Node.js
* WebSocket (`ws`)
* Telegram Bot API (`node-telegram-bot-api`)
* MySQL (atau compatible DB)
* HTTP Server (native)

---

## 📦 Instalasi

```bash
git clone https://github.com/chaerul24/server-for-bot-telegram.git
mv server-for-bot-telegram server
cd server
npm install
```

---

## ⚙️ Konfigurasi

Buat file `.env`:

```env
BOT_TOKEN=ISI_TOKEN_BOT_KAMU
```

⚠️ **JANGAN PERNAH upload token ke GitHub!**

---

## ▶️ Jalankan Server

```bash
node index.js
```

Server akan berjalan di:

```
http://0.0.0.0:9575
```

---

## 🤖 Command Telegram

| Command           | Fungsi                |
| ----------------- | --------------------- |
| /start            | Aktivasi bot          |
| /help             | List command          |
| /client           | List client online    |
| /live             | Link viewer           |
| /msg <id> <text>  | Kirim pesan ke client |
| /broadcast <text> | Kirim ke semua client |
| /shutdown <id>    | Matikan PC            |
| /restart <id>     | Restart PC            |
| /sleep <id>       | Sleep PC              |
| /wallpaper <id>   | Request wallpaper     |

---

## 🌐 HTTP API

### Kirim pesan

```
/msg?id=CLIENT_ID&text=Halo
```

### Shutdown

```
/shutdown?id=CLIENT_ID
```

### Restart

```
/restart?id=CLIENT_ID
```

### Sleep

```
/sleep?id=CLIENT_ID
```

### Live link

```
/live
```

---

## 🖥 Client System

Client akan:

* Connect via WebSocket
* Register dengan hostname
* Kirim data screen (stream)
* Menerima command dari server

---

## 🔒 Security (WAJIB DIBACA)

* Jangan expose BOT_TOKEN
* Gunakan `.env`
* Jangan commit file config sensitif
* Gunakan `.gitignore`:

```
.env
node_modules
```

---

## ⚠️ Disclaimer

Project ini dibuat untuk:

* Edukasi
* Monitoring pribadi
* Remote management device sendiri

❌ DILARANG digunakan untuk:

* Akses ilegal
* Spying tanpa izin
* Aktivitas melanggar hukum

---

## 👨‍💻 Author

* GitHub: https://github.com/USERNAME

---

## ⭐ Support

Kalau project ini membantu, jangan lupa ⭐ repo ini!
