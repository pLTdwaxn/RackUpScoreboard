import en from "./locales/en.json";
import zhCN from "./locales/zh-CN.json";

type FormatValue = string | number;
type FormatParams = Record<string, FormatValue>;

type PottedBallsPhraseParams = {
  pottedBalls: string;
};

type FreeBallNominationParams = {
  ball: string;
};

type FoulParams = {
  points: number;
};

type VisitSummaryParams = {
  breakPoints: number;
  foulPoints: number;
};

type LocaleChangeListener = () => void;

export type LocaleOption = {
  id: AppLocale;
  code: AppLocale;
  label: string;
  nativeLabel: string;
};

const RAW_DICTIONARIES = {
  en,
  "zh-CN": zhCN,
} as const;

const LOCALE_STORAGE_KEY = "scoreboard.locale";
const DEFAULT_LOCALE: AppLocale = "en";
const localeChangeListeners = new Set<LocaleChangeListener>();
let currentLocale = readStoredLocale();

function isAppLocale(value: string): value is AppLocale {
  return value in RAW_DICTIONARIES;
}

function readStoredLocale(): AppLocale {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return storedLocale && isAppLocale(storedLocale)
    ? storedLocale
    : DEFAULT_LOCALE;
}

function writeStoredLocale(locale: AppLocale): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

function notifyLocaleChange(): void {
  localeChangeListeners.forEach((listener) => listener());
}

function formatTemplate(template: string, params: FormatParams = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    Object.prototype.hasOwnProperty.call(params, key)
      ? String(params[key])
      : "",
  );
}

function buildAppDictionary(raw: typeof en) {
  return {
    ...raw,
    health: {
      ...raw.health,
      requestFailed: (status: number) =>
        formatTemplate(raw.health.requestFailed, { status }),
      backendUnreachable: (port: string) =>
        formatTemplate(raw.health.backendUnreachable, { port }),
    },
    matchroomOverview: {
      ...raw.matchroomOverview,
      matchroom: (matchroomId: string) =>
        formatTemplate(raw.matchroomOverview.matchroom, { matchroomId }),
      bestOf: (frames: number) =>
        formatTemplate(raw.matchroomOverview.bestOf, { frames }),
    },
    matchroomInvite: {
      ...raw.matchroomInvite,
      qrCodeAlt: (matchroomId: string) =>
        formatTemplate(raw.matchroomInvite.qrCodeAlt, { matchroomId }),
    },
    scoreboard: {
      ...raw.scoreboard,
      reconnectTry: (attempt: number) =>
        formatTemplate(raw.scoreboard.reconnectTry, { attempt }),
      reconnectIn: (seconds: number) =>
        formatTemplate(raw.scoreboard.reconnectIn, { seconds }),
    },
    controlPanel: {
      ...raw.controlPanel,
      compositionFilter: {
        ...raw.controlPanel.compositionFilter,
        showingAtLeast: (description: string) =>
          formatTemplate(raw.controlPanel.compositionFilter.showingAtLeast, {
            description,
          }),
        ariaLabel: (ball: string, count: number) =>
          formatTemplate(raw.controlPanel.compositionFilter.ariaLabel, {
            ball,
            countSuffix: count ? ` ${count}` : "",
          }),
      },
      advanced: {
        ...raw.controlPanel.advanced,
        foulWithPoints: (points: number) =>
          formatTemplate(raw.controlPanel.advanced.foulWithPoints, { points }),
        foulWithPottedReds: (redSummary: string) =>
          formatTemplate(raw.controlPanel.advanced.foulWithPottedReds, {
            redSummary,
          }),
        foulOnBallWithPottedReds: (ball: string, redSummary: string) =>
          formatTemplate(raw.controlPanel.advanced.foulOnBallWithPottedReds, {
            ball,
            redSummary,
          }),
        foulOnBall: (ball: string) =>
          formatTemplate(raw.controlPanel.advanced.foulOnBall, { ball }),
        pot: (summary: string) =>
          formatTemplate(raw.controlPanel.advanced.pot, { summary }),
        pottedReds: (count: number, label: string) =>
          formatTemplate(raw.controlPanel.advanced.pottedReds, {
            count,
            label,
          }),
      },
    },
    frameLog: {
      ...raw.frameLog,
      shotCount: (count: number) =>
        formatTemplate(raw.frameLog.shotCount, {
          count,
          shotLabel: count === 1 ? "shot" : "shots",
        }),
      ballPhrase: {
        ...raw.frameLog.ballPhrase,
        article: (ball: string) =>
          ball === "red"
            ? raw.frameLog.ballPhrase.redArticle
            : raw.frameLog.ballPhrase.defaultArticle,
      },
      freeBallNomination: {
        ...raw.frameLog.freeBallNomination,
        label: ({ ball }: FreeBallNominationParams) =>
          formatTemplate(raw.frameLog.freeBallNomination.label, { ball }),
      },
      summaryBreak: {
        breakAndFoul: ({ breakPoints, foulPoints }: VisitSummaryParams) =>
          formatTemplate(raw.frameLog.summaryBreak.breakAndFoul, {
            breakPoints,
            foulPoints,
          }),
        breakOnly: ({ breakPoints }: VisitSummaryParams) =>
          formatTemplate(raw.frameLog.summaryBreak.breakOnly, { breakPoints }),
        foulOnly: ({ foulPoints }: VisitSummaryParams) =>
          formatTemplate(raw.frameLog.summaryBreak.foulOnly, { foulPoints }),
      },
      shotResult: {
        ...raw.frameLog.shotResult,
        foul: ({ points }: FoulParams) =>
          formatTemplate(raw.frameLog.shotResult.foul, { points }),
        potted: ({ pottedBalls }: PottedBallsPhraseParams) =>
          formatTemplate(raw.frameLog.shotResult.potted, { pottedBalls }),
      },
      visitSummary: {
        ...raw.frameLog.visitSummary,
        breakAndFoul: ({ breakPoints, foulPoints }: VisitSummaryParams) =>
          formatTemplate(raw.frameLog.visitSummary.breakAndFoul, {
            breakPoints,
            foulPoints,
          }),
        breakOnly: ({ breakPoints }: VisitSummaryParams) =>
          formatTemplate(raw.frameLog.visitSummary.breakOnly, { breakPoints }),
        foulOnly: ({ foulPoints }: VisitSummaryParams) =>
          formatTemplate(raw.frameLog.visitSummary.foulOnly, { foulPoints }),
      },
    },
  };
}

export type AppLocale = keyof typeof RAW_DICTIONARIES;
export type AppDictionary = ReturnType<typeof buildAppDictionary>;
export type FrameLogDictionary = AppDictionary["frameLog"];

export const APP_LOCALES: Record<
  AppLocale,
  {
    code: AppLocale;
    label: string;
    nativeLabel: string;
  }
> = {
  en: {
    code: "en",
    label: "English",
    nativeLabel: "English",
  },
  "zh-CN": {
    code: "zh-CN",
    label: "Chinese (Simplified)",
    nativeLabel: "简体中文",
  },
};

export const APP_DICTIONARIES = Object.fromEntries(
  Object.entries(RAW_DICTIONARIES).map(([locale, raw]) => [
    locale,
    buildAppDictionary(raw),
  ]),
) as Record<AppLocale, AppDictionary>;

const dynamicFrameLogDictionary = new Proxy({} as FrameLogDictionary, {
  get: (_target, property: keyof FrameLogDictionary) =>
    getAppDictionary().frameLog[property],
});

export const APP_LOCALE_OPTIONS: LocaleOption[] = Object.values(
  APP_LOCALES,
).map((locale) => ({
  ...locale,
  id: locale.code,
}));

export function getCurrentLocale(): AppLocale {
  return currentLocale;
}

export function setAppLocale(locale: AppLocale): void {
  if (locale === currentLocale) {
    return;
  }

  currentLocale = locale;
  writeStoredLocale(locale);
  notifyLocaleChange();
}

export function subscribeAppLocale(listener: LocaleChangeListener): () => void {
  localeChangeListeners.add(listener);
  return () => {
    localeChangeListeners.delete(listener);
  };
}

export function getAppDictionary(
  locale: AppLocale = currentLocale,
): AppDictionary {
  return APP_DICTIONARIES[locale];
}

export function getFrameLogDictionary(
  locale?: AppLocale,
): FrameLogDictionary {
  if (!locale) {
    return dynamicFrameLogDictionary;
  }

  return getAppDictionary(locale).frameLog;
}
