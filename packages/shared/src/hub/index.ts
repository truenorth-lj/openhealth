// Hub item keys — stable identifiers used in DB config
export const HUB_ITEM_KEYS = [
  // Tracking
  "diary",
  "exercise",
  "workout",
  "meditation",
  "throatExercise",
  "eyeExercise",
  "water",
  "fasting",
  "sleep",
  "weight",
  "steps",
  "postureDetection",
  "posture",
  "reminders",
  // Tools
  "documents",
  "aiAdvisor",
  "progress",
  "goals",
  "scanLabel",
  "foodDatabase",
  // Life
  "achievements",
  // Account
  "referral",
  "subscription",
  "profile",
  "notifications",
  "coaching",
  "settings",
  // Data Management
  "export",
  // Community
  "lineCommunity",
  "reportIssue",
] as const;

export type HubItemKey = (typeof HUB_ITEM_KEYS)[number];

export interface HubItemConfig {
  visible: boolean;
  order?: number;
}

export type HubUserConfig = Partial<Record<HubItemKey, HubItemConfig>>;

export interface HubItemDefinition {
  key: HubItemKey;
  sectionKey: string;
  labelKey: string;
  badgeKey?: string;
  platform?: "web" | "mobile";
  implemented: boolean;
  external?: boolean;
  defaultOrder: number;
}

// Line community URL shared across web & mobile
export const LINE_COMMUNITY_URL =
  "https://line.me/ti/g2/yoiSxP0jx7pJDEFjQtFLu87dwRsKIGnFIIkV3g?utm_source=invitation&utm_medium=link_copy&utm_campaign=default";

export const HUB_SECTIONS = [
  "hub.sections.tracking",
  "hub.sections.tools",
  "hub.sections.life",
  "hub.sections.account",
  "hub.sections.dataManagement",
  "hub.sections.community",
] as const;

export type HubSectionKey = (typeof HUB_SECTIONS)[number];

// Default hub items — source of truth for both web & mobile
export const DEFAULT_HUB_ITEMS: HubItemDefinition[] = [
  // Tracking
  { key: "diary", sectionKey: "hub.sections.tracking", labelKey: "hub.items.diary", implemented: true, defaultOrder: 0 },
  { key: "exercise", sectionKey: "hub.sections.tracking", labelKey: "hub.items.exercise", implemented: true, defaultOrder: 1 },
  { key: "workout", sectionKey: "hub.sections.tracking", labelKey: "hub.items.workout", badgeKey: "hub.badges.new", implemented: true, defaultOrder: 2 },
  { key: "meditation", sectionKey: "hub.sections.tracking", labelKey: "hub.items.meditation", badgeKey: "hub.badges.new", implemented: true, defaultOrder: 3 },
  { key: "throatExercise", sectionKey: "hub.sections.tracking", labelKey: "hub.items.throatExercise", badgeKey: "hub.badges.new", implemented: true, defaultOrder: 4 },
  { key: "eyeExercise", sectionKey: "hub.sections.tracking", labelKey: "hub.items.eyeExercise", badgeKey: "hub.badges.new", implemented: true, defaultOrder: 5 },
  { key: "water", sectionKey: "hub.sections.tracking", labelKey: "hub.items.water", implemented: true, defaultOrder: 6 },
  { key: "fasting", sectionKey: "hub.sections.tracking", labelKey: "hub.items.fasting", implemented: true, defaultOrder: 6 },
  { key: "sleep", sectionKey: "hub.sections.tracking", labelKey: "hub.items.sleep", badgeKey: "hub.badges.new", implemented: true, defaultOrder: 7 },
  { key: "weight", sectionKey: "hub.sections.tracking", labelKey: "hub.items.weight", implemented: true, defaultOrder: 8 },
  { key: "steps", sectionKey: "hub.sections.tracking", labelKey: "hub.items.steps", implemented: true, defaultOrder: 9 },
  { key: "postureDetection", sectionKey: "hub.sections.tracking", labelKey: "hub.items.postureDetection", badgeKey: "hub.badges.new", implemented: true, defaultOrder: 10 },
  { key: "posture", sectionKey: "hub.sections.tracking", labelKey: "hub.items.posture", badgeKey: "hub.badges.new", implemented: true, defaultOrder: 11 },
  { key: "reminders", sectionKey: "hub.sections.tracking", labelKey: "hub.items.reminders", badgeKey: "hub.badges.new", implemented: true, defaultOrder: 12 },
  // Tools
  { key: "documents", sectionKey: "hub.sections.tools", labelKey: "hub.items.documents", badgeKey: "hub.badges.new", implemented: true, defaultOrder: 5 },
  { key: "aiAdvisor", sectionKey: "hub.sections.tools", labelKey: "hub.items.aiAdvisor", badgeKey: "hub.badges.new", implemented: true, defaultOrder: 0 },
  { key: "progress", sectionKey: "hub.sections.tools", labelKey: "hub.items.progress", implemented: true, defaultOrder: 1 },
  { key: "goals", sectionKey: "hub.sections.tools", labelKey: "hub.items.goals", implemented: true, defaultOrder: 2 },
  { key: "scanLabel", sectionKey: "hub.sections.tools", labelKey: "hub.items.scanLabel", implemented: true, defaultOrder: 3 },
  { key: "foodDatabase", sectionKey: "hub.sections.tools", labelKey: "hub.items.foodDatabase", implemented: true, defaultOrder: 4 },
  // Life
  { key: "achievements", sectionKey: "hub.sections.life", labelKey: "hub.items.achievements", badgeKey: "hub.badges.coming", implemented: false, defaultOrder: 0 },
  // Account
  { key: "referral", sectionKey: "hub.sections.account", labelKey: "hub.items.referral", implemented: true, defaultOrder: 0 },
  { key: "subscription", sectionKey: "hub.sections.account", labelKey: "hub.items.subscription", implemented: true, defaultOrder: 1 },
  { key: "profile", sectionKey: "hub.sections.account", labelKey: "hub.items.profile", implemented: true, defaultOrder: 2 },
  { key: "notifications", sectionKey: "hub.sections.account", labelKey: "hub.items.notifications", implemented: true, defaultOrder: 3 },
  { key: "coaching", sectionKey: "hub.sections.account", labelKey: "hub.items.coaching", implemented: true, defaultOrder: 4 },
  { key: "settings", sectionKey: "hub.sections.account", labelKey: "hub.items.settings", implemented: true, defaultOrder: 5 },
  // Data Management
  { key: "export", sectionKey: "hub.sections.dataManagement", labelKey: "hub.items.export", implemented: true, defaultOrder: 0 },
  // Community
  { key: "lineCommunity", sectionKey: "hub.sections.community", labelKey: "hub.items.lineCommunity", implemented: true, external: true, defaultOrder: 0 },
  { key: "reportIssue", sectionKey: "hub.sections.community", labelKey: "hub.items.reportIssue", implemented: true, external: true, defaultOrder: 1 },
];

/**
 * Merge user hub config with defaults.
 * - Items not in userConfig use defaults (visible: true).
 * - Items with visible: false are filtered out.
 * - Custom order is respected within each section.
 * - New items (added after user saved config) appear at the end with defaults.
 */
export function resolveHubItems(
  userConfig: HubUserConfig | null | undefined,
): HubItemDefinition[] {
  if (!userConfig) return DEFAULT_HUB_ITEMS;

  return DEFAULT_HUB_ITEMS
    .filter((item) => {
      const cfg = userConfig[item.key];
      // If not in config, show by default
      if (!cfg) return true;
      return cfg.visible;
    })
    .map((item) => {
      const cfg = userConfig[item.key];
      if (cfg?.order != null) {
        return { ...item, defaultOrder: cfg.order };
      }
      return item;
    });
}

/**
 * Group resolved hub items by section, preserving section order.
 */
export function groupHubItemsBySection(
  items: HubItemDefinition[],
): { sectionKey: string; items: HubItemDefinition[] }[] {
  const grouped = new Map<string, HubItemDefinition[]>();

  // Initialize in section order
  for (const sk of HUB_SECTIONS) {
    grouped.set(sk, []);
  }

  for (const item of items) {
    const arr = grouped.get(item.sectionKey);
    if (arr) arr.push(item);
  }

  // Sort within each section by order, then filter out empty sections
  return Array.from(grouped.entries())
    .filter(([, sectionItems]) => sectionItems.length > 0)
    .map(([sectionKey, sectionItems]) => ({
      sectionKey,
      items: sectionItems.sort((a, b) => a.defaultOrder - b.defaultOrder),
    }));
}
