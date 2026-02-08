# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| 0.0.x   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to **security@lexa.digital**.

Include the following information:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

You can expect:
- **Initial response**: Within 48 hours acknowledging receipt
- **Status updates**: Every 5-7 days until resolution
- **Resolution timeline**: Critical issues within 7 days, others within 30 days

If the vulnerability is accepted, we will:
- Work with you to understand and validate the issue
- Develop and test a fix
- Credit you in the release notes (unless you prefer to remain anonymous)

If declined, we will explain why the reported issue does not constitute a security vulnerability.

## Security Model

### Architecture Overview

MojiDoodle is a client-side web application with minimal server interaction:

- **Frontend**: Static files hosted on GitHub Pages
- **Data Storage**: All user data stored locally in browser (IndexedDB)
- **External APIs**: Google Input Tools (handwriting recognition)
- **Optional**: Cloudflare Worker for anonymous data collection (opt-in only)

### What We Store Locally

- **User progress**: SRS card stages and unlock times
- **User UUID**: Randomly generated identifier (never sent to our servers unless data collection is enabled)
- **Settings**: User preferences (data collection opt-in status)

### Data Collection (Opt-In)

If users opt in to data collection:
- Handwriting strokes and recognition results are sent to our Cloudflare Worker
- Data is stored anonymously with hashed IP and User-Agent
- Used solely to improve segmentation algorithms
- Users can opt out at any time in Settings

**Data collection endpoint security:**
- CORS restricted to allowed origins (`https://lexa-b.github.io`, `https://app.mojidoodle.ai`, `https://dev.mojidoodle.ai`)
- Rate limited (60 requests/minute per IP)
- 1MB request size limit
- Input validation on all fields

### Third-Party Services

| Service | Purpose | Data Sent |
|---------|---------|-----------|
| Google Input Tools | Handwriting recognition | Stroke coordinates only (no user identifiers) |
| GitHub Pages | Hosting | Standard web analytics (GitHub's policy) |
| Cloudflare (opt-in) | Data collection | Strokes, canvas size, recognition results |

### What We Don't Do

- No user accounts or authentication
- No passwords or sensitive personal data
- No tracking cookies or third-party analytics
- No ads or ad networks
- No data sold to third parties

## Security Considerations for Contributors

### Client-Side Security

- All user data remains in the browser unless explicitly opted into data collection
- No secrets or API keys in client code (Google Input Tools is a public endpoint)
- Input sanitization for any user-provided content

### Worker Security

If modifying the Cloudflare Worker (`worker/`):
- Maintain CORS restrictions
- Keep rate limiting in place
- Validate all input fields
- Never log or store raw IP addresses (hash only)
- Never store personally identifiable information
