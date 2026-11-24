
const HEART_STYLES = [
  {
    name: 'Ruby Galaxy',
    colors: ['#ff1744', '#ff5c8a', '#8e0038'],
    glow: '#ff1744',
  },
  {
    name: 'Ocean Diamond',
    colors: ['#00e5ff', '#2979ff', '#120078'],
    glow: '#00e5ff',
  },
  {
    name: 'Golden Eternity',
    colors: ['#fff176', '#ffb300', '#ff6f00'],
    glow: '#ffd54f',
  },
  {
    name: 'Purple Dream',
    colors: ['#ea80fc', '#9c27b0', '#4a148c'],
    glow: '#ce93d8',
  },
  {
    name: 'Emerald Love',
    colors: ['#69f0ae', '#00c853', '#00695c'],
    glow: '#69f0ae',
  },
  {
    name: 'Rose Crystal',
    colors: ['#ff80ab', '#f50057', '#880e4f'],
    glow: '#ff80ab',
  },
  {
    name: 'Ice Diamond',
    colors: ['#e1f5fe', '#4fc3f7', '#0277bd'],
    glow: '#80d8ff',
  },
  {
    name: 'Rainbow Soul',
    colors: ['#ff5252', '#7c4dff', '#00e5ff'],
    glow: '#ff80ab',
  },
];

const PATTERNS = [
  'sparkle',
  'crystal',
  'galaxy',
  'diamond',
  'stardust',
  'aurora',
];

const SHAPES = [
  'classic',
  'royal',
  'double',
  'infinity',
  'crystal',
];

function createSeededRandom(seed) {
  let value = seed >>> 0;

  return function random() {
    value += 0x6D2B79F5;

    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(value) {
  const text = String(value);
  let hash = 2166136261;

  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function generateSurpriseHeart({
  fusionSeed,
  firstHeart,
  secondHeart,
}) {
  const seedInput =
    fusionSeed ||
    `${Date.now()}-${Math.random()}-${firstHeart || ''}-${secondHeart || ''}`;

  const seed = hashSeed(seedInput);
  const random = createSeededRandom(seed);

  const style =
    HEART_STYLES[Math.floor(random() * HEART_STYLES.length)];

  const pattern =
    PATTERNS[Math.floor(random() * PATTERNS.length)];

  const shape =
    SHAPES[Math.floor(random() * SHAPES.length)];

  return {
    id: `surprise-heart-${seed}`,
    seed,
    name: style.name,
    colors: style.colors,
    glow: style.glow,
    pattern,
    shape,
    sparkleCount: 12 + Math.floor(random() * 25),
    particleCount: 20 + Math.floor(random() * 31),
    rotation: Math.floor(random() * 31) - 15,
    createdAt: new Date().toISOString(),
  };
}

export default generateSurpriseHeart;
