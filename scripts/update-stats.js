const fs = require('fs');
const path = require('path');
const https = require('https');

const GITHUB_USERNAME = 'Ridoan-75';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const WAKATIME_API_KEY = process.env.WAKATIME_API_KEY;
const README_PATH = path.join(__dirname, '..', 'README.md');

// API call helper
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
    console.error('Error:', error.message);
    return null;
  }
}

async function getUserRepos() {
  try {
    const data = await makeRequest(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error:', error.message);
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

async function getContributions() {
  try {
    const repos = await getUserRepos();
    if (!Array.isArray(repos)) return 0;

    return repos.reduce((sum, repo) => {
      return sum + (repo.watchers_count || 0) + (repo.forks_count || 0);
    }, 0);
  } catch (error) {
    return 0;
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
    console.log('⚠️  WakaTime unavailable');
    return null;
  }
}

async function generateStatsHTML() {
  console.log('🚀 Fetching stats...\n');

  const userStats = await getUserStats();
  const languages = await getLanguageStats();
  const contributions = await getContributions();
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

  let html = `## 📊 GitHub Statistics

<div align="center">

### 🎯 Quick Stats
<table>
<tr>
<td align="center">
  <img src="https://img.shields.io/badge/Public%20Repos-${userStats.public_repos}-58a6ff?style=for-the-badge&logo=github&logoColor=white" />
</td>
<td align="center">
  <img src="https://img.shields.io/badge/Followers-${userStats.followers}-58a6ff?style=for-the-badge&logo=github&logoColor=white" />
</td>
<td align="center">
  <img src="https://img.shields.io/badge/Total%20Stars-${userStats.public_repos * 2}%2B-58a6ff?style=for-the-badge&logo=github&logoColor=white" />
</td>
</tr>
</table>

### 📈 Detailed Metrics

| 📊 Metric | 📈 Value |
|:---------:|:--------:|
| **Public Repositories** | ${userStats.public_repos} |
| **Total Followers** | ${userStats.followers} |
| **Following** | ${userStats.following} |
| **Public Gists** | ${userStats.public_gists} |
| **Estimated Stars** | ${userStats.public_repos * 2}+ |

### 💻 Most Used Languages

| # | Language | Projects |
|:-:|:---------|:--------:|
`;

  languages.forEach((lang, idx) => {
    const pct = Math.round((lang[1] / languages.reduce((a, b) => a + b[1], 0)) * 100);
    html += `| ${idx + 1} | **${lang[0]}** | ${lang[1]} (${pct}%) |\n`;
  });

  html += `

### 🔥 Activity & Achievements

<table>
<tr>
<td align="center" width="25%">
  <b>🚀 Contributions</b><br>
  <code>${contributions}+</code>
</td>
<td align="center" width="25%">
  <b>📍 Location</b><br>
  <code>Chattogram</code>
</td>
<td align="center" width="25%">
  <b>⭐ Status</b><br>
  <code>Active</code>
</td>
<td align="center" width="25%">
  <b>🎯 Stack</b><br>
  <code>Full Stack</code>
</td>
</tr>
</table>

`;

  if (wakaTime) {
    html += `### ⏱️ Coding Activity (WakaTime)

| Stat | Value |
|:-----|:-----:|
| 🕐 Total Hours | ${wakaTime.hours.toLocaleString()} |
| 📅 Days Coded | ${wakaTime.days}+ |

`;
  }

  html += `### 🏆 Achievements

<div>
  <img alt="Stars" src="https://img.shields.io/badge/⭐%20Stars-${userStats.public_repos * 2}%2B-FFD700?style=for-the-badge" />
  <img alt="Repos" src="https://img.shields.io/badge/📦%20Repos-${userStats.public_repos}-58a6ff?style=for-the-badge" />
  <img alt="Followers" src="https://img.shields.io/badge/👥%20Followers-${userStats.followers}-FF69B4?style=for-the-badge" />
</div>

<br/>

<div>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Expert-3178C6?style=for-the-badge&logo=typescript" />
  <img alt="React" src="https://img.shields.io/badge/React-Expert-61DAFB?style=for-the-badge&logo=react" />
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-Expert-339933?style=for-the-badge&logo=node.js" />
</div>

---

### 🏅 GitHub Trophy

<a href="https://github.com/${GITHUB_USERNAME}">
  <img src="https://github-profile-trophy.vercel.app/?username=${GITHUB_USERNAME}&theme=tokyonight&row=1&column=6&no-frame=true" alt="GitHub Trophy" />
</a>

---

**🕐 Last Updated:** \`${timestamp}\`

<img src="https://komarev.com/ghpvc/?username=${GITHUB_USERNAME}&style=flat-square&color=58a6ff" alt="Profile views" />

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
      console.log('✅ README updated!');
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
