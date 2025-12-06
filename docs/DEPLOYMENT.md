# Deployment Guide — Crisis Compass API

This guide walks through deploying the Crisis Compass backend API to production.

## Option 1: Heroku (Simplest for Getting Started)

### Prerequisites
- Heroku account (free tier available)
- Heroku CLI installed
- Git repository

### Steps

1. **Create Heroku app:**
   ```bash
   heroku login
   heroku create crisis-compass-api
   ```

2. **Add environment variables:**
   ```bash
   heroku config:set SAMHSA_API_KEY=your_key
   heroku config:set HUD_API_KEY=your_key
   ```

3. **Create Procfile** (if not exists):
   ```
   web: node backend/server.js
   worker: node backend/etl.js
   ```

4. **Deploy:**
   ```bash
   git push heroku main
   ```

5. **Test:**
   ```bash
   curl https://your-app.herokuapp.com/api/health
   ```

---

## Option 2: Railway.app (Modern Alternative)

Railway is faster and more developer-friendly than Heroku.

### Steps

1. **Push to GitHub** (if not already)

2. **Connect to Railway:**
   - Go to https://railway.app
   - Connect GitHub
   - Select Crisis Compass repo
   - Railway auto-detects Node.js

3. **Add environment variables:**
   - Dashboard → Variables
   - Add `SAMHSA_API_KEY`, `HUD_API_KEY`

4. **Deploy:**
   - Railway auto-deploys on git push
   - Auto-generates domain (e.g., crisis-compass-api-production.up.railway.app)

5. **Test:**
   ```bash
   curl https://your-railway-domain.up.railway.app/api/health
   ```

---

## Option 3: AWS (Scalable Production Setup)

### Using Elastic Beanstalk

1. **Install EB CLI:**
   ```bash
   pip install awsebcli
   ```

2. **Initialize:**
   ```bash
   eb init -p node.js-18 crisis-compass
   eb create production
   ```

3. **Deploy:**
   ```bash
   eb deploy
   ```

---

## Option 4: Self-Hosted (VPS)

### On a Linux VPS (Ubuntu 24.04)

1. **SSH into server:**
   ```bash
   ssh root@your-ip
   ```

2. **Install Node.js:**
   ```bash
   curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone repository:**
   ```bash
   cd /opt
   git clone https://github.com/YOUR-USERNAME/Crisis_Compass.git
   cd Crisis_Compass
   npm install
   ```

4. **Set environment variables:**
   ```bash
   export SAMHSA_API_KEY=your_key
   export HUD_API_KEY=your_key
   export PORT=3000
   ```

5. **Run with PM2 (process manager):**
   ```bash
   npm install -g pm2
   pm2 start backend/server.js --name "crisis-compass-api"
   pm2 save
   pm2 startup
   ```

6. **Set up Nginx reverse proxy:**
   ```bash
   sudo apt-get install nginx
   sudo nano /etc/nginx/sites-available/default
   ```

   Add:
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;

     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

7. **Enable HTTPS with Let's Encrypt:**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## GitHub Actions Auto-Deployment

Add to `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: "crisis-compass-api"
          heroku_email: ${{ secrets.HEROKU_EMAIL }}
```

---

## Monitoring & Logs

### Heroku
```bash
heroku logs --tail
```

### Railway
```bash
# Logs visible in dashboard
```

### VPS with PM2
```bash
pm2 logs crisis-compass-api
pm2 monit
```

---

## Database Setup (Optional)

For production data persistence, use PostgreSQL:

### Heroku
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

### Railway
Add PostgreSQL addon from dashboard

### Self-Hosted
```bash
sudo apt-get install postgresql postgis
```

Then update `backend/server.js` to use database instead of JSON file.

---

## Frontend Integration

Update `index.html` to point to live API:

```html
<script>
  window.CRISIS_COMPASS_CONFIG = {
    apiEndpoint: 'https://your-api-domain.com/api/resources'
  };
</script>
<script src="backend/data-loader.js"></script>
```

---

## Testing

```bash
# Test health endpoint
curl https://your-domain/api/health

# Test search
curl "https://your-domain/api/resources?search=shelter&limit=5"

# Test geolocation search
curl "https://your-domain/api/resources?lat=39.78&lon=-89.65&radius=50&type=shelter"
```

---

## Cost Estimates

| Platform | Cost |
|----------|------|
| **Heroku** | $7–50/month |
| **Railway** | $5–100/month |
| **AWS EB** | $10–100/month |
| **VPS (Linode)** | $5–20/month |

---

## Next Steps

1. Choose deployment platform
2. Set up API keys (SAMHSA, HUD)
3. Deploy backend
4. Update frontend to consume API
5. Test live integration
6. Set up automated ETL via GitHub Actions
7. Monitor logs and performance

---

## Support

- **Heroku Docs:** https://devcenter.heroku.com
- **Railway Docs:** https://docs.railway.app
- **AWS EB Docs:** https://docs.aws.amazon.com/elasticbeanstalk
