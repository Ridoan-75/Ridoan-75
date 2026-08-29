const fs = require('fs');
const path = require('path');
const https = require('https');

const GITHUB_USERNAME = 'Ridoan-75';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const WAKATIME_API_KEY = process.env.WAKATIME_API_KEY;
const README_PATH = path.join(__dirname, '..', 'README.md');

// External services URLs
function getStatsUrls() {
  const tokenParam = GITHUB_TOKEN ? `&token=${GITHUB_TOKEN}` : '';
  
  return {
    stats: `https://github-readme-stats.vercel.app/api?username=${GITHUB_USERNAME}&show_icons=true&theme=tokyonight&hide_border=true&include_all_commits=true&count_private=true${tokenParam}`,
    
    languages: `https://github-readme-stats.vercel.app/api/top-langs/?username=${GITHUB_USERNAME}&layout=compact&langs_count=8&theme=tokyonight&hide_border=true${tokenParam}`,
    
    activity: `https://github-readme-activity-graph.vercel.app/graph?username=${GITHUB_USERNAME}&theme=tokyo-night&hide_border=true&area=true`,
    
    trophy: `https://github-profile-trophy.vercel.app/?username=${GITHUB_USERNAME}&theme=tokyonight&row=2&column=3&no-frame=true`
  };
}

// Fetch WakaTime stats
async function getWakaTimeStats() {
  if (!WAKATIME_API_KEY) return null;

  return new Promise((resolve) => {
    const url = 'https://wakatime.com/api/v1/users/current/stats/all_time';
    const options = {
      headers: {
        'Authorization': `Bearer ${WAKATIME_API_KEY}`,
        'User-Agent': 'GitHub-Stats'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data) {
            const totalSeconds = json.data.total_seconds;
            resolve({
              hours: Math.round(totalSeconds / 3600),
              days: Math.round(totalSeconds / 86400)
            });
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function generateStatsHTML() {
  console.log('🚀 Generating GitHub stats...\n');

  const urls = getStatsUrls();
  const wakaTime = await getWakaTimeStats();
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  let html = `## 📊 GitHub Stats

<div align="center">

### 1️⃣ Overall Statistics

<img src="${urls.stats}" alt="GitHub Stats" />

### 2️⃣ Most Used Languages

<img src="${urls.languages}" alt="Top Languages" />

### 3️⃣ GitHub Trophy

<img src="${urls.trophy}" alt="GitHub Trophy" />

### 4️⃣ Activity Graph

<img src="${urls.activity}" alt="Activity Graph" />

`;

  if (wakaTime) {
    html += `### 5️⃣ Coding Activity (WakaTime)

**Total Coding Time:** ${wakaTime.hours.toLocaleString()} hours  
**Days Coded:** ${wakaTime.days}+ days

`;
  }

  html += `---

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
