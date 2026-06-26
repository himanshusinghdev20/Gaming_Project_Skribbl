const WORDS = {
  animals: [
    "cat", "dog", "elephant", "giraffe", "penguin", "dolphin", "tiger", "lion",
    "zebra", "kangaroo", "panda", "monkey", "parrot", "crocodile", "flamingo",
    "butterfly", "octopus", "seahorse", "gorilla", "cheetah", "wolf", "bear",
    "rabbit", "fox", "owl", "eagle", "shark", "whale", "jellyfish", "turtle"
  ],
  objects: [
    "chair", "table", "lamp", "clock", "guitar", "piano", "umbrella", "telescope",
    "compass", "backpack", "camera", "helmet", "ladder", "magnet", "microscope",
    "bicycle", "rocket", "anchor", "trophy", "lantern", "candle", "mirror",
    "scissors", "hammer", "paintbrush", "keyboard", "headphones", "glasses", "crown", "sword"
  ],
  food: [
    "pizza", "sushi", "burger", "taco", "waffle", "pancake", "donut", "cupcake",
    "spaghetti", "sandwich", "hotdog", "popcorn", "ice cream", "chocolate", "pretzel",
    "cookie", "cheesecake", "muffin", "croissant", "burrito", "ramen", "dumpling",
    "sushi roll", "french fries", "milkshake", "nachos", "spring roll", "bagel", "brownie", "pie"
  ],
  actions: [
    "running", "jumping", "swimming", "dancing", "sleeping", "cooking", "reading",
    "painting", "singing", "laughing", "crying", "flying", "climbing", "fishing",
    "surfing", "skiing", "boxing", "writing", "hugging", "thinking", "typing",
    "clapping", "waving", "stretching", "meditating", "skateboarding", "juggling", "diving", "rowing", "hiking"
  ],
  places: [
    "beach", "mountain", "forest", "castle", "lighthouse", "airport", "museum",
    "library", "hospital", "school", "stadium", "theater", "factory", "farm",
    "volcano", "desert", "jungle", "cave", "island", "waterfall", "harbor", "bridge",
    "park", "market", "temple", "pyramid", "igloo", "skyscraper", "submarine", "spaceship"
  ],
  nature: [
    "rainbow", "tornado", "volcano", "glacier", "canyon", "waterfall", "aurora",
    "thunder", "lightning", "sunrise", "sunset", "moon", "star", "comet", "meteor",
    "cloud", "snowflake", "wave", "earthquake", "tsunami", "hurricane", "fog", "hail",
    "blizzard", "drought", "flood", "eclipse", "tide", "river", "lake"
  ]
};

function getRandomWords(count = 3) {
  const allWords = Object.values(WORDS).flat();
  const shuffled = allWords.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getWordsByCategory(category, count = 3) {
  if (!WORDS[category]) return getRandomWords(count);
  const shuffled = [...WORDS[category]].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

module.exports = { WORDS, getRandomWords, getWordsByCategory };
