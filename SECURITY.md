# Security Policy

## Supported Versions

Currently, security updates are provided for the latest release version only.

| Version | Supported          |
| ------- | ------------------ |
| 0.11.x  | :white_check_mark: |
| < 0.11  | :x:                |

## Data Storage and Security

### API Keys and Credentials

**Freesound API Key (Phase 7.1+)**

The Sonigraph plugin stores API keys in **plain text** in your Obsidian vault's plugin data file:

- **Location**: `.obsidian/plugins/sonigraph/data.json`
- **Format**: Plain text (unencrypted)
- **Visibility**: Readable by anyone with file system access to your vault

**Why plain text?**

1. **Mobile compatibility**: Encryption solutions like Electron's `safeStorage` are not available on Obsidian mobile
2. **Standard practice**: Follows Obsidian plugin ecosystem conventions
3. **Low risk**: Freesound API keys have rate limits and no financial/personal data access
4. **User transparency**: Users are explicitly informed in the UI

**Security recommendations:**

- Only share your vault with trusted individuals
- Regenerate your API key at https://freesound.org if your vault is compromised
- Consider using separate vaults for different trust levels
- API keys can be revoked and regenerated at any time at no cost

### Local Audio Sample Storage

Audio samples downloaded from Freesound are cached locally in your vault for performance. These are public domain or Creative Commons licensed audio files and pose no security risk.

## Reporting a Vulnerability

If you discover a security vulnerability in Sonigraph, please report it by:

1. **DO NOT** open a public GitHub issue
2. Email the maintainer directly (check package.json for contact information)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

You can expect:
- Initial response within 48 hours
- Regular updates on the status of your report
- Credit in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices for Users

1. **API Keys**: Treat API keys like passwords - don't share them publicly
2. **Vault Sharing**: Be aware that sharing your vault shares your API keys
3. **Git Repositories**: Add `.obsidian/plugins/sonigraph/data.json` to `.gitignore` if committing your vault
4. **Cloud Sync**: Understand that synced vaults will sync API keys across devices

## Future Security Enhancements

Planned improvements:
- Optional encrypted storage for API keys (when device supports it)
- Vault-specific API key isolation
- Automatic key rotation notifications

## Acknowledgments

We follow responsible disclosure practices and appreciate security researchers who help keep Sonigraph secure.