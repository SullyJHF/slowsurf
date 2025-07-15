# SlowSurf Deployment

This directory contains the Docker setup for hosting the SlowSurf privacy policy at https://slowsurf.solvy.dev/privacy.

## Files

- `Dockerfile` - Docker container configuration
- `docker-compose.yml` - Docker Compose setup with Traefik labels
- `nginx.conf` - Nginx configuration with redirect and security headers
- `index.html` - Simple homepage (redirects to /privacy)
- `404.html` - Custom 404 error page
- `deploy.sh` - Deployment script
- `.github/workflows/deploy.yml` - GitHub Actions workflow for automated deployment

## Features

- **Automatic redirect**: Root path (/) redirects to /privacy
- **Security headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **SSL/TLS**: Handled by Traefik with Let's Encrypt
- **Health check**: Available at /health endpoint
- **Error handling**: Custom 404 page

## Local Development

```bash
# Build and run locally
docker-compose up --build

# Test endpoints
curl http://localhost:8080/health
curl -I http://localhost:8080/  # Should show 301 redirect
curl http://localhost:8080/privacy
```

## Deployment

### Manual Deployment

```bash
./deploy.sh
```

### Automated Deployment

Pushes to main branch automatically deploy via GitHub Actions when these files change:
- `PRIVACY_POLICY.html`
- `index.html`
- `404.html`
- `nginx.conf`
- `Dockerfile`
- `docker-compose.yml`
- `deploy.sh`
- `.github/workflows/deploy.yml`

### Required GitHub Secrets

- `SSH_PRIVATE_KEY`: SSH private key for server access
- `SERVER_HOST`: Server hostname
- `SERVER_USER`: SSH username

## URLs

- **Website**: https://slowsurf.solvy.dev (redirects to /privacy)
- **Privacy Policy**: https://slowsurf.solvy.dev/privacy
- **Health Check**: https://slowsurf.solvy.dev/health

## Server Requirements

- Docker and Docker Compose installed
- Traefik reverse proxy running with a network named `traefik`
- DNS A record pointing `slowsurf.solvy.dev` to your server
- SSL certificates managed by Traefik/Let's Encrypt
- External `traefik` network for Traefik communication

## Initial Server Setup

1. Clone the repository on the server:
   ```bash
   git clone https://github.com/SullyJHF/slowsurf.git ~/slowsurf
   cd ~/slowsurf
   ```

2. Make the deploy script executable:
   ```bash
   chmod +x deploy.sh
   ```

3. Run the initial deployment:
   ```bash
   ./deploy.sh
   ```

## Traefik Configuration

This setup assumes:
- Traefik is configured with entrypoints `web` (80) and `websecure` (443)
- Let's Encrypt resolver named `myresolver` is configured
- External Docker network named `traefik` exists