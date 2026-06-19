const ADJECTIVES = [
  "Anonymous", "Mystery", "Shadow", "Cosmic",
  "Silent", "Wandering", "Hidden", "Unknown",
];

const ANIMALS: { name: string; emoji: string }[] = [
  { name: "Panda",  emoji: "🐼" },
  { name: "Fox",    emoji: "🦊" },
  { name: "Wolf",   emoji: "🐺" },
  { name: "Owl",    emoji: "🦉" },
  { name: "Tiger",  emoji: "🐯" },
  { name: "Bear",   emoji: "🐻" },
  { name: "Rabbit", emoji: "🐰" },
  { name: "Dragon", emoji: "🐲" },
  { name: "Eagle",  emoji: "🦅" },
  { name: "Shark",  emoji: "🦈" },
];

// djb2-style hash with a seed so the same string produces
// independent values when called with different seeds.
function hash(str: string, seed: number): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

// Shared index so name and emoji always refer to the same animal.
function animalIndex(peerId: string): number {
  return hash(peerId, 1) % ANIMALS.length;
}

export function generateName(peerId: string): string {
  const adj = ADJECTIVES[hash(peerId, 0) % ADJECTIVES.length];
  return `${adj} ${ANIMALS[animalIndex(peerId)].name}`;
}

export function generateAnimalEmoji(peerId: string): string {
  return ANIMALS[animalIndex(peerId)].emoji;
}

export function generateColor(peerId: string): string {
  const hue = hash(peerId, 2) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}
