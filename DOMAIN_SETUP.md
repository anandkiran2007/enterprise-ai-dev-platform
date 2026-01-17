# 🌐 Domain Setup Guide

## Quick Answer: Where Will It Deploy?

**Right now**: Your local machine becomes the server  
**With domain**: Any cloud server (AWS, DigitalOcean, etc.)

---

## 🚀 Deployment Options

### Option 1: Local Production (No Domain Needed)
```bash
# Deploy on your machine for testing
./scripts/deploy_local.sh
```

**What you get:**
- Dashboard: `http://localhost:3001`
- API: `http://localhost:8000`
- Works with GitHub OAuth (localhost callback)

**Perfect for:**
- Testing the full system
- Development team sharing
- Client demonstrations

---

### Option 2: Get a Free Domain (5 minutes)

**Free Domain Providers:**
- **Freenom** (.tk, .ml, .ga, .cf) - Completely free
- **DuckDNS** (your-domain.duckdns.org) - Free dynamic DNS
- **No-IP** (your-domain.ddns.net) - Free tier available

**Quick Setup with Freenom:**
1. Go to [freenom.com](https://www.freenom.com)
2. Search for available domain (e.g., `my-aitech.tk`)
3. Register for free (12 months)
4. Point DNS to your server IP

---

### Option 3: Cheap Domain ($10/year)

**Recommended:**
- **Namecheap** - $1-10/year, great support
- **Cloudflare** - $10-15/year, built-in security
- **GoDaddy** - $12-20/year, popular choice

---

## 🏗️ Server Options

### Option A: Your Current Machine
```bash
# Your laptop/desktop becomes the server
./scripts/deploy_local.sh
```

**Pros:** Free, immediate, full control  
**Cons:** Must stay on, limited bandwidth

### Option B: Cloud Server (Recommended)
**Popular choices:**
- **DigitalOcean** - $6/month, 1GB RAM, 1 CPU
- **AWS EC2** - $3.50/month (t2.micro)
- **Vultr** - $6/month, 1GB RAM
- **Linode** - $5/month, 1GB RAM

**Setup process:**
1. Create account (DigitalOcean recommended)
2. Create droplet/server (Ubuntu 22.04)
3. Point domain to server IP
4. Run deployment script

---

## 🔧 Step-by-Step Production Setup

### Phase 1: Local Production (Today)
```bash
# 1. Deploy locally
./scripts/deploy_local.sh

# 2. Update GitHub OAuth
# Go to: https://github.com/settings/applications/new
# Callback: http://localhost:8000/api/auth/github/callback

# 3. Test everything
# Visit: http://localhost:3001
```

### Phase 2: Get Domain (Today)
```bash
# 1. Register free domain
# Go to freenom.com → find available domain

# 2. Point DNS to your IP
# A record: your-domain.tk → YOUR_IP_ADDRESS
```

### Phase 3: Cloud Server (When Ready)
```bash
# 1. Create cloud server
# DigitalOcean: $6/month Ubuntu droplet

# 2. Point domain to server
# Update DNS: your-domain.tk → SERVER_IP

# 3. Deploy to production
./scripts/deploy_production.sh
```

---

## 🎯 GitHub OAuth Setup

### For Local Testing
```
Homepage URL:        http://localhost:3001
Authorization callback: http://localhost:8000/api/auth/github/callback
```

### For Production (with domain)
```
Homepage URL:        https://your-domain.com
Authorization callback: https://your-domain.com/api/auth/github/callback
```

---

## 📋 Quick Start Checklist

### Today (No Domain Needed)
- [ ] Run `./scripts/deploy_local.sh`
- [ ] Create GitHub OAuth app with localhost callback
- [ ] Test OAuth flow
- [ ] Verify all features work

### When You Get Domain
- [ ] Register domain (freenom.com)
- [ ] Point DNS to your IP
- [ ] Update GitHub OAuth callback URL
- [ ] Deploy with `./scripts/deploy_production.sh`

### For Real Production
- [ ] Get cloud server ($6-10/month)
- [ ] Set up SSL certificate
- [ ] Configure domain DNS
- [ ] Deploy production stack

---

## 🚨 Important Notes

### Security
- **Local**: HTTP is fine for testing
- **Production**: HTTPS required (SSL certificate)
- **GitHub**: Requires HTTPS for production OAuth

### Performance
- **Local**: Limited by your internet connection
- **Cloud**: Professional bandwidth and uptime

### Cost
- **Local**: Free (but you pay for electricity)
- **Cloud**: $6-10/month for basic setup
- **Domain**: $0-15/year

---

## 🎮 Recommended Path

1. **Week 1**: Use `./scripts/deploy_local.sh` to test everything
2. **Week 2**: Get free domain from Freenom
3. **Week 3**: Move to cloud server if needed

This gives you a working system today while you plan your production setup!

---

## 🆘 Need Help?

**Domain Issues:**
- Freenom support: help@freenom.com
- Domain tutorials: youtube.com "freenom tutorial"

**Server Setup:**
- DigitalOcean tutorials: digitalocean.com/community/tutorials
- Ubuntu setup: ubuntu.com/tutorials

**Deployment Issues:**
- Check logs: `docker-compose logs -f`
- Health check: `curl http://localhost:8000/api/health`
- Restart: `docker-compose restart`

---

**Bottom Line:** You can deploy TODAY without a domain using the local production script!
