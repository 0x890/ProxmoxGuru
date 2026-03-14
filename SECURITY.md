# Security Policy

ProxmoxGuru handles credentials for Proxmox VE infrastructure. We take security seriously. This document describes how to report vulnerabilities and how ProxmoxGuru protects your credentials.

---

## Supported Versions

Only the latest released version of ProxmoxGuru receives security fixes. We do not backport security patches to older versions.

| Version | Supported |
|---------|-----------|
| Latest release | Yes |
| Previous releases | No — please upgrade |

---

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Public disclosure before a fix is available puts all ProxmoxGuru users at risk. Instead, use private disclosure:

### How to Report

Send a private vulnerability report through one of these channels:

1. **GitHub Private Security Advisory (preferred):**
   Go to [Security → Report a vulnerability](https://github.com/proxmoxguru/proxmoxguru/security/advisories/new) on the repository page. This is end-to-end private and allows collaborative drafting of the advisory.

2. **Email:**
   Send a detailed report to `security@proxmoxguru.dev` (PGP key available on the GitHub security page if you need encrypted communication).

### What to Include in Your Report

A good report helps us reproduce and fix the issue quickly:

- **Description:** A clear explanation of the vulnerability, including the security impact (e.g., "an attacker with local access to the machine can extract stored credentials from electron-store")
- **Affected component:** Which file or subsystem is involved (e.g., `electron/main.ts`, IPC channel `proxmox:get-nodes`, credential storage)
- **Steps to reproduce:** Exact steps, commands, or code to trigger the vulnerability
- **Proof of concept:** If you have a PoC exploit or test case, include it (this significantly speeds up triage)
- **Suggested fix:** If you have a fix in mind, describe it — we welcome this but it's not required
- **Your environment:** OS, app version, Node.js version

### What Happens After You Report

1. **Acknowledgment:** We will acknowledge receipt of your report within **72 hours**.
2. **Triage:** We will assess the severity and scope within **7 days** and communicate our findings to you.
3. **Fix development:** For confirmed vulnerabilities, we will develop and test a fix. Timeline depends on severity:
   - Critical / High: target fix within **14 days**
   - Medium: target fix within **30 days**
   - Low: included in the next scheduled release
4. **Coordinated disclosure:** We will notify you before publishing any public advisory and credit you in the release notes unless you prefer to remain anonymous.
5. **Release:** A patched release will be published with a GitHub Security Advisory.

We ask that you give us a reasonable window to address the issue before any public disclosure. We commit to working with you in good faith.

---

## Security Best Practices for Users

### Use API Tokens Instead of Passwords

Proxmox API tokens are the recommended authentication method for ProxmoxGuru:

- Tokens can be scoped to specific permissions (e.g., read-only monitoring)
- Tokens can be revoked independently of your account password
- A compromised token does not expose your Proxmox account password
- Tokens can be limited to specific paths in the Proxmox API

To create a scoped read-only monitoring token:
1. Go to **Datacenter → API Tokens → Add** in the Proxmox web UI
2. Assign the `PVEAuditor` role on `/` (full datacenter, read-only)
3. Enable "Privilege Separation" to enforce the role restriction
4. Copy the secret — it is shown only once

For management (power actions, etc.), add the appropriate roles (`VM.PowerMgmt`, `VM.Allocate`, etc.) as needed rather than granting `Administrator`.

### SSL / TLS Verification

ProxmoxGuru supports toggling SSL certificate verification per server. The settings:

- **Verify SSL (recommended for production):** ProxmoxGuru validates the Proxmox server's TLS certificate against the system CA store. If your Proxmox instance has a valid certificate from Let's Encrypt or your organization's CA, keep this enabled.
- **Disable SSL verification (use only for lab/homelab with self-signed certs):** Disabling verification exposes you to man-in-the-middle attacks on untrusted networks. Only disable this on networks you fully control.

For a production Proxmox setup, configure a valid TLS certificate. Proxmox supports Let's Encrypt via `pvenode acme cert order` or custom certificates via the UI.

### Credential Storage

ProxmoxGuru stores server credentials using [electron-store](https://github.com/sindresorhus/electron-store) with encryption enabled. Specifically:

- Credentials are stored in the OS user data directory (e.g., `~/Library/Application Support/ProxmoxGuru/` on macOS)
- The store is encrypted using the system keychain / OS credential manager as the encryption key source
- Credentials are **never** transmitted to any third party — all Proxmox API calls are made directly from your machine to your Proxmox server
- The renderer process (React UI) **never** receives raw credentials. Only the Electron main process holds and uses credentials via IPC

### Network Security

- ProxmoxGuru communicates exclusively with the Proxmox hosts you configure. It does not phone home, send telemetry, or connect to any external service.
- Proxmox API calls are made over HTTPS (port 8006 by default). HTTP is not supported.
- If you access Proxmox over a public network, use a VPN or SSH tunnel rather than exposing port 8006 to the internet.

### Least Privilege

Follow the principle of least privilege for API tokens:
- If you only need monitoring, use a read-only token
- If you need VM power management, grant only `VM.PowerMgmt`
- Avoid using `root@pam` with full privileges unless necessary

### Local Machine Security

Because credentials are stored on disk (encrypted), the security of your Proxmox credentials depends in part on your local machine's security:
- Use full-disk encryption (FileVault on macOS, BitLocker on Windows)
- Lock your machine when unattended
- Do not run ProxmoxGuru as root / Administrator

---

## Scope

The following are **in scope** for security reports:

- Credential theft or exposure via any vector (IPC, storage, memory)
- Remote code execution via malicious Proxmox API responses
- Privilege escalation within the Electron process model
- XSS in the renderer that could affect IPC communication
- Insecure defaults that compromise security in typical usage

The following are **out of scope**:

- Vulnerabilities in Proxmox VE itself — report these to the [Proxmox Security team](https://www.proxmox.com/en/security)
- Vulnerabilities in Electron that are already publicly known and tracked upstream
- Attacks that require physical access to an already-unlocked machine where the attacker has the same OS user privileges
- Denial of service against the app itself (crashing the UI) with no security impact

---

Thank you for helping keep ProxmoxGuru and its users secure.
