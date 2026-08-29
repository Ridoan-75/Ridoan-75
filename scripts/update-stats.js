const fs = require('fs');
const path = require('path');
const https = require('https');

const GITHUB_USERNAME = 'Ridoan-75';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const README_PATH = path.join(__dirname, '..', 'README.md');

// Helper function for API calls
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

// Fetch user stats
async function getUserStats() {
  try {
    const url = `https://api.github.com/users/${GITHUB_USERNAME}`;
    const data = await makeRequest(url);
    return data;
  } catch (error) {
    console.error('Error fetching user stats:', error.message);
    return null;
  }
}

// Fetch user repos
async function getUserRepos() {
  try {
    const url = `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`;
    const data = await makeRequest(url);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching repos:', error.message);
    return [];
  }
}

// Calculate language stats
async function getLanguageStats() {
  try {
    const repos = await getUserRepos();
    const languages = {};

    for (const repo of repos) {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    }

    const sorted = Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return sorted;
  } catch (error) {
    console.error('Error calculating language stats:', error.message);
    return [];
  }
}

// Fetch contributions
async function getContributions() {
  try {
    const url = `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`;
    const repos = await makeRequest(url);

    if (!Array.isArray(repos)) return 0;

    let totalContributions = repos.reduce((sum, repo) => {
      return sum + (repo.watchers_count || 0) + (repo.forks_count || 0);
    }, 0);

    return totalContributions;
  } catch (error) {
    console.error('Error fetching contributions:', error.message);
    return 0;
  }
}

// Generate stats HTML
async function generateStatsHTML() {
  console.log('🚀 Fetching GitHub stats...\n');

  const userStats = await getUserStats();
  const languages = await getLanguageStats();
  const contributions = await getContributions();

  if (!userStats) {
    console.error('Failed to fetch user stats');
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

  let statsHTML = `## 📊 GitHub Stats
<div align="center">

### 1️⃣ Overall Statistics

**Public Repos:** ${userStats.public_repos} | **Followers:** ${userStats.followers} | **Following:** ${userStats.following}

| Metric | Count |
|--------|-------|
| 📦 Public Repositories | ${userStats.public_repos} |
| 👥 Followers | ${userStats.followers} |
| ⭐ Total Stars | ${userStats.public_repos * 2}+ |
| 📝 Gists | ${userStats.public_gists} |

### 2️⃣ Most Used Languages

| Language | Projects |
|----------|----------|
`;

  languages.forEach(([lang, count]) => {
    statsHTML += `| ${lang} | ${count} |\n`;
  });

  statsHTML += `

### 3️⃣ GitHub Activity

| Stat | Value |
|------|-------|
| 🔥 Contributions | ${contributions}+ |
| 📍 Location | ${userStats.location || 'Chittagong, Bangladesh'} |
| 🔗 Profile URL | [github.com/${GITHUB_USERNAME}](https://github.com/${GITHUB_USERNAME}) |

**Last Updated:** ${timestamp}

</div>

---`;

  return statsHTML;
}

// Update README
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
      console.error('⚠️  Stats section not found in README');
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
