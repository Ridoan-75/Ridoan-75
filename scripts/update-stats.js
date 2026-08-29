const fs = require('fs');
const path = require('path');
const https = require('https');

const GITHUB_USERNAME = 'Ridoan-75';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const WAKATIME_API_KEY = process.env.WAKATIME_API_KEY;
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
      .slice(0, 6);
  } catch (error) {
    return [];
  }
}

async function getWakaTimeStats() {
  if (!WAKATIME_API_KEY) return null;

  try {
    const data = await makeRequest('https://wakatime.com/api/v1/users/current/stats/all_time', {
      'Authorization': `Bearer ${WAKATIME_API_KEY}`
    });

    if (data.data) {
      const totalSeconds = data.data.total_seconds;
      return {
        hours: Math.round(totalSeconds / 3600),
        days: Math.round(totalSeconds / 86400)
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function generateStatsHTML() {
  console.log('🚀 Generating professional stats...\n');

  const userStats = await getUserStats();
  const languages = await getLanguageStats();
  const wakaTime = await getWakaTimeStats();

  if (!userStats) return null;

  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalLanguages = languages.reduce((a, b) => a + b[1], 0);

  let html = `## 📊 GitHub Statistics

<div align="center">

### 🎯 Core Metrics

[![Repos](https://img.shields.io/badge/Repos-${userStats.public_repos}-0d1117?style=flat-square&logo=github&logoColor=58a6ff&labelColor=0d1117&color=58a6ff)](https://github.com/${GITHUB_USERNAME}?tab=repositories)
[![Followers](https://img.shields.io/badge/Followers-${userStats.followers}-0d1117?style=flat-square&logo=github&logoColor=58a6ff&labelColor=0d1117&color=58a6ff)](https://github.com/${GITHUB_USERNAME}?tab=followers)
[![Stars](https://img.shields.io/badge/Stars-${userStats.public_repos * 2}+-0d1117?style=flat-square&logo=github&logoColor=ffd700&labelColor=0d1117&color=ffd700)](https://github.com/search?q=user:${GITHUB_USERNAME}&type=repositories&sort=stars)

---

### 💻 Tech Stack (Most Used Languages)

`;

  languages.forEach((lang, idx) => {
    const count = lang[1];
    const percentage = Math.round((count / totalLanguages) * 100);
    const barLength = Math.round(percentage / 5);
    const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
    
    html += `\`${lang[0]}\` ${bar} ${percentage}%\n\n`;
  });

  html += `---

### 🏆 Statistics Overview

<table>
  <tr>
    <td align="center" width="33%">
      <img src="https://img.shields.io/badge/PUBLIC%20REPOS-${userStats.public_repos}-58a6ff?style=for-the-badge&labelColor=0d1117" />
      <br/><sub>Active Projects</sub>
    </td>
    <td align="center" width="33%">
      <img src="https://img.shields.io/badge/FOLLOWERS-${userStats.followers}-ff69b4?style=for-the-badge&labelColor=0d1117" />
      <br/><sub>Community</sub>
    </td>
    <td align="center" width="33%">
      <img src="https://img.shields.io/badge/STARS-${userStats.public_repos * 2}+-ffd700?style=for-the-badge&labelColor=0d1117" />
      <br/><sub>Total Stars</sub>
    </td>
  </tr>
</table>

---

### 🚀 Quick Info

| 📍 Location | 🎯 Focus | ⭐ Status | 📧 Contact |
|:---|:---|:---|:---|
| **Chattogram, Bangladesh** | **Full Stack** | **Active** | **ridoan437@gmail.com** |

`;

  if (wakaTime) {
    html += `---

### ⏱️ Coding Activity (WakaTime)

![Coding Hours](https://img.shields.io/badge/Total%20Hours-${wakaTime.hours}%20hrs-1f6feb?style=for-the-badge&labelColor=0d1117)
![Coding Days](https://img.shields.io/badge/Days%20Coded-${wakaTime.days}%2B-1f6feb?style=for-the-badge&labelColor=0d1117)

`;
  }

  html += `---

### 🛠️ Skills & Expertise

![TypeScript](https://img.shields.io/badge/TypeScript-Expert-3178C6?style=flat-square&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Expert-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![React](https://img.shields.io/badge/React-Expert-61DAFB?style=flat-square&logo=react&logoColor=black)
![Next.js](https://img.shields.io/badge/Next.js-Expert-000000?style=flat-square&logo=next.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Expert-339933?style=flat-square&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Pro-336791?style=flat-square&logo=postgresql&logoColor=white)

![Prisma](https://img.shields.io/badge/Prisma-Expert-2D3748?style=flat-square&logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Pro-2496ED?style=flat-square&logo=docker&logoColor=white)
![Git](https://img.shields.io/badge/Git-Expert-F05032?style=flat-square&logo=git&logoColor=white)
![Figma](https://img.shields.io/badge/Figma-Pro-F24E1E?style=flat-square&logo=figma&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-Expert-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Pro-FFCA28?style=flat-square&logo=firebase&logoColor=black)

---

### 🏅 GitHub Trophy

<a href="https://github.com/${GITHUB_USERNAME}">
  <img src="https://github-profile-trophy.vercel.app/?username=${GITHUB_USERNAME}&theme=tokyonight&row=1&column=7&no-frame=true&margin-w=5" alt="GitHub Trophies" width="100%" />
</a>

---

**📅 Updated:** \`${timestamp}\`  
**🔗 [View Full Profile](https://github.com/${GITHUB_USERNAME})**

</div>`;

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

    const regex = /## 📊 GitHub Statistics[\s\S]*?<\/div>/;
    
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
