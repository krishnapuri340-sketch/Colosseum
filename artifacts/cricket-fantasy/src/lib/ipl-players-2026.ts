/**
 * IPL 2026 Official Player Database — 250 players, 25 per team
 * Source: olympics.com official IPL 2026 squads (verified from PDF)
 * 
 * Tier system:
 *   T1 Marquee   → credits ≥ 10.0  → Base ₹2 Cr
 *   T2 Premium   → credits 8.0–9.9  → Base ₹1 Cr
 *   T3 Mid-Level → credits 6.5–7.9  → Base ₹50 L (0.5 Cr)
 *   T4 Rookie    → credits < 6.5    → Base ₹25 L (0.25 Cr)
 */

export type PlayerTier = "T1" | "T2" | "T3" | "T4";

export interface IPLPlayer {
  name: string;
  team: string;
  role: "BAT" | "BWL" | "AR" | "WK";
  credits: number;
  nationality: "IND" | "OVS";
  capped: boolean;        // capped = played international cricket
}

// ── Tier config ─────────────────────────────────────────────────────
export const TIER_CONFIG: Record<PlayerTier, {
  label: string; subtitle: string; color: string;
  basePrice: number;   // in Crores
  minCredits: number; maxCredits: number;
  increment: number;   // bid increment in Crores
}> = {
  T1: { label:"Marquee",   subtitle:"Elite match-winners",     color:"#e8a020", basePrice:2.0,  minCredits:10.0, maxCredits:99,  increment:0.5  },
  T2: { label:"Premium",   subtitle:"Consistent performers",   color:"#818cf8", basePrice:1.0,  minCredits:8.0,  maxCredits:9.9, increment:0.25 },
  T3: { label:"Mid-Level", subtitle:"IPL-tested players",      color:"#34d399", basePrice:0.5,  minCredits:6.5,  maxCredits:7.9, increment:0.1  },
  T4: { label:"Rookie",    subtitle:"Uncapped / squad depth",  color:"#94a3b8", basePrice:0.25, minCredits:0,    maxCredits:6.4, increment:0.05 },
};

export function getPlayerTier(credits: number): PlayerTier {
  if (credits >= 10.0) return "T1";
  if (credits >= 8.0)  return "T2";
  if (credits >= 6.5)  return "T3";
  return "T4";
}

export function getTierBasePrice(credits: number): number {
  return TIER_CONFIG[getPlayerTier(credits)].basePrice;
}

// ── Official IPL 2026 Squads ─────────────────────────────────────────
export const ALL_IPL_2026_PLAYERS: IPLPlayer[] = [

  // ── CSK ─────────────────────────────────────────────────────────
  { name:"Ruturaj Gaikwad",    team:"CSK", role:"BAT", credits:10.0, nationality:"IND", capped:true  },
  { name:"MS Dhoni",           team:"CSK", role:"WK",  credits:10.0, nationality:"IND", capped:true  },
  { name:"Sanju Samson",       team:"CSK", role:"WK",  credits:10.5, nationality:"IND", capped:true  },
  { name:"Shivam Dube",        team:"CSK", role:"AR",  credits:9.0,  nationality:"IND", capped:true  },
  { name:"Dewald Brevis",      team:"CSK", role:"BAT", credits:8.5,  nationality:"OVS", capped:true  },
  { name:"Khaleel Ahmed",      team:"CSK", role:"BWL", credits:8.0,  nationality:"IND", capped:true  },
  { name:"Anshul Kamboj",      team:"CSK", role:"BWL", credits:7.5,  nationality:"IND", capped:false },
  { name:"Jamie Overton",      team:"CSK", role:"AR",  credits:8.0,  nationality:"OVS", capped:true  },
  { name:"Noor Ahmad",         team:"CSK", role:"BWL", credits:8.5,  nationality:"OVS", capped:true  },
  { name:"Spencer Johnson",    team:"CSK", role:"BWL", credits:8.0,  nationality:"OVS", capped:true  },
  { name:"Mukesh Choudhary",   team:"CSK", role:"BWL", credits:7.0,  nationality:"IND", capped:false },
  { name:"Shreyas Gopal",      team:"CSK", role:"BWL", credits:7.0,  nationality:"IND", capped:false },
  { name:"Gurjapneet Singh",   team:"CSK", role:"BWL", credits:6.0,  nationality:"IND", capped:false },
  { name:"Akash Madhwal",      team:"CSK", role:"BWL", credits:7.0,  nationality:"IND", capped:false },
  { name:"Urvil Patel",        team:"CSK", role:"WK",  credits:6.5,  nationality:"IND", capped:false },
  { name:"Ramakrishna Ghosh",  team:"CSK", role:"BWL", credits:5.5,  nationality:"IND", capped:false },
  { name:"Akeal Hosein",       team:"CSK", role:"AR",  credits:7.5,  nationality:"OVS", capped:true  },
  { name:"Prashant Veer",      team:"CSK", role:"BWL", credits:5.5,  nationality:"IND", capped:false },
  { name:"Kartik Sharma",      team:"CSK", role:"BAT", credits:5.5,  nationality:"IND", capped:false },
  { name:"Matthew Short",      team:"CSK", role:"AR",  credits:7.5,  nationality:"OVS", capped:true  },
  { name:"Aman Khan",          team:"CSK", role:"BWL", credits:5.0,  nationality:"IND", capped:false },
  { name:"Sarfaraz Khan",      team:"CSK", role:"BAT", credits:8.0,  nationality:"IND", capped:true  },
  { name:"Rahul Chahar",       team:"CSK", role:"BWL", credits:7.5,  nationality:"IND", capped:true  },
  { name:"Matt Henry",         team:"CSK", role:"BWL", credits:7.5,  nationality:"OVS", capped:true  },
  { name:"Zak Foulkes",        team:"CSK", role:"BWL", credits:7.0,  nationality:"OVS", capped:true  },

  // ── DC ───────────────────────────────────────────────────────────
  { name:"KL Rahul",           team:"DC", role:"WK",  credits:10.0, nationality:"IND", capped:true  },
  { name:"Axar Patel",         team:"DC", role:"AR",  credits:9.5,  nationality:"IND", capped:true  },
  { name:"Mitchell Starc",     team:"DC", role:"BWL", credits:10.0, nationality:"OVS", capped:true  },
  { name:"Kuldeep Yadav",      team:"DC", role:"BWL", credits:9.5,  nationality:"IND", capped:true  },
  { name:"Tristan Stubbs",     team:"DC", role:"BAT", credits:8.5,  nationality:"OVS", capped:true  },
  { name:"Nitish Rana",        team:"DC", role:"BAT", credits:8.0,  nationality:"IND", capped:true  },
  { name:"Karun Nair",         team:"DC", role:"BAT", credits:7.5,  nationality:"IND", capped:true  },
  { name:"Abishek Porel",      team:"DC", role:"WK",  credits:7.5,  nationality:"IND", capped:false },
  { name:"Sameer Rizvi",       team:"DC", role:"BAT", credits:7.0,  nationality:"IND", capped:false },
  { name:"Ashutosh Sharma",    team:"DC", role:"AR",  credits:7.5,  nationality:"IND", capped:false },
  { name:"T Natarajan",        team:"DC", role:"BWL", credits:7.5,  nationality:"IND", capped:true  },
  { name:"Mukesh Kumar",       team:"DC", role:"BWL", credits:7.5,  nationality:"IND", capped:true  },
  { name:"Dushmantha Chameera",team:"DC", role:"BWL", credits:7.0,  nationality:"OVS", capped:true  },
  { name:"Vipraj Nigam",       team:"DC", role:"BWL", credits:6.0,  nationality:"IND", capped:false },
  { name:"Ajay Mandal",        team:"DC", role:"AR",  credits:6.0,  nationality:"IND", capped:false },
  { name:"Tripurana Vijay",    team:"DC", role:"BAT", credits:5.5,  nationality:"IND", capped:false },
  { name:"Madhav Tiwari",      team:"DC", role:"BWL", credits:5.5,  nationality:"IND", capped:false },
  { name:"David Miller",       team:"DC", role:"BAT", credits:8.5,  nationality:"OVS", capped:true  },
  { name:"Pathum Nissanka",    team:"DC", role:"BAT", credits:8.0,  nationality:"OVS", capped:true  },
  { name:"Lungi Ngidi",        team:"DC", role:"BWL", credits:7.5,  nationality:"OVS", capped:true  },
  { name:"Rehan Ahmed",        team:"DC", role:"BWL", credits:7.5,  nationality:"OVS", capped:true  },
  { name:"Prithvi Shaw",       team:"DC", role:"BAT", credits:7.0,  nationality:"IND", capped:true  },
  { name:"Kyle Jamieson",      team:"DC", role:"AR",  credits:8.0,  nationality:"OVS", capped:true  },
  { name:"Auqib Dar",          team:"DC", role:"BWL", credits:5.5,  nationality:"IND", capped:false },
  { name:"Sahil Parakh",       team:"DC", role:"BWL", credits:5.0,  nationality:"IND", capped:false },

  // ── GT ───────────────────────────────────────────────────────────
  { name:"Shubman Gill",       team:"GT", role:"BAT", credits:11.0, nationality:"IND", capped:true  },
  { name:"Rashid Khan",        team:"GT", role:"AR",  credits:10.5, nationality:"OVS", capped:true  },
  { name:"Jos Buttler",        team:"GT", role:"WK",  credits:9.5,  nationality:"OVS", capped:true  },
  { name:"Kagiso Rabada",      team:"GT", role:"BWL", credits:9.5,  nationality:"OVS", capped:true  },
  { name:"Sai Sudharsan",      team:"GT", role:"BAT", credits:9.0,  nationality:"IND", capped:true  },
  { name:"Washington Sundar",  team:"GT", role:"AR",  credits:8.5,  nationality:"IND", capped:true  },
  { name:"Mohammed Siraj",     team:"GT", role:"BWL", credits:9.0,  nationality:"IND", capped:true  },
  { name:"Prasidh Krishna",    team:"GT", role:"BWL", credits:8.5,  nationality:"IND", capped:true  },
  { name:"Glenn Phillips",     team:"GT", role:"WK",  credits:8.5,  nationality:"OVS", capped:true  },
  { name:"Rahul Tewatia",      team:"GT", role:"AR",  credits:8.0,  nationality:"IND", capped:false },
  { name:"Jason Holder",       team:"GT", role:"AR",  credits:8.0,  nationality:"OVS", capped:true  },
  { name:"Jayant Yadav",       team:"GT", role:"AR",  credits:7.5,  nationality:"IND", capped:true  },
  { name:"Sai Kishore",        team:"GT", role:"BWL", credits:7.5,  nationality:"IND", capped:true  },
  { name:"Ishant Sharma",      team:"GT", role:"BWL", credits:7.0,  nationality:"IND", capped:true  },
  { name:"Manav Suthar",       team:"GT", role:"BWL", credits:6.5,  nationality:"IND", capped:false },
  { name:"Kumar Kushagra",     team:"GT", role:"WK",  credits:6.5,  nationality:"IND", capped:false },
  { name:"Anuj Rawat",         team:"GT", role:"WK",  credits:6.5,  nationality:"IND", capped:false },
  { name:"Shahrukh Khan",      team:"GT", role:"BAT", credits:7.0,  nationality:"IND", capped:false },
  { name:"Arshad Khan",        team:"GT", role:"BWL", credits:6.0,  nationality:"IND", capped:false },
  { name:"Nishant Sindhu",     team:"GT", role:"AR",  credits:6.5,  nationality:"IND", capped:false },
  { name:"Gurnoor Brar",       team:"GT", role:"BWL", credits:6.5,  nationality:"IND", capped:false },
  { name:"Connor Esterhuizen", team:"GT", role:"BAT", credits:7.0,  nationality:"OVS", capped:true  },
  { name:"Luke Wood",          team:"GT", role:"BWL", credits:7.0,  nationality:"OVS", capped:true  },
  { name:"Ashok Sharma",       team:"GT", role:"BWL", credits:5.5,  nationality:"IND", capped:false },
  { name:"Kulwant Khejroliya", team:"GT", role:"BWL", credits:5.0,  nationality:"IND", capped:false },

  // ── KKR ──────────────────────────────────────────────────────────
  { name:"Sunil Narine",       team:"KKR", role:"AR",  credits:10.0, nationality:"OVS", capped:true  },
  { name:"Varun Chakravarthy", team:"KKR", role:"BWL", credits:9.5,  nationality:"IND", capped:true  },
  { name:"Rinku Singh",        team:"KKR", role:"BAT", credits:9.0,  nationality:"IND", capped:true  },
  { name:"Rovman Powell",      team:"KKR", role:"BAT", credits:8.5,  nationality:"OVS", capped:true  },
  { name:"Cameron Green",      team:"KKR", role:"AR",  credits:9.0,  nationality:"OVS", capped:true  },
  { name:"Matheesha Pathirana",team:"KKR", role:"BWL", credits:9.0,  nationality:"OVS", capped:true  },
  { name:"Rachin Ravindra",    team:"KKR", role:"AR",  credits:8.5,  nationality:"OVS", capped:true  },
  { name:"Finn Allen",         team:"KKR", role:"WK",  credits:8.5,  nationality:"OVS", capped:true  },
  { name:"Ajinkya Rahane",     team:"KKR", role:"BAT", credits:8.0,  nationality:"IND", capped:true  },
  { name:"Ramandeep Singh",    team:"KKR", role:"AR",  credits:7.5,  nationality:"IND", capped:true  },
  { name:"Angkrish Raghuvanshi",team:"KKR",role:"BAT", credits:8.0,  nationality:"IND", capped:false },
  { name:"Manish Pandey",      team:"KKR", role:"BAT", credits:7.5,  nationality:"IND", capped:true  },
  { name:"Anukul Roy",         team:"KKR", role:"AR",  credits:7.0,  nationality:"IND", capped:false },
  { name:"Navdeep Saini",      team:"KKR", role:"BWL", credits:7.5,  nationality:"IND", capped:true  },
  { name:"Umran Malik",        team:"KKR", role:"BWL", credits:7.0,  nationality:"IND", capped:true  },
  { name:"Vaibhav Arora",      team:"KKR", role:"BWL", credits:6.5,  nationality:"IND", capped:false },
  { name:"Rahul Tripathi",     team:"KKR", role:"BAT", credits:7.5,  nationality:"IND", capped:true  },
  { name:"Tim Seifert",        team:"KKR", role:"WK",  credits:7.0,  nationality:"OVS", capped:true  },
  { name:"Blessing Muzarabani",team:"KKR", role:"BWL", credits:7.5,  nationality:"OVS", capped:true  },
  { name:"Tejasvi Singh",      team:"KKR", role:"BAT", credits:5.5,  nationality:"IND", capped:false },
  { name:"Prashant Solanki",   team:"KKR", role:"BWL", credits:5.5,  nationality:"IND", capped:false },
  { name:"Kartik Tyagi",       team:"KKR", role:"BWL", credits:6.0,  nationality:"IND", capped:false },
  { name:"Sarthak Ranjan",     team:"KKR", role:"WK",  credits:5.0,  nationality:"IND", capped:false },
  { name:"Daksh Kamra",        team:"KKR", role:"BAT", credits:5.0,  nationality:"IND", capped:false },
  { name:"Saurabh Dubey",      team:"KKR", role:"BWL", credits:5.5,  nationality:"IND", capped:false },

  // ── LSG ──────────────────────────────────────────────────────────
  { name:"Rishabh Pant",       team:"LSG", role:"WK",  credits:10.5, nationality:"IND", capped:true  },
  { name:"Mohammed Shami",     team:"LSG", role:"BWL", credits:10.0, nationality:"IND", capped:true  },
  { name:"Nicholas Pooran",    team:"LSG", role:"WK",  credits:9.5,  nationality:"OVS", capped:true  },
  { name:"Mitchell Marsh",     team:"LSG", role:"AR",  credits:9.5,  nationality:"OVS", capped:true  },
  { name:"Aiden Markram",      team:"LSG", role:"AR",  credits:9.0,  nationality:"OVS", capped:true  },
  { name:"Anrich Nortje",      team:"LSG", role:"BWL", credits:9.0,  nationality:"OVS", capped:true  },
  { name:"Avesh Khan",         team:"LSG", role:"BWL", credits:8.0,  nationality:"IND", capped:true  },
  { name:"Mayank Yadav",       team:"LSG", role:"BWL", credits:8.5,  nationality:"IND", capped:true  },
  { name:"Matthew Breetzke",   team:"LSG", role:"BAT", credits:8.0,  nationality:"OVS", capped:true  },
  { name:"Josh Inglis",        team:"LSG", role:"WK",  credits:8.0,  nationality:"OVS", capped:true  },
  { name:"Shahbaz Ahmed",      team:"LSG", role:"AR",  credits:7.5,  nationality:"IND", capped:false },
  { name:"George Linde",       team:"LSG", role:"AR",  credits:7.5,  nationality:"OVS", capped:true  },
  { name:"Ayush Badoni",       team:"LSG", role:"BAT", credits:7.5,  nationality:"IND", capped:false },
  { name:"Abdul Samad",        team:"LSG", role:"BAT", credits:7.0,  nationality:"IND", capped:false },
  { name:"Arjun Tendulkar",    team:"LSG", role:"BWL", credits:6.5,  nationality:"IND", capped:false },
  { name:"Arshin Kulkarni",    team:"LSG", role:"BAT", credits:6.5,  nationality:"IND", capped:false },
  { name:"Himmat Singh",       team:"LSG", role:"BAT", credits:6.5,  nationality:"IND", capped:false },
  { name:"Mohsin Khan",        team:"LSG", role:"BWL", credits:7.0,  nationality:"IND", capped:false },
  { name:"M Siddharth",        team:"LSG", role:"BWL", credits:6.5,  nationality:"IND", capped:false },
  { name:"Digvesh Rathi",      team:"LSG", role:"BWL", credits:6.5,  nationality:"IND", capped:false },
  { name:"Prince Yadav",       team:"LSG", role:"BWL", credits:5.5,  nationality:"IND", capped:false },
  { name:"Akash Singh",        team:"LSG", role:"BWL", credits:6.0,  nationality:"IND", capped:false },
  { name:"Mukul Choudhary",    team:"LSG", role:"AR",  credits:5.5,  nationality:"IND", capped:false },
  { name:"Naman Tiwari",       team:"LSG", role:"BWL", credits:5.0,  nationality:"IND", capped:false },
  { name:"Akshat Raghuwanshi", team:"LSG", role:"BAT", credits:5.0,  nationality:"IND", capped:false },

  // ── MI ───────────────────────────────────────────────────────────
  { name:"Jasprit Bumrah",     team:"MI", role:"BWL", credits:11.0, nationality:"IND", capped:true  },
  { name:"Hardik Pandya",      team:"MI", role:"AR",  credits:11.0, nationality:"IND", capped:true  },
  { name:"Rohit Sharma",       team:"MI", role:"BAT", credits:10.5, nationality:"IND", capped:true  },
  { name:"Suryakumar Yadav",   team:"MI", role:"BAT", credits:10.5, nationality:"IND", capped:true  },
  { name:"Tilak Varma",        team:"MI", role:"AR",  credits:10.0, nationality:"IND", capped:true  },
  { name:"Will Jacks",         team:"MI", role:"AR",  credits:9.0,  nationality:"OVS", capped:true  },
  { name:"Trent Boult",        team:"MI", role:"BWL", credits:9.0,  nationality:"OVS", capped:true  },
  { name:"Ryan Rickelton",     team:"MI", role:"WK",  credits:8.5,  nationality:"OVS", capped:true  },
  { name:"Quinton de Kock",    team:"MI", role:"WK",  credits:9.5,  nationality:"OVS", capped:true  },
  { name:"Shardul Thakur",     team:"MI", role:"AR",  credits:8.5,  nationality:"IND", capped:true  },
  { name:"Sherfane Rutherford",team:"MI", role:"AR",  credits:8.0,  nationality:"OVS", capped:true  },
  { name:"Keshav Maharaj",     team:"MI", role:"BWL", credits:8.0,  nationality:"OVS", capped:true  },
  { name:"Deepak Chahar",      team:"MI", role:"BWL", credits:8.5,  nationality:"IND", capped:true  },
  { name:"Corbin Bosch",       team:"MI", role:"AR",  credits:8.0,  nationality:"OVS", capped:true  },
  { name:"Allah Ghazanfar",    team:"MI", role:"BWL", credits:8.0,  nationality:"OVS", capped:true  },
  { name:"Naman Dhir",         team:"MI", role:"AR",  credits:7.5,  nationality:"IND", capped:false },
  { name:"Robin Minz",         team:"MI", role:"WK",  credits:6.5,  nationality:"IND", capped:false },
  { name:"Raj Bawa",           team:"MI", role:"AR",  credits:7.0,  nationality:"IND", capped:false },
  { name:"Mayank Markande",    team:"MI", role:"BWL", credits:7.0,  nationality:"IND", capped:false },
  { name:"Ashwani Kumar",      team:"MI", role:"BWL", credits:5.5,  nationality:"IND", capped:false },
  { name:"Raghu Sharma",       team:"MI", role:"BWL", credits:5.5,  nationality:"IND", capped:false },
  { name:"Krish Bhagat",       team:"MI", role:"BAT", credits:5.0,  nationality:"IND", capped:false },
  { name:"Mohammad Izhar",     team:"MI", role:"BWL", credits:5.0,  nationality:"IND", capped:false },
  { name:"Danish Malewar",     team:"MI", role:"BWL", credits:5.0,  nationality:"IND", capped:false },
  { name:"Mayank Rawat",       team:"MI", role:"WK",  credits:5.0,  nationality:"IND", capped:false },

  // ── PBKS ─────────────────────────────────────────────────────────
  { name:"Shreyas Iyer",       team:"PBKS", role:"BAT", credits:10.5, nationality:"IND", capped:true  },
  { name:"Arshdeep Singh",     team:"PBKS", role:"BWL", credits:10.0, nationality:"IND", capped:true  },
  { name:"Yuzvendra Chahal",   team:"PBKS", role:"BWL", credits:9.0,  nationality:"IND", capped:true  },
  { name:"Marcus Stoinis",     team:"PBKS", role:"AR",  credits:9.0,  nationality:"OVS", capped:true  },
  { name:"Marco Jansen",       team:"PBKS", role:"AR",  credits:9.0,  nationality:"OVS", capped:true  },
  { name:"Lockie Ferguson",    team:"PBKS", role:"BWL", credits:8.5,  nationality:"OVS", capped:true  },
  { name:"Prabhsimran Singh",  team:"PBKS", role:"WK",  credits:9.0,  nationality:"IND", capped:false },
  { name:"Azmatullah Omarzai", team:"PBKS", role:"AR",  credits:8.5,  nationality:"OVS", capped:true  },
  { name:"Xavier Bartlett",    team:"PBKS", role:"BWL", credits:8.0,  nationality:"OVS", capped:true  },
  { name:"Cooper Connolly",    team:"PBKS", role:"AR",  credits:8.0,  nationality:"OVS", capped:true  },
  { name:"Mitch Owen",         team:"PBKS", role:"AR",  credits:8.0,  nationality:"OVS", capped:true  },
  { name:"Shashank Singh",     team:"PBKS", role:"BAT", credits:8.5,  nationality:"IND", capped:false },
  { name:"Nehal Wadhera",      team:"PBKS", role:"BAT", credits:7.5,  nationality:"IND", capped:false },
  { name:"Harpreet Brar",      team:"PBKS", role:"AR",  credits:7.0,  nationality:"IND", capped:false },
  { name:"Musheer Khan",       team:"PBKS", role:"BAT", credits:7.5,  nationality:"IND", capped:false },
  { name:"Priyansh Arya",      team:"PBKS", role:"AR",  credits:7.0,  nationality:"IND", capped:false },
  { name:"Suryansh Shedge",    team:"PBKS", role:"AR",  credits:6.5,  nationality:"IND", capped:false },
  { name:"Harnoor Pannu",      team:"PBKS", role:"BAT", credits:6.5,  nationality:"IND", capped:false },
  { name:"Vishnu Vinod",       team:"PBKS", role:"WK",  credits:6.5,  nationality:"IND", capped:false },
  { name:"Pyla Avinash",       team:"PBKS", role:"BAT", credits:6.0,  nationality:"IND", capped:false },
  { name:"Vyshak Vijaykumar",  team:"PBKS", role:"BWL", credits:7.5,  nationality:"IND", capped:false },
  { name:"Yash Thakur",        team:"PBKS", role:"BWL", credits:6.5,  nationality:"IND", capped:false },
  { name:"Ben Dwarshuis",      team:"PBKS", role:"BWL", credits:7.5,  nationality:"OVS", capped:true  },
  { name:"Vishal Nishad",      team:"PBKS", role:"BWL", credits:5.0,  nationality:"IND", capped:false },
  { name:"Pravin Dubey",       team:"PBKS", role:"BWL", credits:5.0,  nationality:"IND", capped:false },

  // ── RR ───────────────────────────────────────────────────────────
  { name:"Yashasvi Jaiswal",   team:"RR", role:"BAT", credits:11.0, nationality:"IND", capped:true  },
  { name:"Jofra Archer",       team:"RR", role:"BWL", credits:10.0, nationality:"OVS", capped:true  },
  { name:"Ravindra Jadeja",    team:"RR", role:"AR",  credits:10.0, nationality:"IND", capped:true  },
  { name:"Riyan Parag",        team:"RR", role:"AR",  credits:9.0,  nationality:"IND", capped:true  },
  { name:"Shimron Hetmyer",    team:"RR", role:"BAT", credits:8.5,  nationality:"OVS", capped:true  },
  { name:"Dhruv Jurel",        team:"RR", role:"WK",  credits:8.5,  nationality:"IND", capped:true  },
  { name:"Ravi Bishnoi",       team:"RR", role:"BWL", credits:8.5,  nationality:"IND", capped:true  },
  { name:"Lhuan-dre Pretorius",team:"RR", role:"BAT", credits:8.0,  nationality:"OVS", capped:true  },
  { name:"Donovan Ferreira",   team:"RR", role:"BAT", credits:7.5,  nationality:"OVS", capped:true  },
  { name:"Dasun Shanaka",      team:"RR", role:"AR",  credits:7.5,  nationality:"OVS", capped:true  },
  { name:"Kwena Maphaka",      team:"RR", role:"BWL", credits:7.5,  nationality:"OVS", capped:true  },
  { name:"Nandre Burger",      team:"RR", role:"BWL", credits:7.5,  nationality:"OVS", capped:true  },
  { name:"Tushar Deshpande",   team:"RR", role:"BWL", credits:7.5,  nationality:"IND", capped:true  },
  { name:"Sandeep Sharma",     team:"RR", role:"BWL", credits:7.0,  nationality:"IND", capped:false },
  { name:"Shubham Dubey",      team:"RR", role:"BAT", credits:7.0,  nationality:"IND", capped:false },
  { name:"Vaibhav Suryavanshi",team:"RR", role:"BAT", credits:8.0,  nationality:"IND", capped:false },
  { name:"Adam Milne",         team:"RR", role:"BWL", credits:7.5,  nationality:"OVS", capped:true  },
  { name:"Yudhvir Singh Charak",team:"RR",role:"BWL", credits:6.5,  nationality:"IND", capped:false },
  { name:"Vignesh Puthur",     team:"RR", role:"BWL", credits:6.0,  nationality:"IND", capped:false },
  { name:"Kuldeep Sen",        team:"RR", role:"BWL", credits:6.5,  nationality:"IND", capped:true  },
  { name:"Sushant Mishra",     team:"RR", role:"BWL", credits:5.5,  nationality:"IND", capped:false },
  { name:"Yash Raj Punja",     team:"RR", role:"BWL", credits:5.0,  nationality:"IND", capped:false },
  { name:"Ravi Singh",         team:"RR", role:"BWL", credits:5.0,  nationality:"IND", capped:false },
  { name:"Brijesh Sharma",     team:"RR", role:"BAT", credits:5.0,  nationality:"IND", capped:false },
  { name:"Aman Rao",           team:"RR", role:"AR",  credits:5.0,  nationality:"IND", capped:false },

  // ── RCB ──────────────────────────────────────────────────────────
  { name:"Virat Kohli",        team:"RCB", role:"BAT", credits:11.0, nationality:"IND", capped:true  },
  { name:"Phil Salt",          team:"RCB", role:"WK",  credits:10.0, nationality:"OVS", capped:true  },
  { name:"Rajat Patidar",      team:"RCB", role:"BAT", credits:9.5,  nationality:"IND", capped:true  },
  { name:"Krunal Pandya",      team:"RCB", role:"AR",  credits:8.5,  nationality:"IND", capped:true  },
  { name:"Josh Hazlewood",     team:"RCB", role:"BWL", credits:8.5,  nationality:"OVS", capped:true  },
  { name:"Venkatesh Iyer",     team:"RCB", role:"AR",  credits:9.0,  nationality:"IND", capped:true  },
  { name:"Tim David",          team:"RCB", role:"AR",  credits:8.5,  nationality:"OVS", capped:true  },
  { name:"Jacob Bethell",      team:"RCB", role:"AR",  credits:8.0,  nationality:"OVS", capped:true  },
  { name:"Romario Shepherd",   team:"RCB", role:"AR",  credits:8.0,  nationality:"OVS", capped:true  },
  { name:"Jitesh Sharma",      team:"RCB", role:"WK",  credits:8.0,  nationality:"IND", capped:true  },
  { name:"Devdutt Padikkal",   team:"RCB", role:"BAT", credits:8.0,  nationality:"IND", capped:true  },
  { name:"Jordan Cox",         team:"RCB", role:"BAT", credits:7.5,  nationality:"OVS", capped:true  },
  { name:"Bhuvneshwar Kumar",  team:"RCB", role:"BWL", credits:7.5,  nationality:"IND", capped:true  },
  { name:"Swapnil Singh",      team:"RCB", role:"AR",  credits:7.0,  nationality:"IND", capped:false },
  { name:"Nuwan Thushara",     team:"RCB", role:"BWL", credits:7.0,  nationality:"OVS", capped:true  },
  { name:"Rasikh Salam",       team:"RCB", role:"BWL", credits:6.5,  nationality:"IND", capped:false },
  { name:"Yash Dayal",         team:"RCB", role:"BWL", credits:6.5,  nationality:"IND", capped:false },
  { name:"Suyash Sharma",      team:"RCB", role:"BWL", credits:6.0,  nationality:"IND", capped:false },
  { name:"Abhinandan Singh",   team:"RCB", role:"BWL", credits:5.5,  nationality:"IND", capped:false },
  { name:"Jacob Duffy",        team:"RCB", role:"BWL", credits:7.5,  nationality:"OVS", capped:true  },
  { name:"Mangesh Yadav",      team:"RCB", role:"AR",  credits:6.0,  nationality:"IND", capped:false },
  { name:"Satvik Deswal",      team:"RCB", role:"AR",  credits:5.5,  nationality:"IND", capped:false },
  { name:"Kanishk Chouhan",    team:"RCB", role:"AR",  credits:5.0,  nationality:"IND", capped:false },
  { name:"Vihaan Malhotra",    team:"RCB", role:"AR",  credits:5.0,  nationality:"IND", capped:false },
  { name:"Vicky Ostwal",       team:"RCB", role:"AR",  credits:6.5,  nationality:"IND", capped:false },

  // ── SRH ──────────────────────────────────────────────────────────
  { name:"Travis Head",        team:"SRH", role:"BAT", credits:10.5, nationality:"OVS", capped:true  },
  { name:"Pat Cummins",        team:"SRH", role:"BWL", credits:10.5, nationality:"OVS", capped:true  },
  { name:"Abhishek Sharma",    team:"SRH", role:"AR",  credits:9.5,  nationality:"IND", capped:true  },
  { name:"Ishan Kishan",       team:"SRH", role:"WK",  credits:9.5,  nationality:"IND", capped:true  },
  { name:"Heinrich Klaasen",   team:"SRH", role:"WK",  credits:9.0,  nationality:"OVS", capped:true  },
  { name:"Nitish Kumar Reddy", team:"SRH", role:"AR",  credits:9.0,  nationality:"IND", capped:true  },
  { name:"Kamindu Mendis",     team:"SRH", role:"AR",  credits:8.5,  nationality:"OVS", capped:true  },
  { name:"Harshal Patel",      team:"SRH", role:"BWL", credits:8.5,  nationality:"IND", capped:true  },
  { name:"Gerald Coetzee",     team:"SRH", role:"BWL", credits:8.5,  nationality:"OVS", capped:true  },
  { name:"Dilshan Madushanka", team:"SRH", role:"BWL", credits:8.0,  nationality:"OVS", capped:true  },
  { name:"Liam Livingstone",   team:"SRH", role:"AR",  credits:9.0,  nationality:"OVS", capped:true  },
  { name:"Shivam Mavi",        team:"SRH", role:"BWL", credits:8.0,  nationality:"IND", capped:true  },
  { name:"Jaydev Unadkat",     team:"SRH", role:"BWL", credits:7.5,  nationality:"IND", capped:true  },
  { name:"Eshan Malinga",      team:"SRH", role:"BWL", credits:7.0,  nationality:"OVS", capped:true  },
  { name:"Zeeshan Ansari",     team:"SRH", role:"BWL", credits:6.5,  nationality:"IND", capped:false },
  { name:"Aniket Verma",       team:"SRH", role:"BAT", credits:6.5,  nationality:"IND", capped:false },
  { name:"R Smaran",           team:"SRH", role:"BAT", credits:6.0,  nationality:"IND", capped:false },
  { name:"Harsh Dubey",        team:"SRH", role:"BWL", credits:6.0,  nationality:"IND", capped:false },
  { name:"Shivang Kumar",      team:"SRH", role:"BAT", credits:5.5,  nationality:"IND", capped:false },
  { name:"Salil Arora",        team:"SRH", role:"BWL", credits:5.0,  nationality:"IND", capped:false },
  { name:"Praful Hinge",       team:"SRH", role:"BWL", credits:5.0,  nationality:"IND", capped:false },
  { name:"Amit Kumar",         team:"SRH", role:"BWL", credits:5.0,  nationality:"IND", capped:false },
  { name:"Onkar Tarmale",      team:"SRH", role:"BWL", credits:5.0,  nationality:"IND", capped:false },
  { name:"Sakib Hussain",      team:"SRH", role:"BWL", credits:5.0,  nationality:"IND", capped:false },
  { name:"Krains Fuletra",     team:"SRH", role:"BWL", credits:5.0,  nationality:"IND", capped:false },
];

// ── Helper functions ─────────────────────────────────────────────────
export function getPlayersByTeam(team: string): IPLPlayer[] {
  return ALL_IPL_2026_PLAYERS.filter(p => p.team === team);
}

export function getPlayersByRole(role: string): IPLPlayer[] {
  return ALL_IPL_2026_PLAYERS.filter(p => p.role === role);
}

export function getMarqueePlayers(): IPLPlayer[] {
  return ALL_IPL_2026_PLAYERS.filter(p => getPlayerTier(p.credits) === "T1");
}

export const PLAYER_COUNT = ALL_IPL_2026_PLAYERS.length;

// Backward-compat alias
export const IPL_2026_PLAYERS = ALL_IPL_2026_PLAYERS;
