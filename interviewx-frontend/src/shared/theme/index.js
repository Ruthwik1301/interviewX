// src/theme/index.js

export const designTokens = {
  colors: {
    bg: "var(--color-bg)",
    surface: "var(--color-surface)",
    surface1: "var(--color-surface-1)",
    surface2: "var(--color-surface-2)",
    surface3: "var(--color-surface-3)",
    text: "var(--color-text)",
    textMuted: "var(--color-text-muted)",
    textInvert: "var(--color-text-invert)",
    border: "var(--color-border)",
    borderStrong: "var(--color-border-strong)",
    primary: "#198754", // Emerald
    accent: "#FFC107", // Amber
    accentBg: "#FFEAD0",
    accentBorder: "#DDB56A",
    success: "#28a745", // Updated from the default value
    successBg: "#d4edda",
    successBorder: "#c3e6cb",
    warning: "#ffc107", // Updated from the default value
    warningBg: "#fff3cd",
    warningBorder: "#ffeeba",
    error: "#dc3545", // Updated from the default value
    errorBg: "#f8d7da",
    errorBorder: "#f5c6cb",
    focus: "var(--color-focus)",
    overlay: "var(--color-overlay)",
  },
  typography: {
    fontSans: "var(--font-sans)",
    fontHeading: "var(--font-heading)",
    fontMono: "var(--font-mono)",
    sizes: {
      hero: "var(--text-hero)",
      h1: "var(--text-h1)",
      h2: "var(--text-h2)",
      h3: "var(--text-h3)",
      body: "var(--text-body)",
      caption: "var(--text-caption)",
    },
    leading: {
      hero: "var(--leading-hero)",
      h1: "var(--leading-h1)",
      h2: "var(--leading-h2)",
      h3: "var(--leading-h3)",
      body: "var(--leading-body)",
      caption: "var(--leading-caption)",
    },
    tracking: {
      tight: "var(--tracking-tight)",
      normal: "var(--tracking-normal)",
    },
  },
  spacing: {
    0: "var(--space-0)",
    1: "var(--space-1)",
    2: "var(--space-2)",
    3: "var(--space-3)",
    4: "var(--space-4)",
    5: "var(--space-5)",
    6: "var(--space-6)",
    7: "var(--space-7)",
    8: "var(--space-8)",
    9: "var(--space-9)",
    10: "var(--space-10)",
    11: "var(--space-11)",
    12: "var(--space-12)",
    14: "var(--space-14)",
  },
  radius: {
    1: "var(--radius-1)",
    2: "var(--radius-2)",
    3: "var(--radius-3)",
    4: "var(--radius-4)",
    full: "var(--radius-full)",
  },
  shadows: {
    none: "var(--shadow-none)",
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)",
  },
  motion: {
    fast: "var(--motion-fast)",
    normal: "var(--motion-normal)",
    slow: "var(--motion-slow)",
    easeOut: "var(--ease-out)",
    easeIn: "var(--ease-in)",
    easeSmooth: "var(--ease-smooth)",
    ring: "var(--ring)",
  },
  componentTokens: {
    button: {
      radius: "var(--radius-2)",
      primaryBg: "#198754", // Updated from the default value
      primaryText: "var(--color-text-invert)",
      primaryBorder: "#0DCAF0", // Updated from the default value
      hoverShadow: "var(--shadow-md)",
      focusRing: "var(--ring)",
      transition: `transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) var(--ease-out), background-color var(--motion-fast) var(--ease-out)`,
    },
    card: {
      radius: "var(--radius-3)",
      border: "var(--color-border)",
      bg: "var(--color-surface-2)",
      shadow: "var(--shadow-sm)",
    },
    input: {
      radius: "var(--radius-2)",
      border: "var(--color-border-strong)",
      focusRing: "var(--ring)",
      bg: "var(--color-surface-2)",
    },
    badge: {
      radius: "var(--radius-full)",
      successBg: "#d4edda",
      successBorder: "#c3e6cb",
      warningBg: "#fff3cd",
      warningBorder: "#ffeeba",
      errorBg: "#f8d7da",
      errorBorder: "#f5c6cb",
      accentBg: "#FFEAD0", // Updated from the default value
      accentBorder: "#DDB56A", // Updated from the default value
    },
    navigation: {
      radius: "var(--radius-2)",
      activeBg: "#198754", // Updated from the default value
      activeBorder: "#0DCAF0", // Updated from the default value
      hoverBg: "var(--color-surface-3)",
    },
  },
};
export default designTokens;
