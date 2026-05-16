/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface TheoryQuestion {
  id: string;
  question: string;
  answerKey: string; // Model answer for comparison
}

export interface BECEChallenge {
  subject: string;
  mcqs: MCQQuestion[];
  theory: TheoryQuestion[];
}

export const BECE_DATA: Record<string, BECEChallenge> = {
  "English Studies": {
    subject: "English Studies",
    mcqs: [
      {
        id: "e1",
        question: "The principal, as well as the teachers, ____ expected at the meeting.",
        options: ["are", "is", "were", "have been"],
        correctAnswer: "is",
        explanation: "When 'as well as' is used, the verb agrees with the first subject (The principal)."
      },
      {
        id: "e2",
        question: "The lawyer's argument was *lucid*.",
        options: ["confusing", "clear", "long", "angry"],
        correctAnswer: "clear",
        explanation: "Lucid means clear and easy to understand."
      },
      {
        id: "e3",
        question: "She ran *fast* to catch the bus. Identify the part of speech of the underlined word.",
        options: ["adjective", "adverb", "noun", "conjunction"],
        correctAnswer: "adverb",
        explanation: "Fast describes how she ran, so it is an adverb."
      },
      {
        id: "e4",
        question: "Choose the correctly spelled word.",
        options: ["occassion", "occasion", "ocasion", "ocassion"],
        correctAnswer: "occasion"
      },
      {
        id: "e5",
        question: "Change to passive voice: 'The boy broke the window.'",
        options: ["The window breaks the boy.", "The window was broken by the boy.", "The boy has broken the window.", "The window is being broken."],
        correctAnswer: "The window was broken by the boy."
      },
      {
        id: "e6",
        question: "He congratulated her ____ her success.",
        options: ["for", "on", "at", "with"],
        correctAnswer: "on"
      },
      {
        id: "e7",
        question: "Select the antonym of *rough*.",
        options: ["hard", "smooth", "difficult", "long"],
        correctAnswer: "smooth"
      },
      {
        id: "e8",
        question: "Which of these is a compound sentence?",
        options: ["Although it rained, we went out.", "He likes tea and she likes coffee.", "The tall man walked home.", "I saw the boy who stole it."],
        correctAnswer: "He likes tea and she likes coffee."
      },
      {
        id: "e9",
        question: "You haven't seen the keys, ____?",
        options: ["have you", "haven't you", "did you", "do you"],
        correctAnswer: "have you"
      },
      {
        id: "e10",
        question: "Choose the correctly punctuated sentence.",
        options: ["Where are you going. asked John.", "\"Where are you going?\" asked John.", "Where are you going? asked John", "\"Where are you going,\" asked John."],
        correctAnswer: "\"Where are you going?\" asked John."
      },
      {
        id: "e11",
        question: "It's a long way to the village. Identify the function of 'It's'.",
        options: ["Its", "It's", "Its'", "It is"],
        correctAnswer: "It is"
      },
      {
        id: "e12",
        question: "He is the ____ of the two brothers.",
        options: ["tallest", "taller", "most tall", "more tall"],
        correctAnswer: "taller"
      },
      {
        id: "e13",
        question: "The soldiers showed *valour* during the battle. (Select Opposite)",
        options: ["courage", "cowardice", "bravery", "fearlessness"],
        correctAnswer: "cowardice"
      },
      {
        id: "e14",
        question: "I ____ my homework before my father arrived.",
        options: ["have finished", "finish", "had finished", "was finishing"],
        correctAnswer: "had finished"
      },
      {
        id: "e15",
        question: "The jury ____ reached a final decision.",
        options: ["have", "were", "has", "are"],
        correctAnswer: "has"
      },
      {
        id: "e16",
        question: "I prefer yam ____ rice.",
        options: ["than", "to", "for", "over"],
        correctAnswer: "to"
      },
      {
        id: "e17",
        question: "The boy ____ I spoke to is my cousin.",
        options: ["who", "whom", "whose", "which"],
        correctAnswer: "whom"
      },
      {
        id: "e18",
        question: "Select the correctly spelled word.",
        options: ["Maintenance", "Maintainance", "Maintenence", "Mentainance"],
        correctAnswer: "Maintenance"
      },
      {
        id: "e19",
        question: "To 'kick the bucket' means:",
        options: ["To play", "To be angry", "To die", "To fetch water"],
        correctAnswer: "To die"
      },
      {
        id: "e20",
        question: "The *informations* given to the police were false. Identify the error.",
        options: ["informations", "given to", "the police", "were false"],
        correctAnswer: "informations"
      }
    ],
    theory: [
      {
        id: "et1",
        question: "Write a short paragraph about your favorite holiday destination.",
        answerKey: "The response should be grammatically correct and describe a specific location with reasons for preference."
      },
      {
        id: "et2",
        question: "Explain the difference between a phrase and a clause.",
        answerKey: "A phrase is a group of words without a subject-verb unit, while a clause contains a subject and a verb."
      },
      {
        id: "et3",
        question: "What is an intransitive verb? Give two examples.",
        answerKey: "An intransitive verb does not take a direct object. Examples: sleep, arrive."
      },
      {
        id: "et4",
        question: "Define 'Alliteration' and provide an original example.",
        answerKey: "Alliteration is the repetition of initial consonant sounds. Example: Peter Piper picked a peck of pickled peppers."
      },
      {
        id: "et5",
        question: "Differentiate between formal and informal letters.",
        answerKey: "Formal letters are for official use with two addresses and strict structure; informal letters are for friends/family with one address and casual tone."
      }
    ]
  },
  "Mathematics": {
    subject: "Mathematics",
    mcqs: [
      {
        id: "m1",
        question: "If x : y = 2 : 3 and y : z = 4 : 5, find the ratio x : y : z.",
        options: ["2 : 4 : 5", "8 : 12 : 15", "6 : 7 : 8", "8 : 10 : 15"],
        correctAnswer: "8 : 12 : 15"
      },
      {
        id: "m2",
        question: "Simplify 2/3(x - 1) - 1/2(x - 2).",
        options: ["(x + 2)/6", "(x - 2)/6", "(x + 10)/6", "x + 2"],
        correctAnswer: "(x + 10)/6"
      },
      {
        id: "m3",
        question: "A cylinder has a radius of 7cm and a height of 10cm. Calculate its curved surface area. (π = 22/7)",
        options: ["154cm²", "440cm²", "1540cm²", "594cm²"],
        correctAnswer: "440cm²"
      },
      {
        id: "m4",
        question: "In a class of 40 students, 25 offer Biology and 18 offer Chemistry. If 5 students offer neither, how many offer both?",
        options: ["43", "8", "13", "3"],
        correctAnswer: "8"
      },
      {
        id: "m5",
        question: "Find the sum of the interior angles of a regular hexagon.",
        options: ["360°", "720°", "540°", "1080°"],
        correctAnswer: "720°"
      },
      {
        id: "m6",
        question: "Express 0.0000452 in standard form.",
        options: ["4.52 x 10^5", "4.52 x 10^-5", "45.2 x 10^-6", "0.452 x 10^-4"],
        correctAnswer: "4.52 x 10^-5"
      },
      {
        id: "m7",
        question: "Calculate the simple interest on $5000 for 3 years at 4% per annum.",
        options: ["$600", "$200", "$5600", "$150"],
        correctAnswer: "$600"
      },
      {
        id: "m8",
        question: "If √(2x + 1) = 5, find the value of x.",
        options: ["2", "12", "24", "4"],
        correctAnswer: "12"
      },
      {
        id: "m9",
        question: "Which of the following is a factor of x² - 5x + 6?",
        options: ["(x + 2)", "(x - 3)", "(x + 3)", "(x - 6)"],
        correctAnswer: "(x - 3)"
      },
      {
        id: "m10",
        question: "The mean of five numbers is 12. If four of the numbers are 10, 15, 8, and 14, find the fifth number.",
        options: ["12", "13", "11", "15"],
        correctAnswer: "13"
      },
      {
        id: "m11",
        question: "Find the median of the following set of scores: 12, 18, 14, 20, 12, 10, 16.",
        options: ["12", "14", "15", "16"],
        correctAnswer: "14"
      },
      {
        id: "m12",
        question: "If 3x + 4 = 19 - 2x, what is the value of x?",
        options: ["3", "5", "13", "23"],
        correctAnswer: "3"
      },
      {
        id: "m13",
        question: "A bag contains 4 red, 3 blue, and 5 green balls. If a ball is picked at random, what is the probability that it is not blue?",
        options: ["1/4", "3/4", "3/12", "9/12"],
        correctAnswer: "9/12"
      },
      {
        id: "m14",
        question: "Convert 1101₂ to a base ten number.",
        options: ["10", "11", "13", "15"],
        correctAnswer: "13"
      },
      {
        id: "m15",
        question: "The interior angle of a regular polygon is 144°. How many sides does the polygon have?",
        options: ["8", "10", "12", "15"],
        correctAnswer: "10"
      },
      {
        id: "m16",
        question: "Solve for y: y/2 + 3 = y/3 + 5.",
        options: ["6", "10", "12", "15"],
        correctAnswer: "12"
      },
      {
        id: "m17",
        question: "Calculate the area of a circle whose circumference is 44cm. (π = 22/7)",
        options: ["154cm²", "44cm²", "616cm²", "77cm²"],
        correctAnswer: "154cm²"
      },
      {
        id: "m18",
        question: "A dress marked at N8,000 was sold at a 15% discount. How much was paid?",
        options: ["N1,200", "N6,500", "N6,800", "N7,200"],
        correctAnswer: "N6,800"
      },
      {
        id: "m19",
        question: "If the scale of a map is 1:50,000, what is the actual distance in km of a road that is 4cm on the map?",
        options: ["2km", "20km", "0.2km", "200km"],
        correctAnswer: "2km"
      },
      {
        id: "m20",
        question: "Simplify √50 + √18.",
        options: ["√68", "8√2", "15√2", "4√2"],
        correctAnswer: "8√2"
      }
    ],
    theory: [
      {
        id: "mt1",
        question: "Solve the equation: 5x + 10 = 3x + 24.",
        answerKey: "2x = 14 => x = 7"
      },
      {
        id: "mt2",
        question: "A rectangle has a perimeter of 40cm. If the length is 3 times the width, find the area.",
        answerKey: "2(3w + w) = 40 => 8w = 40 => w=5, l=15. Area = 75cm²"
      },
      {
        id: "mt3",
        question: "Construct a triangle ABC where AB=6cm, BC=8cm and angle B = 90 degrees.",
        answerKey: "Steps: Draw AB, use protractor for 90 at B, measure 8cm to C, join AC."
      },
      {
        id: "mt4",
        question: "Calculate the volume of a sphere with radius 3cm. (Take π = 3.14)",
        answerKey: "V = 4/3 * π * r³ = 4/3 * 3.14 * 27 = 113.04 cm³"
      },
      {
        id: "mt5",
        question: "If a die is rolled once, what is the probability of getting a prime number?",
        answerKey: "Prime numbers: 2, 3, 5. Total outcomes: 6. Probability = 3/6 = 1/2"
      }
    ]
  },
  "Basic Science": {
    subject: "Basic Science",
    mcqs: [
      {
        id: "s1",
        question: "Which of the following is a non-renewable source of energy?",
        options: ["Sun", "Wind", "Coal", "Water"],
        correctAnswer: "Coal"
      },
      {
        id: "s2",
        question: "The process by which green plants manufacture their food is ____.",
        options: ["Respiration", "Photosynthesis", "Transpiration", "Digestion"],
        correctAnswer: "Photosynthesis"
      },
      {
        id: "s3",
        question: "The smallest unit of an element that can take part in a chemical reaction is ____.",
        options: ["Molecule", "Atom", "Ion", "Compound"],
        correctAnswer: "Atom"
      },
      {
        id: "s4",
        question: "A solution with a pH of 2 is considered ____.",
        options: ["Strongly alkaline", "Weakly acidic", "Neutral", "Strongly acidic"],
        correctAnswer: "Strongly acidic"
      },
      {
        id: "s5",
        question: "The part of the eye that regulates the amount of light entering is the ____.",
        options: ["Retina", "Iris", "Lens", "Cornea"],
        correctAnswer: "Iris"
      },
      {
        id: "s6",
        question: "Which of these is a vector quantity?",
        options: ["Mass", "Distance", "Speed", "Force"],
        correctAnswer: "Force"
      },
      {
        id: "s7",
        question: "The deficiency of Vitamin C causes a disease known as ____.",
        options: ["Rickets", "Scurvy", "Beri-beri", "Pellagra"],
        correctAnswer: "Scurvy"
      },
      {
        id: "s8",
        question: "Which organ is responsible for pumping blood in the human body?",
        options: ["Lungs", "Liver", "Heart", "Kidney"],
        correctAnswer: "Heart"
      },
      {
        id: "s9",
        question: "The boiling point of pure water at standard atmospheric pressure is ____.",
        options: ["0°C", "50°C", "100°C", "120°C"],
        correctAnswer: "100°C"
      },
      {
        id: "s10",
        question: "Which of these is a mammal that can fly?",
        options: ["Eagle", "Bat", "Butterfly", "Ostrich"],
        correctAnswer: "Bat"
      }
    ],
    theory: [
      {
        id: "st1",
        question: "Explain the law of conservation of energy.",
        answerKey: "Energy cannot be created or destroyed, only transformed from one form to another."
      },
      {
        id: "st2",
        question: "List three differences between living and non-living things.",
        answerKey: "Living things: grow, reproduce, move on their own, respond to stimuli, require nutrition."
      },
      {
        id: "st3",
        question: "Describe the function of the human heart.",
        answerKey: "The heart pumps oxygenated blood to the body and deoxygenated blood to the lungs."
      },
      {
        id: "st4",
        question: "What is pollination? Mention two agents of pollination.",
        answerKey: "Pollination is the transfer of pollen from anther to stigma. Agents: wind, insects, water."
      },
      {
        id: "st5",
        question: "Explain the term 'Erosion' and state one way to prevent it.",
        answerKey: "Erosion is the washing away of topsoil by wind or water. Prevention: planting trees (afforestation)."
      }
    ]
  },
  "Social Studies": {
    subject: "Social Studies",
    mcqs: [
      {
        id: "ss1",
        question: "Which of the following is a primary source of history?",
        options: ["Oral tradition", "History books", "Magazines", "Encyclopedias"],
        correctAnswer: "Oral tradition"
      },
      {
        id: "ss2",
        question: "The main reason for the establishment of ECOWAS is...",
        options: ["Military alliance", "Economic integration", "Religious unity", "Cultural exchange"],
        correctAnswer: "Economic integration"
      },
      {
        id: "ss3",
        question: "Identify the role of the Legislature in a democratic state.",
        options: ["To execute laws", "To interpret laws", "To make laws", "To punish criminals"],
        correctAnswer: "To make laws"
      },
      {
        id: "ss4",
        question: "In bookkeeping, the 'Double Entry' principle states that...",
        options: ["Every debit has a credit", "Everything is written twice", "Two people sign every check", "Only cash is recorded"],
        correctAnswer: "Every debit has a credit"
      },
      {
        id: "ss5",
        question: "Which office document serves as a proof of payment?",
        options: ["Invoice", "Receipt", "Delivery note", "Requisition form"],
        correctAnswer: "Receipt"
      },
      {
        id: "ss6",
        question: "Identify one way of preventing soil erosion.",
        options: ["Overgrazing", "Bush burning", "Contour plowing", "Deforestation"],
        correctAnswer: "Contour plowing"
      },
      {
        id: "ss7",
        question: "What is 'Petty Cash'?",
        options: ["Money for big projects", "Money for small office expenses", "Gold coins", "Foreign currency"],
        correctAnswer: "Money for small office expenses"
      },
      {
        id: "ss8",
        question: "What is the gestation period of a sow?",
        options: ["3 months, 3 weeks, 3 days", "9 months", "5 months", "114 days"],
        correctAnswer: "114 days"
      },
      {
        id: "ss9",
        question: "Governance in Nigeria is primarily divided into how many tiers?",
        options: ["Two", "Three", "Four", "Five"],
        correctAnswer: "Three"
      },
      {
        id: "ss10",
        question: "Conflict resolution is best achieved through:",
        options: ["Fighting", "Dialogue", "Ignoring the issue", "Social media"],
        correctAnswer: "Dialogue"
      }
    ],
    theory: [
      {
        id: "sst1",
        question: "Define the term 'Sustainable Development'.",
        answerKey: "Development that meets the needs of the present without compromising the ability of future generations to meet their own needs."
      },
      {
        id: "sst2",
        question: "Explain how superstition affects community development.",
        answerKey: "It breeds fear, limits scientific thinking, hinders modern healthcare adoption, and can lead to victimization of innocent people."
      },
      {
        id: "sst3",
        question: "Describe the function of a Central Bank vs a Commercial Bank.",
        answerKey: "Central Bank: regulates money supply, issues currency, banker to government. Commercial Bank: accepts deposits, gives loans to individuals/businesses."
      },
      {
        id: "sst4",
        question: "Mention three qualities of a successful entrepreneur.",
        answerKey: "Risk-taking, innovation, perseverance, good management skills."
      },
      {
        id: "sst5",
        question: "State two advantages of organic manure over chemical fertilizer.",
        answerKey: "Improves soil structure long-term, more environmentally friendly/biodegradable, cheaper for local farmers."
      }
    ]
  }
};
