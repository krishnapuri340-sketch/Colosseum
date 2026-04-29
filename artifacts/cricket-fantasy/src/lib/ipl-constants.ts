export const TEAM_LOGO: Record<string, string> = {
  CSK:  "/logos/csk.png",
  MI:   "/logos/mi.png",
  KKR:  "/logos/kkr.png",
  RCB:  "/logos/rcb.png",
  RR:   "/logos/rr.png",
  SRH:  "/logos/srh.png",
  DC:   "/logos/dc.png",
  PBKS: "/logos/pbks.png",
  GT:   "/logos/gt.png",
  LSG:  "/logos/lsg.png",
};

export const TEAM_FULL_NAME: Record<string, string> = {
  CSK:  "Chennai Super Kings",
  MI:   "Mumbai Indians",
  KKR:  "Kolkata Knight Riders",
  RCB:  "Royal Challengers Bengaluru",
  RR:   "Rajasthan Royals",
  SRH:  "Sunrisers Hyderabad",
  DC:   "Delhi Capitals",
  PBKS: "Punjab Kings",
  GT:   "Gujarat Titans",
  LSG:  "Lucknow Super Giants",
};

export const TEAM_COLOR: Record<string, string> = {
  CSK:  "#f59e0b",
  MI:   "#3b82f6",
  KKR:  "#7c3aed",
  RCB:  "#ef4444",
  RR:   "#f472b6",
  SRH:  "#fb923c",
  DC:   "#38bdf8",
  PBKS: "#f87171",
  GT:   "#60a5fa",
  LSG:  "#34d399",
};

export const ALL_TEAMS = Object.keys(TEAM_FULL_NAME);

export const ROLE_LABEL: Record<string, string> = {
  BAT: "Batsman",
  BWL: "Bowler",
  AR:  "All-Rounder",
  WK:  "Wicket-Keeper",
};

export const ROLE_ICON: Record<string, string> = {
  BAT: "🏏",
  BWL: "🎯",
  AR:  "⚡",
  WK:  "🧤",
};

export const ROLE_COLOR: Record<string, string> = {
  BAT: "#60a5fa",
  BWL: "#f472b6",
  AR:  "#34d399",
  WK:  "#fbbf24",
};

export interface ScoringRule {
  category: string;
  event: string;
  points: number | string;
}

export const SCORING_RULES: ScoringRule[] = [
  { category: "Base",     event: "Playing XI",                points: 4 },
  { category: "Batting",  event: "Run scored",                points: 1 },
  { category: "Batting",  event: "Four hit",                  points: 4 },
  { category: "Batting",  event: "Six hit",                   points: 6 },
  { category: "Batting",  event: "Duck (batting, not No.11)", points: -2 },
  { category: "Batting",  event: "25+ runs",                  points: 4 },
  { category: "Batting",  event: "50+ runs",                  points: 8 },
  { category: "Batting",  event: "75+ runs",                  points: 12 },
  { category: "Batting",  event: "100+ runs",                 points: 16 },
  { category: "SR Bonus (min 10 balls or 20 runs)", event: "SR > 190",       points: 8 },
  { category: "SR Bonus (min 10 balls or 20 runs)", event: "SR > 170",       points: 6 },
  { category: "SR Bonus (min 10 balls or 20 runs)", event: "SR > 150",       points: 4 },
  { category: "SR Bonus (min 10 balls or 20 runs)", event: "SR ≥ 130",       points: 2 },
  { category: "SR Penalty",                         event: "SR 70–100",      points: -2 },
  { category: "SR Penalty",                         event: "SR 60–69",       points: -4 },
  { category: "SR Penalty",                         event: "SR 50–59",       points: -6 },
  { category: "Bowling",  event: "Wicket",                    points: 30 },
  { category: "Bowling",  event: "LBW / Bowled bonus",        points: 8 },
  { category: "Bowling",  event: "Dot ball",                  points: 2 },
  { category: "Bowling",  event: "Maiden over",               points: 12 },
  { category: "Bowling",  event: "3-wicket haul",             points: 8 },
  { category: "Bowling",  event: "4-wicket haul",             points: 12 },
  { category: "Bowling",  event: "5+ wicket haul",            points: 16 },
  { category: "Eco Bonus (min 2 overs)", event: "Eco < 5",              points: 8 },
  { category: "Eco Bonus (min 2 overs)", event: "Eco < 6",              points: 6 },
  { category: "Eco Bonus (min 2 overs)", event: "Eco ≤ 7",              points: 4 },
  { category: "Eco Bonus (min 2 overs)", event: "Eco ≤ 8",              points: 2 },
  { category: "Eco Penalty",             event: "Eco 10–11",            points: -2 },
  { category: "Eco Penalty",             event: "Eco 11–12",            points: -4 },
  { category: "Eco Penalty",             event: "Eco > 12",             points: -6 },
  { category: "Fielding", event: "Catch",                     points: 8 },
  { category: "Fielding", event: "3+ catches bonus",          points: 4 },
  { category: "Fielding", event: "Stumping",                  points: 12 },
  { category: "Fielding", event: "Direct run-out",            points: 10 },
  { category: "Fielding", event: "Indirect run-out (shared)", points: 5 },
  { category: "Multiplier", event: "Captain",                 points: "2×" },
  { category: "Multiplier", event: "Vice-Captain",            points: "1.5×" },
];

export const IPL_2026_PLAYERS: Array<{
  name: string; team: string; role: string; credits: number;
}> = [
  { name: "Virat Kohli",         team: "RCB",  role: "BAT", credits: 11.0 },
  { name: "Phil Salt",           team: "RCB",  role: "WK",  credits: 10.0 },
  { name: "Rajat Patidar",       team: "RCB",  role: "BAT", credits: 9.5 },
  { name: "Krunal Pandya",       team: "RCB",  role: "AR",  credits: 8.5 },
  { name: "Josh Hazlewood",      team: "RCB",  role: "BWL", credits: 8.0 },
  { name: "Bhuvneshwar Kumar",   team: "RCB",  role: "BWL", credits: 7.5 },
  { name: "Jacob Bethell",       team: "RCB",  role: "AR",  credits: 7.0 },
  { name: "Rohit Sharma",        team: "MI",   role: "BAT", credits: 10.0 },
  { name: "Hardik Pandya",       team: "MI",   role: "AR",  credits: 11.0 },
  { name: "Tilak Varma",         team: "MI",   role: "AR",  credits: 10.0 },
  { name: "Jasprit Bumrah",      team: "MI",   role: "BWL", credits: 11.0 },
  { name: "Suryakumar Yadav",    team: "MI",   role: "BAT", credits: 10.5 },
  { name: "Trent Boult",         team: "MI",   role: "BWL", credits: 8.5 },
  { name: "Ishan Kishan",        team: "SRH",  role: "WK",  credits: 9.5 },
  { name: "Abhishek Sharma",     team: "SRH",  role: "AR",  credits: 9.5 },
  { name: "Heinrich Klaasen",    team: "SRH",  role: "WK",  credits: 9.0 },
  { name: "Travis Head",         team: "SRH",  role: "BAT", credits: 10.5 },
  { name: "Pat Cummins",         team: "SRH",  role: "BWL", credits: 10.0 },
  { name: "Rashid Khan",         team: "GT",   role: "AR",  credits: 10.5 },
  { name: "Shubman Gill",        team: "GT",   role: "BAT", credits: 11.0 },
  { name: "Sai Sudharsan",       team: "GT",   role: "BAT", credits: 9.0 },
  { name: "Jos Buttler",         team: "GT",   role: "WK",  credits: 9.5 },
  { name: "Mohammed Shami",      team: "LSG",  role: "BWL", credits: 10.0 },
  { name: "Nicholas Pooran",     team: "LSG",  role: "WK",  credits: 9.5 },
  { name: "Rishabh Pant",        team: "LSG",  role: "WK",  credits: 10.5 },
  { name: "Mitchell Marsh",      team: "LSG",  role: "AR",  credits: 9.0 },
  { name: "Ruturaj Gaikwad",     team: "CSK",  role: "BAT", credits: 10.0 },
  { name: "Sanju Samson",        team: "CSK",  role: "WK",  credits: 10.5 },
  { name: "Shivam Dube",         team: "CSK",  role: "AR",  credits: 9.0 },
  { name: "Arshdeep Singh",      team: "PBKS", role: "BWL", credits: 10.0 },
  { name: "Shreyas Iyer",        team: "PBKS", role: "BAT", credits: 10.5 },
  { name: "Prabhsimran Singh",   team: "PBKS", role: "WK",  credits: 9.0 },
  { name: "Yashasvi Jaiswal",    team: "RR",   role: "BAT", credits: 10.5 },
  { name: "Sanju Samson (RR)",   team: "RR",   role: "WK",  credits: 9.5 },
  { name: "Yuzvendra Chahal",    team: "PBKS", role: "BWL", credits: 9.0 },
  { name: "Axar Patel",          team: "DC",   role: "AR",  credits: 9.5 },
  { name: "KL Rahul",            team: "DC",   role: "WK",  credits: 10.0 },
  { name: "Kuldeep Yadav",       team: "DC",   role: "BWL", credits: 9.5 },
  { name: "Varun Chakravarthy",  team: "KKR",  role: "BWL", credits: 9.5 },
  { name: "Sunil Narine",        team: "KKR",  role: "AR",  credits: 10.0 },
  { name: "Andre Russell",       team: "KKR",  role: "AR",  credits: 10.5 },
  { name: "Rinku Singh",         team: "KKR",  role: "BAT", credits: 9.0 },
];
