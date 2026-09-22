# Security Policy

## Reporting a Vulnerability

Arena Africa takes security seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report

**Do NOT** open a public GitHub issue for security vulnerabilities.

Instead, please report security vulnerabilities by emailing:

📧 **security@arena.africa** (or substitute with your actual security contact)

### What to Include

Please include as much of the following information as possible:

- **Type of vulnerability** (e.g., IDOR, XSS, SQL injection, authentication bypass)
- **Affected component** (API endpoint, page route, function name)
- **Steps to reproduce** — detailed, step-by-step instructions
- **Proof of concept** (code, screenshots, or video)
- **Impact assessment** — what an attacker could achieve
- **Suggested remediation** (if you have one)

### Response Timeline

- **Initial Response**: Within 48 hours of report
- **Triage & Assessment**: Within 5 business days
- **Fix Timeline**: Based on severity:
  - Critical: 7 days
  - High: 14 days
  - Medium: 30 days
  - Low: 90 days

### Disclosure Policy

We follow **coordinated disclosure**:

1. You report the vulnerability privately
2. We acknowledge and begin investigation
3. We develop and test a fix
4. We deploy the fix to production
5. We publicly disclose the vulnerability (with credit to you, if desired)
6. Typical timeline: 90 days from initial report to public disclosure

### Scope

**In Scope:**
- API endpoints (`/api/*`)
- Authentication & authorization bypass
- Policy engine circumvention
- SQL injection, XSS, CSRF
- Business logic flaws (IDOR, race conditions)
- Rate limit bypasses
- Mobile money simulation exploits

**Out of Scope:**
- Social engineering attacks
- Physical attacks
- DoS/DDoS attacks
- Issues in third-party dependencies (report to the maintainer)
- Already-documented limitations (see below)

### Known Limitations (Not Vulnerabilities)

This is a **demonstration platform** with simulated financial features:

1. ❌ **No real money movement** — mobile money and card payments are simulated
2. ❌ **PIN authentication not wired** — demo mode uses profile selection
3. ❌ **USSD is simulated** — no real telco shortcode integration
4. ❌ **Hardcoded exchange rates** — not fetched from live APIs
5. ❌ **No service worker** — PWA offline mode not implemented
6. ❌ **Gemini API degrades gracefully** — AI features use heuristics when key absent

**These are architectural choices for a demo, not security bugs.**

Before reporting, check `docs/NIST_CSF_GAP_ANALYSIS.md` for documented gaps.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest main branch | ✅ Yes |
| Older commits | ❌ No (demo only) |

## Security Features

✅ **Implemented:**
- HMAC-SHA256 token authentication
- Scrypt PIN hashing (framework ready)
- RBAC + KYC tier policy engine
- Rate limiting (60/min GET, 20/min POST)
- Security headers (CSP, HSTS, X-Frame-Options)
- IDOR protection in Server Actions
- SQL injection protection (parameterized queries via Drizzle ORM)
- Transaction atomicity wrappers
- Audit trail for policy decisions

⚠️ **Partially Implemented:**
- Multi-factor authentication (PIN hash field exists, not enforced)
- Input validation (some endpoints lack strict schemas)
- CSRF tokens (relies on SameSite cookies)

❌ **Not Implemented (Demo Limitations):**
- Database encryption at rest
- Real mobile money API integration
- Automated anomaly detection
- Production monitoring/alerting

## Security Contacts

- **Email**: security@arena.africa
- **Response Time**: 48 hours
- **PGP Key**: [If applicable]

## Hall of Fame

We recognize security researchers who help us improve:

- [Researcher Name] - [Vulnerability Type] - [Date]

*Be the first to help us secure Arena Africa!*

---

**Last Updated**: 2026-09-16
