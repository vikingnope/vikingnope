const fs = require('fs');
const path = require('path');

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
    <svg width="450" height="215" viewBox="0 0 450 215" xmlns="http://www.w3.org/2000/svg">
      <style>${CardStyles}</style>
      
      <rect x="2" y="2" rx="10" height="211" width="446" class="card-bg" />
      
      <text x="25" y="35" class="header">@${process.env.GITHUB_USERNAME}'s Stats</text>

      ${StatRow({ icon: '⭐', label: 'Total Stars', value: totalStars, y: 70 })}
      ${StatRow({ icon: '🔄', label: 'Total Commits', value: totalCommits, y: 100 })}
      ${StatRow({ icon: '🔀', label: 'Pull Requests', value: totalPRs, y: 130 })}
      ${StatRow({ icon: '🐛', label: 'Issues', value: totalIssues, y: 160 })}
      ${StatRow({ icon: '👥', label: 'Followers', value: followers, y: 190 })}

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


const TopLangsCard = ({ langs }) => {
  return `
    <svg width="450" height="215" viewBox="0 0 450 215" xmlns="http://www.w3.org/2000/svg">
      <style>${CardStyles}</style>
      <rect x="2" y="2" rx="10" height="211" width="446" class="card-bg" />
      <text x="25" y="35" class="header">Top Languages</text>
      
      ${langs.slice(0, 6).map((lang, i) => {
        const y = 65 + i * 24;
        return `
          <g transform="translate(25, ${y})">
            <text x="0" y="10" class="label" style="fill: #e8e4dc; font-size: 13px; font-weight: 600;">${lang.name}</text>
            <rect x="100" y="2" width="240" height="8" rx="4" fill="#2d2b28" />
            <rect x="100" y="2" width="${Math.max(240 * (lang.percent / 100), 10)}" height="8" rx="4" fill="${lang.color}" />
            <text x="355" y="10" class="stat" style="font-size: 12px;">${lang.percent.toFixed(1)}%</text>
          </g>
        `;
      }).join('')}
    </svg>
  `;
};


const HeaderSvg = () => {
    return `
      <svg width="800" height="200" viewBox="0 0 800 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="text-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#e8e4dc;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#d4a373;stop-opacity:1" />
          </linearGradient>
          
          <clipPath id="reveal">
            <rect x="0" y="0" width="0" height="200">
               <animate attributeName="width" from="0" to="800" dur="2s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.42 0 0.58 1" />
            </rect>
          </clipPath>
          
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <style>
          .name { 
            font: 800 70px 'Segoe UI', Ubuntu, Sans-Serif; 
            fill: url(#text-grad); 
            text-anchor: middle; 
            dominant-baseline: middle;
            filter: url(#glow);
          }
          .cursor {
            font: 800 70px 'Segoe UI', Ubuntu, Sans-Serif; 
            fill: #bc6c25; 
            animation: blink 1s step-end infinite;
            opacity: 0;
            animation-delay: 2s; /* Start blinking after type finishes? or just appear */
          }
          @keyframes blink {
            from, to { opacity: 1; }
            50% { opacity: 0; }
          }
        </style>

        <!-- Centered Text with Reveal Mask -->
        <g clip-path="url(#reveal)">
             <text x="400" y="100" class="name">Aiden Schembri</text>
        </g>
        
      </svg>
    `.trim();
};

const TypingSvg = () => {
    // CSS Keyframe animation embedded in SVG
    const width = 500;
    const height = 50;
    const color = "#358EF7"; // Blue from existing, or could utilize rustic #bc6c25
    
    // We will simulate typing by just changing the text content using CSS animation steps?
    // Actually, widespread support for CSS content replacement in SVG is tricky.
    // Better approach: Use multiple text elements and animate their opacity.
    
    const lines = [
        "Physics Major",
        "Software Developer",
        "Aviation Enthusiast",
        "Rust Learner"
    ];
    
    const duration = 4; // seconds per line
    const totalDuration = lines.length * duration;
    
    // Generate keyframes for each line to appear and disappear
    let css = "";
    lines.forEach((line, i) => {
        const start = (i / lines.length) * 100;
        const end = ((i + 1) / lines.length) * 100;
        const fade = (0.5 / totalDuration) * 100; // short fade
        
        // simple toggle visibility
        css += `
        .line-${i} { animation: fade${i} ${totalDuration}s infinite; opacity: 0; }
        @keyframes fade${i} {
            0% { opacity: 0; }
            ${start}% { opacity: 0; }
            ${start + 1}% { opacity: 1; }
            ${end - 1}% { opacity: 1; }
            ${end}% { opacity: 0; }
            100% { opacity: 0; }
        }
        `;
    });
    
    // Typing cursor animation
    css += `
        .cursor { animation: blink 1s infinite; }
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
    `;
    
    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          text { font-family: 'Fira Code', monospace; font-size: 24px; fill: #bc6c25; font-weight: bold; }
          ${css}
        </style>
        
        <!-- Centered Group -->
        <g transform="translate(${width/2}, ${height/2})">
             ${lines.map((line, i) => `<text class="line-${i}" text-anchor="middle" dominant-baseline="middle">${line}</text>`).join('')}
             <!-- We'd need a moving cursor for true typing style, but centered fading text is also very clean "Apple style" -->
        </g>
      </svg>
    `.trim();
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
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
              edges {
                size
                node {
                  name
                  color
                }
              }
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

  // Aggregate Languages
  const langMap = {};
  let totalSize = 0;

  user.repositories.nodes.forEach(repo => {
    if (repo.languages && repo.languages.edges) {
      repo.languages.edges.forEach(edge => {
        const { size, node } = edge;
        if (!langMap[node.name]) {
          langMap[node.name] = { name: node.name, color: node.color, size: 0 };
        }
        langMap[node.name].size += size;
        totalSize += size;
      });
    }
  });

  const sortedLangs = Object.values(langMap)
    .sort((a, b) => b.size - a.size)
    .map(lang => ({ ...lang, percent: (lang.size / totalSize) * 100 }));

  return {
    totalStars,
    totalCommits: user.contributionsCollection.totalCommitContributions,
    totalPRs: user.contributionsCollection.totalPullRequestContributions,
    totalIssues: user.contributionsCollection.totalIssueContributions,
    contributions: user.contributionsCollection.totalRepositoryContributions,
    followers: user.followers.totalCount,
    topRepos: sortedRepos,
    topLangs: sortedLangs
  };
}

// --- 4. EXECUTION ---

(async () => {
  try {
    console.log("Generating Buttons...");
    const OUTPUT_DIR = 'assets';
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

    // Rustic Theme Colors: Background #1c1917 is default from class 'card-bg'
    // Text Color: #e8e4dc (Bone) or #d4a373 (Sand)
    fs.writeFileSync(path.join(OUTPUT_DIR, 'button-bmc.svg'), CreateButton({ icon: '☕', label: 'Buy me a coffee', color: '#e8e4dc' }));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'button-paypal.svg'), CreateButton({ icon: 'P', label: 'PayPal', color: '#e8e4dc' }));
    
    console.log("Generating Header SVG...");
    fs.writeFileSync(path.join(OUTPUT_DIR, 'header.svg'), HeaderSvg());
    
    console.log("Generating Intro SVG...");
    fs.writeFileSync(path.join(OUTPUT_DIR, 'intro.svg'), TypingSvg());

    console.log("Fetching data...");
    const data = await fetchStats();
    
    console.log("Generating SVG...");
    const svg = StatsCard({ data }); 
    fs.writeFileSync(path.join(OUTPUT_DIR, 'stats.svg'), svg);
    
    console.log("Generating Top Repos SVG...");
    const topReposSvg = TopReposCard({ repos: data.topRepos });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'top-repos.svg'), topReposSvg);

    console.log("Generating Top Langs SVG...");
    const topLangsSvg = TopLangsCard({ langs: data.topLangs });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'top-langs.svg'), topLangsSvg);

    console.log("Done! Created assets/stats.svg, assets/top-repos.svg, assets/top-langs.svg, and buttons.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();