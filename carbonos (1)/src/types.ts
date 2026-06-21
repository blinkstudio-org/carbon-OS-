/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OnboardingMetrics {
  transportation: {
    carType: "none" | "electric" | "hybrid" | "gas_small" | "gas_large";
    annualMileage: number; // in miles/kms
    publicTransitHours: number; // hours per week
    flightsYear: number; // number of flights per year
  };
  diet: {
    preference: "vegan" | "vegetarian" | "pescatarian" | "poultry" | "omnivore" | "meat_heavy";
    localFoodRatio: number; // 0 to 100 percentage
    foodWasteRatio: "minimal" | "average" | "high";
  };
  housing: {
    energySource: "grid_standard" | "grid_green" | "solar_private" | "nuclear_wind";
    monthlyElectricityBill: number; // USD estimated or kWh
    homeSizeSqFt: number;
    heatingSource: "gas" | "electric" | "oil" | "heat_pump";
  };
  consumer: {
    shoppingFrequency: "minimalist" | "average" | "frequent";
    recycleHabits: "always" | "sometimes" | "rarely";
    deviceUpgrades: "rarely" | "yearly" | "biyearly";
  };
}

export interface CarbonProfile {
  userId: string;
  name: string;
  onboarded: boolean;
  metrics: OnboardingMetrics;
  carbonScore: number; // 0 - 1000
  weeklyProgress: { week: string; score: number; co2: number }[];
  co2Breakdown: {
    transport: number; // kg CO2e / month
    food: number;      // kg CO2e / month
    housing: number;   // kg CO2e / month
    shopping: number;  // kg CO2e / month
  };
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  category: "transport" | "food" | "housing" | "shopping";
  co2SavedValue: number; // kg CO2
  xpReward: number;
  completed: boolean;
  claimed: boolean;
  difficulty: "easy" | "medium" | "hard";
  iconName: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  xpReward: number;
  daysRemaining: number;
  participants: number;
  type: "daily" | "weekly" | "community" | "campus";
  category: "transport" | "food" | "housing" | "shopping" | "general";
  isJoined: boolean;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  score: number; // Carbon Score
  co2Saved: number; // kg saved of monthly average
  category: "individual" | "campus" | "city";
  avatarSeed?: string;
  details?: string;
}

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  cost: number; // in Sustainability Points / XP
  category: "offset" | "giftcard" | "merch" | "hyperlocal";
  sponsor: string;
  iconName: string;
  claimed?: boolean;
}

export interface HyperlocalSpot {
  id: string;
  name: string;
  type: string; // recycling, composting, EV charger, community garden, public transit hub
  description: string;
  address: string;
  distance: string; // "0.4 miles"
  rewardMultiplier: number; // 1.5x XP
  link?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "coach";
  text: string;
  timestamp: string;
  suggestions?: string[];
}

export interface SimulationScenario {
  year: number;
  scenarioName: "Climate Collapse" | "Current Trend" | "CarbonOS Target" | "Net Zero Utopia";
  userAnnualEmissions: number; // Metric Tons CO2e
  globalPpm: number; // CO2 ppm
  temperatureRise: number; // °C increase
  seaLevelRiseCm: number;
  visualVibe: string;
  impactReport: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  estimatedCo2: number; // kg CO2
  carbonIntensity: "low" | "medium" | "high";
  ecoFriendlyAlternative: string;
}

export interface ReceiptScannerResult {
  storeName: string;
  date: string;
  items: ReceiptItem[];
  totalPrice: number;
  totalCo2: number; // kg CO2
  aiFootprintAnalysis: string;
  sustainableAlternatives: string;
}

export interface CarbonLensResult {
  detectedObject: string;
  carbonCategory: "transport" | "food" | "housing" | "shopping" | "unknown";
  estimatedCo2: number; // kg CO2 to manufacture/consume
  carbonIntensity: "very_low" | "low" | "medium" | "high" | "critical";
  alternativeText: string;
  environmentalAnalysis: string;
}
