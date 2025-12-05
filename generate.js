const fs = require('fs');

// --- 1. RANK CALCULATION (Mimicking the official repo) ---
function calculateRank({ totalStars, totalCommits, totalPRs, totalIssues, contributions, followers }) {
  
  // Official weights from github-readme-stats
  const COMMITS_WEIGHT = 2;
  const PRS_WEIGHT = 3;
  const ISSUES_WEIGHT = 1;
  const STARS_WEIGHT = 4;
  const FOLLOWERS_WEIGHT = 1; // Added followers

  // Calculate "Total Score"
  const score = (
    totalCommits * COMMITS_WEIGHT +
    totalPRs * PRS_WEIGHT +
    totalIssues * ISSUES_WEIGHT +
    totalStars * STARS_WEIGHT +
    followers * FOLLOWERS_WEIGHT
  );

  // Thresholds (Adjusted to feel like the official rankings)
  // S+  = Top Tier (God tier)
  // S   = High Tier (Very active)
  // A+  = Solid Tier (Active daily)
  
  if (score > 4000) return { level: 'S+', color: '#bc6c25', text: '#bc6c25' }; // Terra Cotta
  if (score > 2000) return { level: 'S',  color: '#bc6c25', text: '#bc6c25' }; 
  if (score > 1000) return { level: 'A+', color: '#606c38', text: '#606c38' }; // Moss Green
  if (score > 500)  return { level: 'A',  color: '#606c38', text: '#606c38' }; 
  if (score > 200)  return { level: 'B+', color: '#d4a373', text: '#d4a373' }; // Sand
  if (score > 100)  return { level: 'B',  color: '#d4a373', text: '#d4a373' };
  if (score > 75)   return { level: 'C+', color: '#a8a29e', text: '#a8a29e' }; // Light Stone
  if (score > 50)   return { level: 'C',  color: '#a8a29e', text: '#a8a29e' };
  if (score > 25)   return { level: 'D+', color: '#78716c', text: '#78716c' }; // Dark Stone
  if (score > 10)   return { level: 'D',  color: '#78716c', text: '#78716c' };
  return { level: 'F', color: '#44403c', text: '#44403c' }; // Very Dark Stone
}

// --- 2. STYLES & COMPONENTS ---

const CardStyles = `
  .header { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: #d4a373; }
  .stat { font: 600 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: #e8e4dc; }
  .label { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: #a8a29e; }
  .rank-text { font: 800 24px 'Segoe UI', Ubuntu, Sans-Serif; dominant-baseline: central; }
  .card-bg { fill: #1c1917; stroke: #44403c; stroke-width: 2px; }
`;

const StatRow = ({ icon, label, value, y }) => {
  return `
    <g transform="translate(25, ${y})">
      <text class="label" x="25" y="0">${label}:</text>
      <text class="stat" x="140" y="0">${value}</text>
      <text x="0" y="0" style="fill:#bc6c25; font-size: 14px;">${icon}</text>
    </g>
  `;
};

const RankCircle = ({ rank }) => {
  // A perfect circle
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  // We'll just show a "mostly full" circle for aesthetics (like 75-80%)
  const percent = 75; 
  const offset = circumference - (percent / 100) * circumference;
  
  return `
    <g transform="translate(360, 100)">
      <circle cx="0" cy="0" r="${radius}" fill="none" stroke="#44403c" stroke-width="5" />
      
      <circle cx="0" cy="0" r="${radius}" fill="none" stroke="${rank.color}" stroke-width="5"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${offset}"
              stroke-linecap="round"
              transform="rotate(-90 0 0)"
      />
      
      <text x="0" y="0" text-anchor="middle" class="rank-text" fill="${rank.text}">
        ${rank.level}
      </text>
    </g>
  `;
};

const StatsCard = ({ data }) => {
  const { totalStars, totalCommits, totalPRs, totalIssues, contributions, followers } = data;
  
  const rank = calculateRank(data);
  
  return `
    <svg width="450" height="195" viewBox="0 0 450 195" xmlns="http://www.w3.org/2000/svg">
      <style>${CardStyles}</style>
      
      <rect x="2" y="2" rx="10" height="190" width="446" class="card-bg" />
      
      <text x="25" y="35" class="header">@${process.env.GITHUB_USERNAME}'s Stats</text>

      ${StatRow({ icon: '⭐', label: 'Total Stars', value: totalStars, y: 70 })}
      ${StatRow({ icon: '🔄', label: 'Total Commits', value: totalCommits, y: 95 })}
      ${StatRow({ icon: '🔀', label: 'Pull Requests', value: totalPRs, y: 120 })}
      ${StatRow({ icon: '🐛', label: 'Issues', value: totalIssues, y: 145 })}
      ${StatRow({ icon: '👥', label: 'Followers', value: followers, y: 170 })}

      ${RankCircle({ rank })} 
    </svg>
  `;
};

const RepoRow = ({ repo, y }) => {
  return `
    <g transform="translate(25, ${y})">
      <text x="0" y="0" class="stat" style="font-size: 14px; fill: #d4a373;">${repo.name}</text>
      <text x="0" y="20" class="label" style="font-size: 11px; fill: #a8a29e;">${repo.description ? repo.description.slice(0, 50) + (repo.description.length > 50 ? '...' : '') : 'No description'}</text>
      <circle cx="280" cy="-4" r="5" fill="${repo.primaryLanguage ? repo.primaryLanguage.color : '#ccc'}" />
      <text x="295" y="0" class="label">${repo.primaryLanguage ? repo.primaryLanguage.name : 'N/A'}</text>
      <text x="380" y="0" class="stat">⭐ ${repo.stargazers.totalCount}</text>
    </g>
  `;
};

const TopReposCard = ({ repos }) => {
  return `
    <svg width="450" height="280" viewBox="0 0 450 280" xmlns="http://www.w3.org/2000/svg">
      <style>${CardStyles}</style>
      <rect x="2" y="2" rx="10" height="276" width="446" class="card-bg" />
      <text x="25" y="35" class="header">Top Repositories</text>
      ${repos.map((repo, i) => RepoRow({ repo, y: 75 + i * 42 })).join('')}
    </svg>
  `;
};

const CreateButton = ({ icon, label, color }) => {
  return `
    <svg width="200" height="50" viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg">
      <style>${CardStyles} .btn-text { font: 600 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${color}; dominant-baseline: central; text-anchor: middle; }</style>
      <rect x="2" y="2" rx="8" height="46" width="196" class="card-bg" />
      <text x="100" y="25" class="btn-text">
        ${icon} ${label}
      </text>
    </svg>
  `;
};

// --- 3. DATA FETCHING ---

async function fetchStats() {
  const token = process.env.GH_TOKEN;
  
  const query = `
    query userInfo($login: String!) {
      user(login: $login) {
        name
        followers {
          totalCount
        }
        repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
          nodes { 
            name
            description
            stargazers { totalCount }
            primaryLanguage {
              name
              color
            }
          }
        }
        contributionsCollection {
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
          totalRepositoryContributions
          contributionCalendar { totalContributions }
        }
      }
    }
  `;

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables: { login: process.env.GITHUB_USERNAME } }),
  });

  const json = await response.json();
  
  // Error handling if token is invalid
  if (!json.data || !json.data.user) {
    console.error("Error: GitHub API returned no data. Check your GH_TOKEN.");
    console.error(JSON.stringify(json, null, 2));
    process.exit(1);
  }

  const user = json.data.user;
  const totalStars = user.repositories.nodes.reduce((acc, repo) => acc + repo.stargazers.totalCount, 0);

  // Sort repos by stars
  const sortedRepos = user.repositories.nodes.sort((a, b) => b.stargazers.totalCount - a.stargazers.totalCount).slice(0, 5);

  return {
    totalStars,
    totalCommits: user.contributionsCollection.totalCommitContributions,
    totalPRs: user.contributionsCollection.totalPullRequestContributions,
    totalIssues: user.contributionsCollection.totalIssueContributions,
    contributions: user.contributionsCollection.totalRepositoryContributions,
    followers: user.followers.totalCount,
    topRepos: sortedRepos
  };
}

// --- 4. EXECUTION ---

(async () => {
  try {
    console.log("Generating Buttons...");
    // Rustic Theme Colors: Background #1c1917 is default from class 'card-bg'
    // Text Color: #e8e4dc (Bone) or #d4a373 (Sand)
    fs.writeFileSync('button-bmc.svg', CreateButton({ icon: '☕', label: 'Buy me a coffee', color: '#e8e4dc' }));
    fs.writeFileSync('button-paypal.svg', CreateButton({ icon: 'P', label: 'PayPal', color: '#e8e4dc' }));
    
    console.log("Fetching data...");
    const data = await fetchStats();
    
    console.log("Generating SVG...");
    const svg = StatsCard({ data }); 
    fs.writeFileSync('stats.svg', svg);
    
    console.log("Generating Top Repos SVG...");
    const topReposSvg = TopReposCard({ repos: data.topRepos });
    fs.writeFileSync('top-repos.svg', topReposSvg);
    
    /* Duplicate block removed */
    
    /* Duplicate block removed */
    console.log("Done! Created stats.svg, top-repos.svg, and buttons.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();