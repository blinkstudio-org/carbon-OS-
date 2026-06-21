/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CarbonProfile,
  DailyMission,
  Challenge,
  LeaderboardEntry,
  RewardItem,
  HyperlocalSpot,
  SimulationScenario
} from "../types";

export const DEFAULT_PROFILE: CarbonProfile = {
  userId: "user_carbon_os_001",
  name: "Eco Champion",
  onboarded: false,
  metrics: {
    transportation: {
      carType: "gas_small",
      annualMileage: 12000,
      publicTransitHours: 4,
      flightsYear: 3
    },
    diet: {
      preference: "omnivore",
      localFoodRatio: 25,
      foodWasteRatio: "average"
    },
    housing: {
      energySource: "grid_standard",
      monthlyElectricityBill: 120,
      homeSizeSqFt: 1800,
      heatingSource: "gas"
    },
    consumer: {
      shoppingFrequency: "average",
      recycleHabits: "sometimes",
      deviceUpgrades: "biyearly"
    }
  },
  carbonScore: 540, // Base out of 1000 (average is ~400-600)
  weeklyProgress: [
    { week: "Week 1", score: 480, co2: 620 },
    { week: "Week 2", score: 495, co2: 605 },
    { week: "Week 3", score: 512, co2: 580 },
    { week: "Week 4", score: 540, co2: 542 }
  ],
  co2Breakdown: {
    transport: 285, // kg / month
    food: 110,
    housing: 165,
    shopping: 75
  }
};

export const INITIAL_MISSIONS: DailyMission[] = [
  {
    id: "mission_1",
    title: "Eco Transit Routine",
    description: "Replace a short car journey of less than 3 miles with either walking, cycling, or transit.",
    category: "transport",
    co2SavedValue: 1.8,
    xpReward: 150,
    completed: false,
    claimed: false,
    difficulty: "easy",
    iconName: "Bike"
  },
  {
    id: "mission_2",
    title: "Plant-Based Feast",
    description: "Prepare or purchase a fully vegan lunch or dinner instead of eating meat or dairy.",
    category: "food",
    co2SavedValue: 2.1,
    xpReward: 200,
    completed: false,
    claimed: false,
    difficulty: "medium",
    iconName: "Leaf"
  },
  {
    id: "mission_3",
    title: "Shadow Hunter",
    description: "Unplug 4 idle electronic chargers, game consoles, or appliances completely from the socket.",
    category: "housing",
    co2SavedValue: 0.6,
    xpReward: 100,
    completed: false,
    claimed: false,
    difficulty: "easy",
    iconName: "PlugZap"
  },
  {
    id: "mission_4",
    title: "Secondhand Swap",
    description: "Spend 10 minutes researching pre-owned items or thrift-shops before placing an order on retail sites.",
    category: "shopping",
    co2SavedValue: 4.5,
    xpReward: 250,
    completed: false,
    claimed: false,
    difficulty: "hard",
    iconName: "ShoppingBag"
  }
];

export const CHALLENGES: Challenge[] = [
  {
    id: "challenge_1",
    title: "Meatless Mondays Collective",
    description: "Go completely plant-based every Monday. Join other students and professionals modeling low-impact carbon lifestyles.",
    target: 4,
    current: 2,
    unit: "Mondays",
    xpReward: 500,
    daysRemaining: 18,
    participants: 1240,
    type: "community",
    category: "food",
    isJoined: true
  },
  {
    id: "challenge_2",
    title: "Campus Zero-Emission Commute",
    description: "Walk, bike, carpool, or bus to campus for all classes this week. Track activities via GPS validation log.",
    target: 5,
    current: 3,
    unit: "Days",
    xpReward: 450,
    daysRemaining: 4,
    participants: 342,
    type: "campus",
    category: "transport",
    isJoined: true
  },
  {
    id: "challenge_3",
    title: "Unplugged Weekend Sprint",
    description: "Turn off all standby electronics and drop luxury heating or AC cooling usages by 2 degrees for 48 hours straight.",
    target: 48,
    current: 0,
    unit: "Hours",
    xpReward: 600,
    daysRemaining: 2,
    participants: 812,
    type: "weekly",
    category: "housing",
    isJoined: false
  },
  {
    id: "challenge_4",
    title: "No-Single-Use Cup Run",
    description: "Bring a reusable mug or cup for coffee/drinks standard for your entire locality.",
    target: 10,
    current: 0,
    unit: "Uses",
    xpReward: 300,
    daysRemaining: 12,
    participants: 5211,
    type: "community",
    category: "shopping",
    isJoined: false
  }
];

export const LEADERBOARD: LeaderboardEntry[] = [
  {
    id: "lead_1",
    rank: 1,
    name: "Aria Sterling",
    score: 912,
    co2Saved: 142.3,
    category: "individual",
    avatarSeed: "aria",
    details: "96% Commute reduction via E-bike & Solar Microgrid"
  },
  {
    id: "lead_2",
    rank: 2,
    name: "Devon Carter",
    score: 875,
    co2Saved: 110.8,
    category: "individual",
    avatarSeed: "devon",
    details: "Vegan diet + Zero-waste compost optimization"
  },
  {
    id: "lead_3",
    rank: 3,
    name: "Marcus Aurelius",
    score: 843,
    co2Saved: 95.2,
    category: "individual",
    avatarSeed: "marcus",
    details: "100% electrified home with private storage cell"
  },
  // Campus leaderboards
  {
    id: "lead_uni_1",
    rank: 1,
    name: "Stanford Green-Alliance",
    score: 820,
    co2Saved: 5420.2,
    category: "campus",
    details: "1,200 participants • Active dynamic carpool grids"
  },
  {
    id: "lead_uni_2",
    rank: 2,
    name: "MIT Climate Lab",
    score: 795,
    co2Saved: 4850.5,
    category: "campus",
    details: "850 participants • Lab heating waste recovery nodes"
  },
  {
    id: "lead_uni_3",
    rank: 3,
    name: "UC Berkeley Carbon-Free",
    score: 782,
    co2Saved: 4620.0,
    category: "campus",
    details: "940 participants • Campus composting and thrift loop"
  },
  // City leaderboards
  {
    id: "lead_city_1",
    rank: 1,
    name: "Copenhagen Metro",
    score: 940,
    co2Saved: 85220.0,
    category: "city",
    details: "64% cycling transit split • Local heat-pump districts"
  },
  {
    id: "lead_city_2",
    rank: 2,
    name: "Austin Eco-District",
    score: 730,
    co2Saved: 42100.8,
    category: "city",
    details: "High municipal solar installation frequency"
  },
  {
    id: "lead_city_3",
    rank: 3,
    name: "Tokyo Transit Hub",
    score: 715,
    co2Saved: 38400.4,
    category: "city",
    details: "92% public commuter choice efficiency"
  }
];

export const REWARDS_SHOP: RewardItem[] = [
  {
    id: "rew_1",
    title: "1-Tree Reforestation Planting",
    description: "Plant a native species hardwood tree in California or the Amazon to perform active biomass sequestration.",
    cost: 300,
    category: "offset",
    sponsor: "One Tree Planted Alliance",
    iconName: "TreePine"
  },
  {
    id: "rew_2",
    title: "Public Transit Commuter Credits ($10)",
    description: "Redeem for automated credits loaded onto standard Clipper, Oyster, or local transit touch-payments.",
    cost: 1200,
    category: "hyperlocal",
    sponsor: "Department of Transportation",
    iconName: "Train"
  },
  {
    id: "rew_3",
    title: "$15 Patagonia Recital Voucher",
    description: "Save on durable, responsibly sourced outdoor materials, recycled polyester, or direct garment repairs.",
    cost: 1500,
    category: "merch",
    sponsor: "Patagonia Worn Wear",
    iconName: "Shirt"
  },
  {
    id: "rew_4",
    title: "Methane Digester Offset Token",
    description: "Fund organic agricultural waste containment structures capturing and combusting volatile warming gases.",
    cost: 800,
    category: "offset",
    sponsor: "Gold Standard Climate Guard",
    iconName: "Biohazard"
  }
];

export const HYPERLOCAL_SPOTS: HyperlocalSpot[] = [
  {
    id: "spot_1",
    name: "East Side Organic Composting Hub",
    type: "Compost Dropoff",
    description: "Accepts raw culinary waste, cardboards, food scraps. High carbon absorption return.",
    address: "244 Pearl St, Downtown Sector",
    distance: "0.6 miles",
    rewardMultiplier: 1.5,
    link: "https://www.google.com/maps"
  },
  {
    id: "spot_2",
    name: "Municipal Solid-Waste Recycling & Electronics Center",
    type: "E-Waste / Hazardous",
    description: "A grade recycling of heavy metals, lithium batteries, microprocessors, and heavy paper stacks.",
    address: "1080 Industrial Blvd",
    distance: "1.2 miles",
    rewardMultiplier: 2.0,
    link: "https://www.google.com/maps"
  },
  {
    id: "spot_3",
    name: "Direct Solar Supercharger Node (High Capacity)",
    type: "ECO Supercharger",
    description: "Tesla/Universal standard Supercharging terminal generating zero-indirect grid emission metrics.",
    address: "710 Green Corridor Plaza",
    distance: "0.4 miles",
    rewardMultiplier: 1.2,
    link: "https://www.google.com/maps"
  },
  {
    id: "spot_4",
    name: "Community Food Forestry & Herb Garden",
    type: "Urban Agriculture",
    description: "Volunteer workspace planting local greens and maintaining dense carbon capture ground coverage.",
    address: "88 Maple Lane Community Center",
    distance: "1.5 miles",
    rewardMultiplier: 1.8,
    link: "https://www.google.com/maps"
  }
];

export const SCENARIOS: SimulationScenario[] = [
  {
    year: 2026,
    scenarioName: "Current Trend",
    userAnnualEmissions: 14.2, // metric tons
    globalPpm: 424,
    temperatureRise: 1.2,
    seaLevelRiseCm: 0.0,
    visualVibe: "A slightly hazy horizon, common for modern metropolitan skies, with occasional high-heat advisories during July.",
    impactReport: "You are active in carbon emissions typical for average urban citizens. Extreme weather, record summer spikes, and localized water conservation requests are on-track to grow increasingly standard."
  },
  {
    year: 2036,
    scenarioName: "Climate Collapse",
    userAnnualEmissions: 18.5,
    globalPpm: 472,
    temperatureRise: 1.9,
    seaLevelRiseCm: 12.0,
    visualVibe: "A heavy amber-tinted skyline. Heavy solar damage risks, grid disruptions from heating, and scarce localized crops.",
    impactReport: "Prolonged business-as-usual and increased consumer shopping have resulted in severe localized heatwaves. Grid infrastructure fails to cope with demand, causing rotating blackouts, while seafood and imported tropical fruits are completely depleted."
  },
  {
    year: 2036,
    scenarioName: "CarbonOS Target",
    userAnnualEmissions: 6.4,
    globalPpm: 432,
    temperatureRise: 1.4,
    seaLevelRiseCm: 3.5,
    visualVibe: "Crisp cyan skies with abundant decentralized wind nodes on skylines, integrated vertical greenery absorbing particulate smog.",
    impactReport: "By sticking closely to CarbonOS suggestions, you have saved over 60 Metric Tons of cumulative CO₂! Your neighborhood is insulated by dense foliage, local energy grids are decentralized, and public transportation commutes are universally electric."
  },
  {
    year: 2056,
    scenarioName: "Net Zero Utopia",
    userAnnualEmissions: 1.2,
    globalPpm: 388,
    temperatureRise: 1.1,
    seaLevelRiseCm: 2.1,
    visualVibe: "Clear, starlit night skies visible even in cities. Urban canopies fully mitigate heat, and absolute reliance on direct solar/nuclear storage.",
    impactReport: "The ideal stabilization targets are unlocked! Global temperature increases have completely plateaued. Decisive behavioral choices alongside robust clean technology ensure healthy oceans, clean lungs, and deep integration with your local surrounding ecosystem."
  }
];
