/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const CLASSES = ["Primary 3", "JSS 3", "SS 1", "JSSCE (WAEC)"] as const;
export type ClassLevel = (typeof CLASSES)[number];

export const DEPARTMENTS = ["Science", "Arts", "Commercial", "General"] as const;
export type Department = (typeof DEPARTMENTS)[number];

export interface Subject {
  name: string;
  topics: string[];
}

export const SYLLABUS: Record<ClassLevel, Record<string, Subject[]>> = {
  "Primary 3": {
    General: [
      {
        name: "English Studies",
        topics: ["Phonetics", "Reading comprehension", "Parts of speech (nouns, pronouns, verbs)", "Creative writing", "Listening skills"],
      },
      {
        name: "Mathematics",
        topics: ["Addition/Subtraction of 4-digit numbers", "Introduction to fractions", "Multiplication tables (1-12)", "Telling time", "Basic geometry"],
      },
      {
        name: "Basic Science & Tech",
        topics: ["The human body", "Plants and animals", "States of matter (solids, liquids, gases)", "Simple machines"],
      },
      {
        name: "Social Studies",
        topics: ["Family roles", "Community leadership", "Hygiene", "Physical features of the environment"],
      },
      {
        name: "Civic Education",
        topics: ["National symbols", "Rights and duties of citizens", "Values like honesty and cooperation"],
      },
      {
        name: "Religious Studies",
        topics: ["Stories of prophets/Jesus", "Moral lessons", "Religious festivals"],
      },
      {
        name: "Cultural & Creative Arts",
        topics: ["Introduction to drawing", "Traditional songs", "Basic crafts using local materials"],
      },
    ],
  },
  "JSS 3": {
    General: [
      {
        name: "English Studies",
        topics: ["Complex sentence structures", "Formal/informal letters", "Summary writing", "Literature (drama and poetry)"],
      },
      {
        name: "Mathematics",
        topics: ["Simultaneous equations", "Factorization", "Area of plane shapes", "Trigonometry (SOH CAH TOA)", "Probability"],
      },
      {
        name: "Basic Science",
        topics: ["Living and non-living things", "The respiratory system", "Kinetic and potential energy", "Electrical circuits"],
      },
      {
        name: "Basic Technology",
        topics: ["Technical drawing (orthographic projection)", "Metalwork", "Woodwork", "Building construction basics"],
      },
      {
        name: "Social Studies",
        topics: ["World transport systems", "Population", "Social issues (cultism, drug abuse)", "International organizations"],
      },
      {
        name: "Civic Education",
        topics: ["The Constitution", "The rule of law", "Protection of human rights", "Democratic processes"],
      },
      {
        name: "Business Studies",
        topics: ["Bookkeeping", "Office practice", "Shorthand", "Introduction to commerce"],
      },
      {
        name: "Agricultural Science",
        topics: ["Farm records", "Livestock management", "Fishery", "Agricultural extension services"],
      },
      {
        name: "Computer Science",
        topics: ["Logic gates", "Spreadsheets (Excel)", "Internet safety", "Introduction to high-level languages"],
      },
    ],
  },
  "SS 1": {
    Core: [
      {
        name: "English Language",
        topics: ["Lexis and structure", "Essay writing (narrative, descriptive, argumentative)", "Comprehension techniques"],
      },
      {
        name: "Mathematics",
        topics: ["Number bases", "Modular arithmetic", "Indices and logarithms", "Sets", "Quadratic equations"],
      },
      {
        name: "Economics",
        topics: ["Basic tools of economic analysis", "Demand and supply", "Production"],
      },
      {
        name: "Government",
        topics: ["Definitions of government", "State and nation", "Types of government"],
      },
    ],
    Arts: [
      {
        name: "Literature in English",
        topics: ["Introduction to literature", "Literary devices", "Drama", "Poetry"],
      },
    ],
    Science: [
      {
        name: "Biology",
        topics: ["Classification of living things", "The cell", "Ecology"],
      },
    ],
    Commercial: [
      {
        name: "Financial Accounting",
        topics: ["Introduction to accounting", "Bookkeeping", "Journal entries"],
      },
    ],
  },
  "JSSCE (WAEC)": {
    General: [
      {
        name: "Mathematics (Standard)",
        topics: ["Algebraic processes", "Geometrical constructions", "Mensuration", "Statistics (Mean, Mode, Median)", "Number and Numeration"],
      },
      {
        name: "English (Standard)",
        topics: ["Essay writing skills", "Comprehension & Summary", "Oral English (Consonants & Vowels)", "Grammar usage"],
      },
      {
        name: "Integrated Science",
        topics: ["EnvironmentalPollution", "Human and biological concepts", "Chemical bonding", "Energy and work"],
      },
      {
        name: "Social Studies (WAEC)",
        topics: ["National Consciousness", "Governance in Nigeria", "Global awareness", "Conflict resolution"],
      },
    ],
  },
};
