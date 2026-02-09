# Vulnerability Reporting Guide

This guide explains how to send encrypted vulnerability reports and verify our responses using GPG.

## For Reporter

### 1. Get Xyber Public Key

Before sending encrypted reports, add our public key to your keyring:

```bash
# From keyserver (recommended)
gpg --keyserver keys.openpgp.org --recv-keys 86B13B5B33BEE45A4FBFD22887034BF0A24D1A22

# Or from file
gpg --import security.pub.asc
```

Verify the fingerprint matches:

```
86B1 3B5B 33BE E45A 4FBF  D228 8703 4BF0 A24D 1A22
```

### 2. Encrypt Your Report

```bash
# Create your report
cat > vulnerability-report.txt << 'EOF'
VULNERABILITY REPORT

Repository: onchain-xyber-points
Severity: [Critical/High/Medium/Low]
Summary: [Brief description]

Details:
[Detailed description of the vulnerability]

Steps to Reproduce:
1. ...
2. ...

Proof of Concept:
[Code or steps]

Your GitHub username: [for security advisory collaboration]
EOF

# Encrypt for Xyber
gpg --armor --encrypt --recipient security@xyber.inc vulnerability-report.txt

# Result: vulnerability-report.txt.asc (send this file)
```

Send the encrypted `.asc` file to **security@xyber.inc** or via Discord.

### 3. Verify Our Response

When we respond with a signed message:

```bash
# Verify signature and read content
gpg --decrypt response.txt.asc
```

Expected output:
```
gpg: Signature made [date] using EDDSA key [ID]
gpg: Good signature from "Xyber Security Team <security@xyber.inc>"

[Message content here]
```

### Key Locations

Verify our public key from multiple sources:

- Repository: [security.pub.asc](./security.pub.asc)
- GitHub raw: https://raw.githubusercontent.com/Xyber-Labs/onchain-xyber-points/mainnet/security.pub.asc
- Keyserver: `gpg --keyserver keys.openpgp.org --recv-keys 86B13B5B33BEE45A4FBFD22887034BF0A24D1A22`
- Website: https://xyber.inc/security/security.pub.asc

## For Xyber Team

### Decrypt Incoming Report

```bash
gpg --decrypt vulnerability-report.txt.asc
# or save to file
gpg --output report.txt --decrypt vulnerability-report.txt.asc
```

### Sign Outgoing Response

```bash
# Create response
cat > response.txt << 'EOF'
Thank you for your report. We have confirmed the vulnerability.
Expected fix timeline: [X] days.

Xyber Security Team
EOF

# Sign (readable but authenticated)
gpg --armor --clearsign --local-user security@xyber.inc response.txt
# Result: response.txt.asc
```

### Import Shared Private Key

```bash
# Import from secure backup
gpg --import xyber-security-PRIVATE.asc

# Verify import
gpg --list-secret-keys security@xyber.inc
```

---

**Questions?** Contact us at security@xyber.inc or via [Discord](https://discord.com/channels/1352248408634687623/1352275383524790332)
