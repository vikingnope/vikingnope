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
  
  if (score > 4000) return { level: 'S+', color: '#2f81f7', text: '#2f81f7' }; // Blue
  if (score > 2000) return { level: 'S',  color: '#2f81f7', text: '#2f81f7' }; 
  if (score > 1000) return { level: 'A+', color: '#2ea043', text: '#2ea043' }; // Green
  if (score > 500)  return { level: 'A',  color: '#a371f7', text: '#a371f7' }; // Purple
  if (score > 200)  return { level: 'B+', color: '#e3b341', text: '#e3b341' }; // Yellow
  return { level: 'B', color: '#f0883e', text: '#f0883e' }; // Orange
}

// --- 2. STYLES & COMPONENTS ---

const CardStyles = `
  .header { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: #ff79c6; }
  .stat { font: 600 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: #f8f8f2; }
  .label { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: #bd93f9; }
  .rank-text { font: 800 24px 'Segoe UI', Ubuntu, Sans-Serif; dominant-baseline: central; }
  .card-bg { fill: #282a36; stroke: #44475a; stroke-width: 2px; }
`;

const StatRow = ({ icon, label, value, y }) => {
  return `
    <g transform="translate(25, ${y})">
      <text class="label" x="25" y="0">${label}:</text>
      <text class="stat" x="140" y="0">${value}</text>
      <text x="0" y="0" style="fill:#ff79c6; font-size: 14px;">${icon}</text>
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
      <circle cx="0" cy="0" r="${radius}" fill="none" stroke="#44475a" stroke-width="5" />
      
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
          nodes { stargazers { totalCount } }
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

  return {
    totalStars,
    totalCommits: user.contributionsCollection.totalCommitContributions,
    totalPRs: user.contributionsCollection.totalPullRequestContributions,
    totalIssues: user.contributionsCollection.totalIssueContributions,
    contributions: user.contributionsCollection.totalRepositoryContributions,
    followers: user.followers.totalCount,
  };
}

// --- 4. EXECUTION ---

(async () => {
  try {
    console.log("Fetching data...");
    const data = await fetchStats();
    
    console.log("Generating SVG...");
    const svg = StatsCard({ data }); 
    
    fs.writeFileSync('stats.svg', svg);
    console.log("Done! Created stats.svg with Official Ranking logic.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();