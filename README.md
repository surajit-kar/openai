# Keep Notes Clone

A lightweight Google Keep-inspired note-taking web app built with plain HTML, CSS, and JavaScript.

## Features

- Create notes with title/content
- Color picker for note backgrounds
- Pin/unpin notes into separate section
- Archive, delete, and duplicate notes
- Search notes instantly
- Local storage persistence

---

## How to download these files

You need these files:
- `index.html`
- `styles.css`
- `app.js`
- `README.md`

Choose any one method below.

### Method 1) Clone with Git (recommended)
```bash
git clone <YOUR_REPO_URL>
cd surajit-kar
```

### Method 2) Download ZIP from GitHub
1. Open your repository in browser.
2. Click **Code** → **Download ZIP**.
3. Extract the ZIP file.
4. Open the extracted folder.

### Method 3) Download only required files with `wget`
Replace `<RAW_BASE_URL>` with your raw-file base URL (for example: `https://raw.githubusercontent.com/<user>/<repo>/<branch>`).

```bash
mkdir keep-notes && cd keep-notes
wget <RAW_BASE_URL>/index.html
wget <RAW_BASE_URL>/styles.css
wget <RAW_BASE_URL>/app.js
wget <RAW_BASE_URL>/README.md
```

### Method 4) Copy from server to your local machine with `scp`
If files are already on a Linux server:

```bash
scp ubuntu@YOUR_SERVER_IP:/var/www/keep-notes/index.html .
scp ubuntu@YOUR_SERVER_IP:/var/www/keep-notes/styles.css .
scp ubuntu@YOUR_SERVER_IP:/var/www/keep-notes/app.js .
```

### Verify files were downloaded
```bash
ls -la
```
You should see `index.html`, `styles.css`, and `app.js`.

## Which server / OS should you use?

Because this is a static app (`index.html`, `styles.css`, `app.js`), you can host it on **any OS** that can run a web server.

Recommended options:

1. **Ubuntu Server + Nginx (best for production VPS/cloud VM)**
2. **Any OS + Python HTTP server (best for local testing/dev)**
3. **Any static hosting platform (Netlify, Vercel, GitHub Pages, Cloudflare Pages)**

If you want full control and your own server, use **Ubuntu 22.04/24.04 LTS + Nginx**.

---

## Step-by-step: Deploy on Ubuntu Server with Nginx (Production)

### 1) Create an Ubuntu server
- OS: **Ubuntu 22.04 LTS** or **Ubuntu 24.04 LTS**
- Minimum: 1 vCPU, 1 GB RAM is enough for this static app
- Open ports in firewall/security group: **22 (SSH), 80 (HTTP), 443 (HTTPS)**

### 2) SSH into server
```bash
ssh ubuntu@YOUR_SERVER_IP
```

### 3) Update system packages
```bash
sudo apt update
sudo apt upgrade -y
```

### 4) Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl status nginx
```

### 5) (Optional but recommended) Configure UFW firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### 6) Upload project files
From your local machine (inside the project folder):
```bash
scp -r index.html styles.css app.js ubuntu@YOUR_SERVER_IP:/tmp/keep-notes/
```

Then on server:
```bash
sudo mkdir -p /var/www/keep-notes
sudo cp -r /tmp/keep-notes/* /var/www/keep-notes/
```

### 7) Create Nginx site config
```bash
sudo nano /etc/nginx/sites-available/keep-notes
```

Paste:
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_SERVER_IP;

    root /var/www/keep-notes;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable config:
```bash
sudo ln -s /etc/nginx/sites-available/keep-notes /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Now open in browser:
- `http://YOUR_SERVER_IP`
- or `http://YOUR_DOMAIN`

---

## Step-by-step: Enable HTTPS with Let's Encrypt (Recommended)

### 1) Point domain DNS
Set your domain A record to your server IP.

### 2) Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 3) Request SSL certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 4) Verify auto-renew
```bash
sudo certbot renew --dry-run
```

Your app is now available on `https://yourdomain.com`.

---

## Step-by-step: Run locally (quick testing)

### Option A: Python server
```bash
python3 -m http.server 4173
```
Open `http://localhost:4173`.

### Option B: VS Code Live Server
- Open folder in VS Code
- Install **Live Server** extension
- Right click `index.html` → **Open with Live Server**

---

## Update workflow (after future changes)

1. Update files locally (`index.html`, `styles.css`, `app.js`)
2. Re-upload files:
   ```bash
   scp -r index.html styles.css app.js ubuntu@YOUR_SERVER_IP:/tmp/keep-notes/
   ```
3. Copy into web root on server:
   ```bash
   sudo cp -r /tmp/keep-notes/* /var/www/keep-notes/
   sudo nginx -t && sudo systemctl reload nginx
   ```
4. Hard refresh browser (`Ctrl+Shift+R`)

---

## Troubleshooting

- **403/404 from Nginx**
  - Check root path in config: `/var/www/keep-notes`
  - Validate config: `sudo nginx -t`
- **Permission issue**
  - Ensure files are readable:
    ```bash
    sudo chown -R www-data:www-data /var/www/keep-notes
    sudo find /var/www/keep-notes -type d -exec chmod 755 {} \;
    sudo find /var/www/keep-notes -type f -exec chmod 644 {} \;
    ```
- **Domain works but HTTPS fails**
  - Confirm DNS is pointing correctly
  - Re-run certbot command

---

## Tech stack
- HTML5
- CSS3
- Vanilla JavaScript
- LocalStorage (client-side persistence)
