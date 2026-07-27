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

export const APP_DICTIONARIES = {
  en: {
    frameLog: {
      ballPhrase: {
        article: (ball: string) => (ball === "red" ? "a" : "the"),
        as: "as",
      },
      conjunction: {
        two: "and",
        final: "and",
      },
      freeBallNomination: {
        prefix: " nominated the ",
        suffix: " free ball.",
        label: ({ ball }: FreeBallNominationParams) =>
          ` nominated the ${ball} free ball.`,
      },
      passShot: {
        suffix: " passed the shot back.",
      },
      resetShot: {
        suffix: " reset the shot.",
      },
      breakOff: {
        suffix: " to break off.",
      },
      turnStarted: {
        suffix: ": new turn",
      },
      shotResult: {
        foul: ({ points }: FoulParams) => ` fouled for ${points}.`,
        noPot: " played a shot. No pot.",
        potted: ({ pottedBalls }: PottedBallsPhraseParams) =>
          ` potted ${pottedBalls}.`,
        pottedPrefix: " potted ",
        sentenceEnd: ".",
      },
      visitSummary: {
        frameWon: ": won the frame",
        breakAndFoul: ({ breakPoints, foulPoints }: VisitSummaryParams) =>
          `: break ${breakPoints}, foul ${foulPoints}`,
        breakOnly: ({ breakPoints }: VisitSummaryParams) =>
          `: break ${breakPoints}`,
        foulOnly: ({ foulPoints }: VisitSummaryParams) =>
          `: foul ${foulPoints}`,
        noScore: ": no score",
      },
    },
  },
} as const;

export type AppLocale = keyof typeof APP_DICTIONARIES;
export type AppDictionary = (typeof APP_DICTIONARIES)[AppLocale];
export type FrameLogDictionary = AppDictionary["frameLog"];

export function getAppDictionary(locale: AppLocale = "en"): AppDictionary {
  return APP_DICTIONARIES[locale];
}

export function getFrameLogDictionary(
  locale: AppLocale = "en",
): FrameLogDictionary {
  return getAppDictionary(locale).frameLog;
}
