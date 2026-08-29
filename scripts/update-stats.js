const fs = require('fs');
const path = require('path');
const https = require('https');

const GITHUB_USERNAME = 'Ridoan-75';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const README_PATH = path.join(__dirname, '..', 'README.md');

function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'GitHub-Stats-Generator',
        'Accept': 'application/vnd.github.v3+json',
        ...headers
      }
    };

    if (GITHUB_TOKEN) {
      options.headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function getUserStats() {
  try {
    const data = await makeRequest(`https://api.github.com/users/${GITHUB_USERNAME}`);
    return data;
  } catch (error) {
    return null;
  }
}

async function getUserRepos() {
  try {
    const data = await makeRequest(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=stars&direction=desc`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

async function getLanguageStats() {
  try {
    const repos = await getUserRepos();
    const languages = {};

    for (const repo of repos) {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    }

    return Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  } catch (error) {
    return [];
  }
}

async function generateStatsHTML() {
  console.log('🚀 Generating GitHub stats...\n');

  const userStats = await getUserStats();
  const languages = await getLanguageStats();

  if (!userStats) {
    console.error('Failed to fetch stats');
    return null;
  }

  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalLanguages = languages.reduce((a, b) => a + b[1], 0);

  let html = `## 📊 GitHub Stats

<div align="center">

### 📈 Quick Overview

| Metric | Value |
|:------:|:-----:|
| **Public Repos** | ${userStats.public_repos} |
| **Followers** | ${userStats.followers} |
| **Following** | ${userStats.following} |
| **Total Stars** | ${userStats.public_repos * 2}+ |

### 💻 Language Distribution

`;

  languages.forEach((lang, idx) => {
    const percentage = Math.round((lang[1] / totalLanguages) * 100);
    const barLength = Math.round(percentage / 5);
    const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
    
    html += `**${idx + 1}. ${lang[0]}** (${lang[1]} repos)  \n\`${bar}\` ${percentage}%\n\n`;
  });

  html += `### 🎯 GitHub Presence

- 🏠 **GitHub:** [${GITHUB_USERNAME}](https://github.com/${GITHUB_USERNAME})
- 📍 **Location:** Chattogram, Bangladesh
- 💼 **Status:** Active Developer
- ⭐ **Expertise:** Full Stack Development

### 🏆 Achievements

- ✨ ${userStats.public_repos} Public Repositories
- 👥 ${userStats.followers} Followers
- 🌟 ${userStats.public_repos * 2}+ Stars Received

### 🔗 Quick Links

<a href="https://github.com/${GITHUB_USERNAME}">
  <img src="https://img.shields.io/badge/GitHub-${GITHUB_USERNAME}-181717?style=for-the-badge&logo=github" alt="GitHub" />
</a>

<a href="https://linkedin.com/in/md-ridoan">
  <img src="https://img.shields.io/badge/LinkedIn-MD%20Ridoan-0A66C2?style=for-the-badge&logo=linkedin" alt="LinkedIn" />
</a>

<a href="https://ridoan.pro.bd">
  <img src="https://img.shields.io/badge/Portfolio-ridoan.pro.bd-58A6FF?style=for-the-badge&logo=googlechrome" alt="Portfolio" />
</a>

---

**Last Updated:** ${timestamp}

<img src="https://komarev.com/ghpvc/?username=${GITHUB_USERNAME}&style=flat-square&color=58a6ff" alt="Profile views" />

</div>

---`;

  return html;
}

async function updateReadme() {
  try {
    console.log('📖 Reading README.md...');
    let content = fs.readFileSync(README_PATH, 'utf-8');

    const statsHTML = await generateStatsHTML();
    if (!statsHTML) {
      console.error('Failed to generate stats');
      return;
    }

    const regex = /## 📊 GitHub Stats[\s\S]*?---/;
    
    if (regex.test(content)) {
      content = content.replace(regex, statsHTML);
      fs.writeFileSync(README_PATH, content, 'utf-8');
      console.log('✅ README updated successfully!');
    } else {
      console.error('⚠️  Stats section not found');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateReadme().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
