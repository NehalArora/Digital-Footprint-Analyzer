async function analyzeEmail(email) {
  const domain = email.split('@')[1] || 'unknown';

  // Realistic mock data — still saves fully to MySQL
  return {
    riskScore: 72,
    riskLevel: 'HIGH',
    riskSummary: `The email address associated with ${domain} has been found in multiple data breaches. Sensitive personal information including passwords and contact details have been exposed. Immediate action is recommended to secure associated accounts.`,
    breaches: [
      {
        name: 'LinkedIn',
        date: '2021',
        severity: 'HIGH',
        dataTypes: ['Email', 'Password', 'Phone Number'],
        description: '700 million LinkedIn records were scraped and leaked on a hacker forum, exposing professional and personal data.',
        icon: '💼'
      },
      {
        name: 'Adobe',
        date: '2013',
        severity: 'HIGH',
        dataTypes: ['Email', 'Password Hash', 'Username'],
        description: 'Adobe suffered a massive breach exposing encrypted passwords and credit card data of 153 million users.',
        icon: '🎨'
      },
      {
        name: 'Canva',
        date: '2019',
        severity: 'MEDIUM',
        dataTypes: ['Email', 'Username', 'City'],
        description: 'Canva had 137 million user records stolen including names, usernames, and bcrypt-hashed passwords.',
        icon: '🖌️'
      },
      {
        name: 'Truecaller',
        date: '2019',
        severity: 'MEDIUM',
        dataTypes: ['Email', 'Phone Number', 'Name'],
        description: 'A database of 299 million Indian Truecaller users was found for sale on the dark web.',
        icon: '📱'
      }
    ],
    exposedDataTypes: ['Email', 'Password', 'Phone Number', 'Username', 'Name', 'City'],
    immediateActions: [
      {
        title: 'Change passwords immediately',
        detail: 'Update passwords on all accounts using this email, especially banking and social media.'
      },
      {
        title: 'Enable two-factor authentication',
        detail: 'Turn on 2FA on every account that supports it to prevent unauthorized access even if passwords are stolen.'
      },
      {
        title: 'Check for password reuse',
        detail: 'If you reuse passwords across sites, change them all — attackers try leaked passwords on other services.'
      },
      {
        title: 'Use a password manager',
        detail: 'Start using a password manager like Bitwarden to generate and store unique passwords for every site.'
      },
      {
        title: 'Monitor your accounts',
        detail: 'Set up login alerts on your email and banking accounts to detect unauthorized access attempts.'
      },
      {
        title: 'Scan for further breaches',
        detail: 'Visit HaveIBeenPwned.com regularly to check if your email appears in new data breaches.'
      }
    ],
    resources: [
      {
        title: 'Have I Been Pwned',
        type: 'TOOL',
        description: 'Check if your email or phone has appeared in a data breach.',
        url: 'https://haveibeenpwned.com',
        relevance: 'Directly check all known breaches for your email address'
      },
      {
        title: 'Mozilla Monitor',
        type: 'SERVICE',
        description: 'Free breach monitoring service that alerts you when your data is found in new leaks.',
        url: 'https://monitor.mozilla.org',
        relevance: 'Ongoing monitoring so you are notified of future breaches automatically'
      },
      {
        title: 'Bitwarden',
        type: 'TOOL',
        description: 'Free open-source password manager to generate and store strong unique passwords.',
        url: 'https://bitwarden.com',
        relevance: 'Prevent credential stuffing attacks by using unique passwords everywhere'
      },
      {
        title: 'EFF — Surveillance Self Defense',
        type: 'GUIDE',
        description: 'Comprehensive digital security guides from the Electronic Frontier Foundation.',
        url: 'https://ssd.eff.org',
        relevance: 'Step-by-step guides to protecting your online privacy and security'
      },
      {
        title: 'Google Password Checkup',
        type: 'TOOL',
        description: 'Check if your saved passwords have been exposed in known data breaches.',
        url: 'https://passwords.google.com/checkup',
        relevance: 'Quickly audit all your Google-saved passwords for breach exposure'
      },
      {
        title: 'Krebs on Security',
        type: 'ARTICLE',
        description: 'Leading cybersecurity news blog covering the latest breaches and threats.',
        url: 'https://krebsonsecurity.com',
        relevance: 'Stay informed about new breaches and security threats affecting your data'
      }
    ]
  };
}

module.exports = { analyzeEmail };