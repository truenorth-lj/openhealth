/**
 * Generate blog cover images using Sharp.
 * Creates clean gradient covers with text overlays.
 *
 * Usage:
 *   cd apps/web && npx tsx src/server/db/seed/generate-blog-covers.ts
 */
import sharp from "sharp";
import path from "path";

const OUTPUT_DIR = path.resolve(__dirname, "../../../../public/blog");

interface CoverConfig {
  filename: string;
  title: string;
  subtitle: string;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  icon: string; // SVG path for the icon
}

const covers: CoverConfig[] = [
  {
    filename: "mfp-alternatives-cover.png",
    title: "10 Best MyFitnessPal",
    subtitle: "Alternatives 2026",
    gradientFrom: "#0f172a",
    gradientTo: "#1e3a5f",
    accentColor: "#22c55e",
    icon: `<g transform="translate(900,80) scale(0.8)">
      <!-- Phone 1 -->
      <rect x="0" y="0" width="80" height="140" rx="12" fill="none" stroke="#22c55e" stroke-width="3" opacity="0.9"/>
      <rect x="10" y="20" width="60" height="8" rx="4" fill="#22c55e" opacity="0.5"/>
      <rect x="10" y="35" width="40" height="8" rx="4" fill="#22c55e" opacity="0.3"/>
      <rect x="10" y="50" width="50" height="8" rx="4" fill="#22c55e" opacity="0.4"/>
      <!-- Phone 2 -->
      <rect x="100" y="20" width="80" height="140" rx="12" fill="none" stroke="#22c55e" stroke-width="3" opacity="0.7"/>
      <rect x="110" y="40" width="60" height="8" rx="4" fill="#22c55e" opacity="0.4"/>
      <rect x="110" y="55" width="40" height="8" rx="4" fill="#22c55e" opacity="0.3"/>
      <rect x="110" y="70" width="50" height="8" rx="4" fill="#22c55e" opacity="0.5"/>
      <!-- Phone 3 -->
      <rect x="200" y="40" width="80" height="140" rx="12" fill="none" stroke="#22c55e" stroke-width="3" opacity="0.5"/>
      <rect x="210" y="60" width="60" height="8" rx="4" fill="#22c55e" opacity="0.3"/>
      <rect x="210" y="75" width="40" height="8" rx="4" fill="#22c55e" opacity="0.4"/>
      <!-- Arrows -->
      <line x1="85" y1="70" x2="95" y2="70" stroke="#22c55e" stroke-width="2" opacity="0.6"/>
      <line x1="185" y1="90" x2="195" y2="90" stroke="#22c55e" stroke-width="2" opacity="0.6"/>
    </g>`,
  },
  {
    filename: "ai-calorie-tracking-cover.png",
    title: "AI Photo Calorie",
    subtitle: "Tracking: 5 Apps Tested",
    gradientFrom: "#0f172a",
    gradientTo: "#1a1a3e",
    accentColor: "#8b5cf6",
    icon: `<g transform="translate(920,70) scale(0.9)">
      <!-- Camera lens -->
      <circle cx="100" cy="100" r="80" fill="none" stroke="#8b5cf6" stroke-width="3" opacity="0.8"/>
      <circle cx="100" cy="100" r="55" fill="none" stroke="#8b5cf6" stroke-width="2" opacity="0.5"/>
      <circle cx="100" cy="100" r="30" fill="none" stroke="#8b5cf6" stroke-width="2" opacity="0.7"/>
      <!-- AI sparkles -->
      <circle cx="40" cy="30" r="4" fill="#8b5cf6" opacity="0.6"/>
      <circle cx="170" cy="40" r="3" fill="#8b5cf6" opacity="0.5"/>
      <circle cx="160" cy="170" r="5" fill="#8b5cf6" opacity="0.4"/>
      <circle cx="30" cy="160" r="3" fill="#8b5cf6" opacity="0.5"/>
      <!-- Scan lines -->
      <line x1="60" y1="100" x2="140" y2="100" stroke="#8b5cf6" stroke-width="1" opacity="0.3" stroke-dasharray="4,4"/>
      <line x1="100" y1="60" x2="100" y2="140" stroke="#8b5cf6" stroke-width="1" opacity="0.3" stroke-dasharray="4,4"/>
    </g>`,
  },
  {
    filename: "beginners-guide-cover.png",
    title: "Beginner's Guide to",
    subtitle: "Food Tracking &amp; Calories",
    gradientFrom: "#0f172a",
    gradientTo: "#14532d",
    accentColor: "#22c55e",
    icon: `<g transform="translate(910,60) scale(0.85)">
      <!-- Checklist / clipboard -->
      <rect x="40" y="0" width="160" height="200" rx="14" fill="none" stroke="#22c55e" stroke-width="3" opacity="0.8"/>
      <rect x="80" y="-10" width="80" height="20" rx="10" fill="#22c55e" opacity="0.3"/>
      <!-- Check items -->
      <rect x="65" y="40" width="16" height="16" rx="4" fill="none" stroke="#22c55e" stroke-width="2" opacity="0.7"/>
      <polyline points="68,48 73,53 81,43" fill="none" stroke="#22c55e" stroke-width="2" opacity="0.7"/>
      <rect x="90" y="43" width="80" height="10" rx="5" fill="#22c55e" opacity="0.3"/>
      <rect x="65" y="75" width="16" height="16" rx="4" fill="none" stroke="#22c55e" stroke-width="2" opacity="0.7"/>
      <polyline points="68,83 73,88 81,78" fill="none" stroke="#22c55e" stroke-width="2" opacity="0.7"/>
      <rect x="90" y="78" width="60" height="10" rx="5" fill="#22c55e" opacity="0.3"/>
      <rect x="65" y="110" width="16" height="16" rx="4" fill="none" stroke="#22c55e" stroke-width="2" opacity="0.5"/>
      <rect x="90" y="113" width="70" height="10" rx="5" fill="#22c55e" opacity="0.2"/>
      <rect x="65" y="145" width="16" height="16" rx="4" fill="none" stroke="#22c55e" stroke-width="2" opacity="0.4"/>
      <rect x="90" y="148" width="50" height="10" rx="5" fill="#22c55e" opacity="0.15"/>
    </g>`,
  },
];

function createSvg(config: CoverConfig): string {
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${config.gradientFrom};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${config.gradientTo};stop-opacity:1" />
    </linearGradient>
    <!-- Subtle grid pattern -->
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${config.accentColor}" stroke-width="0.5" opacity="0.08"/>
    </pattern>
    <!-- Glow effect -->
    <radialGradient id="glow" cx="75%" cy="40%" r="40%">
      <stop offset="0%" style="stop-color:${config.accentColor};stop-opacity:0.15" />
      <stop offset="100%" style="stop-color:${config.accentColor};stop-opacity:0" />
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Decorative corner accent -->
  <rect x="0" y="0" width="6" height="630" fill="${config.accentColor}" opacity="0.8"/>

  <!-- OH Logo -->
  <text x="60" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700" fill="white" opacity="0.6">Open Health</text>

  <!-- Title -->
  <text x="60" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="800" fill="white" letter-spacing="-1">${config.title}</text>
  <text x="60" y="350" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="800" fill="${config.accentColor}" letter-spacing="-1">${config.subtitle}</text>

  <!-- Subtitle line -->
  <rect x="60" y="380" width="120" height="4" rx="2" fill="${config.accentColor}" opacity="0.8"/>

  <!-- Blog tag -->
  <rect x="60" y="520" width="110" height="36" rx="18" fill="${config.accentColor}" opacity="0.15"/>
  <text x="82" y="544" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="${config.accentColor}">Blog Post</text>

  <!-- URL -->
  <text x="60" y="600" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="white" opacity="0.4">openhealth.blog</text>

  <!-- Icon -->
  ${config.icon}
</svg>`;
}

async function main() {
  for (const config of covers) {
    const svg = createSvg(config);
    const outputPath = path.join(OUTPUT_DIR, config.filename);
    await sharp(Buffer.from(svg)).png({ quality: 90 }).toFile(outputPath);
    console.log(`Generated: ${config.filename}`);
  }
  console.log("Done! All covers generated.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
