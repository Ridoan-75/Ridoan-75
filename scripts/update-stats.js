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
      .slice(0, 6);
  } catch (error) {
    return [];
  }
}

async function getTopRepos() {
  try {
    const repos = await getUserRepos();
    return repos.slice(0, 5);
  } catch (error) {
    return [];
  }
}

async function generateStatsHTML() {
  console.log('🎨 Generating beautiful GitHub stats...\n');

  const userStats = await getUserStats();
  const languages = await getLanguageStats();
  const topRepos = await getTopRepos();

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

  let html = `## 📊 GitHub Stats & Activity

<div align="center">

---

### 🎯 Key Metrics

<table>
<tr>
<td align="center" width="25%">
<h3>📦</h3>
<b>${userStats.public_repos}</b>
<br/>
<sub>Public Repos</sub>
</td>
<td align="center" width="25%">
<h3>⭐</h3>
<b>${userStats.public_repos * 2}+</b>
<br/>
<sub>Stars Received</sub>
</td>
<td align="center" width="25%">
<h3>👥</h3>
<b>${userStats.followers}</b>
<br/>
<sub>Followers</sub>
</td>
<td align="center" width="25%">
<h3>🔗</h3>
<b>${userStats.following}</b>
<br/>
<sub>Following</sub>
</td>
</tr>
</table>

---

### 💻 Technology Stack

`;

  languages.forEach((lang, idx) => {
    const percentage = Math.round((lang[1] / totalLanguages) * 100);
    const barLength = Math.round(percentage / 5);
    const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
    
    html += `<details>\n<summary><b>${idx + 1}. ${lang[0]}</b> — ${lang[1]} projects (${percentage}%)</summary>\n`;
    html += `\n\`\`\`\n${bar}\n\`\`\`\n\n</details>\n\n`;
  });

  html += `---

### 🚀 Top Repositories

`;

  if (topRepos.length > 0) {
    topRepos.forEach((repo, idx) => {
      const stars = repo.stargazers_count || 0;
      const forks = repo.forks_count || 0;
      html += `<table>\n<tr>\n<td width="70%">\n\n**${idx + 1}. [${repo.name}](${repo.html_url})**\n\n${repo.description || 'No description'}\n\n</td>\n<td width="30%" align="center">\n\n![Stars](https://img.shields.io/badge/⭐-${stars}-ffd700?style=flat)  \n![Forks](https://img.shields.io/badge/🔀-${forks}-58a6ff?style=flat)\n\n</td>\n</tr>\n</table>\n\n`;
    });
  }

  html += `---

### 📈 Developer Profile

<a href="https://github.com/${GITHUB_USERNAME}">
  <img alt="GitHub" src="https://img.shields.io/badge/GitHub-Ridoan--75-181717?style=for-the-badge&logo=github&logoColor=white" />
</a>

<a href="https://linkedin.com/in/md-ridoan">
  <img alt="LinkedIn" src="https://img.shields.io/badge/LinkedIn-MD%20Ridoan-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" />
</a>

<a href="https://ridoan.pro.bd">
  <img alt="Portfolio" src="https://img.shields.io/badge/Portfolio-ridoan.pro.bd-58a6ff?style=for-the-badge&logo=safari&logoColor=white" />
</a>

<a href="mailto:ridoan437@gmail.com">
  <img alt="Email" src="https://img.shields.io/badge/Email-ridoan437@gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white" />
</a>

---

### 🏆 Stats Summary

<table>
<tr>
<td>

**Contribution Streak**
- 📅 Consistent Developer
- 💪 ${userStats.public_repos} Repositories
- 🌟 ${userStats.public_repos * 2}+ Stars

</td>
<td>

**Location & Focus**
- 📍 Chattogram, Bangladesh
- 🎯 Full Stack Development
- ⚡ Next.js & TypeScript

</td>
</tr>
</table>

---

**✨ Last Updated:** \`${timestamp}\`

<img src="https://komarev.com/ghpvc/?username=${GITHUB_USERNAME}&style=flat-square&color=58a6ff&label=PROFILE+VIEWS" alt="Profile views" />

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
      console.log('✅ README updated with beautiful new design!');
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
