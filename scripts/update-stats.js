const fs = require('fs');
const path = require('path');
const axios = require('axios');

const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'Ridoan-75';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const WAKATIME_API_KEY = process.env.WAKATIME_API_KEY;

const README_PATH = path.join(__dirname, '..', 'README.md');

// Stats images with tokens
const statsImages = {
  github: `https://github-readme-stats.vercel.app/api?username=${GITHUB_USERNAME}&show_icons=true&theme=tokyonight&hide_border=true&include_all_commits=true&count_private=true${GITHUB_TOKEN ? `&token=${GITHUB_TOKEN}` : ''}`,
  
  languages: `https://github-readme-stats.vercel.app/api/top-langs/?username=${GITHUB_USERNAME}&layout=compact&langs_count=8&theme=tokyonight&hide_border=true${GITHUB_TOKEN ? `&token=${GITHUB_TOKEN}` : ''}`,
  
  activity: `https://github-readme-activity-graph.vercel.app/graph?username=${GITHUB_USERNAME}&theme=tokyo-night&hide_border=true&area=true`,
  
  trophy: `https://github-profile-trophy.vercel.app/?username=${GITHUB_USERNAME}&theme=tokyonight&row=2&column=3&no-frame=true`
};

async function getWakaTimeStats() {
  if (!WAKATIME_API_KEY) return null;
  
  try {
    const response = await axios.get('https://wakatime.com/api/v1/users/current/stats/all_time', {
      headers: {
        'Authorization': `Bearer ${WAKATIME_API_KEY}`
      }
    });
    
    const data = response.data.data;
    return `${Math.round(data.total_seconds / 3600)} hours`;
  } catch (error) {
    console.log('⚠️  WakaTime stats fetching failed:', error.message);
    return null;
  }
}

async function updateReadme() {
  try {
    console.log('📖 Reading README.md...');
    let content = fs.readFileSync(README_PATH, 'utf-8');
    
    const timestamp = new Date().toLocaleString('en-US', { 
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Section markers
    const statsStartMarker = '## 📊 GitHub Stats';
    const statsEndMarker = '---';
    
    if (content.includes(statsStartMarker)) {
      console.log('📊 Updating GitHub Stats section...');
      
      // নতুন stats section তৈরি করো
      const newStatsSection = `## 📊 GitHub Stats
<div align="center">

### 1️⃣ Overall Statistics
<img src="${statsImages.github}" alt="GitHub Stats" />

### 2️⃣ Most Used Languages
<img src="${statsImages.languages}" alt="Top Languages" />

### 3️⃣ GitHub Trophy
<img src="${statsImages.trophy}" alt="GitHub Trophy" />

### 4️⃣ Activity Graph
<img src="${statsImages.activity}" alt="Activity Graph" />

**Last Updated:** ${timestamp}

</div>

---`;

      // Old stats section replace করো
      const regex = /## 📊 GitHub Stats[\s\S]*?---/;
      content = content.replace(regex, newStatsSection);
      
    } else {
      console.log('⚠️  Stats section not found in README');
    }

    // README write করো
    fs.writeFileSync(README_PATH, content, 'utf-8');
    console.log('✅ README.md successfully updated!');
    
  } catch (error) {
    console.error('❌ Error updating README:', error.message);
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Starting README Stats Update...\n');
  console.log(`📍 GitHub User: ${GITHUB_USERNAME}`);
  console.log(`🔑 Has GitHub Token: ${!!GITHUB_TOKEN}`);
  console.log(`🎵 Has WakaTime Key: ${!!WAKATIME_API_KEY}\n`);
  
  await updateReadme();
  
  console.log('\n✨ Update completed successfully!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
