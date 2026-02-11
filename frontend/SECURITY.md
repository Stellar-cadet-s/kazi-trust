# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

**DO NOT** create public GitHub issues for security vulnerabilities.

### How to Report

Email security concerns to: security@trustwork.example.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **24 hours**: Initial acknowledgment
- **7 days**: Detailed response with assessment
- **30 days**: Fix deployed (for confirmed vulnerabilities)

## Security Best Practices

### Frontend Security

- ✅ No sensitive data in frontend code
- ✅ No API keys or credentials in code
- ✅ Use environment variables for configuration
- ✅ Validate all user input
- ✅ Use HTTPS in production
- ✅ Implement CSRF protection
- ✅ Sanitize user-generated content

### What Frontend Does NOT Handle

- ❌ Private keys or secrets
- ❌ Stellar transaction signing
- ❌ Escrow logic
- ❌ Payment processing
- ❌ Sensitive business logic

All sensitive operations are server-side only.

### Dependencies

- Regular updates via `npm audit`
- Review security advisories
- Use lock files (package-lock.json)

### Environment Variables

Never commit:
- `.env.local`
- `.env.production`
- Any file containing secrets

Always commit:
- `.env.example` (template only)

## Disclosure Policy

We follow responsible disclosure:
1. Report received
2. Vulnerability confirmed
3. Fix developed and tested
4. Fix deployed
5. Public disclosure (after fix)

## Security Updates

Security patches are released as soon as possible and announced via:
- GitHub Security Advisories
- Project changelog
- Email to contributors

## Contact

For security concerns: security@trustwork.example.com
