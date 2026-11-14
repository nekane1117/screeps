export enum ORDER {
  /** 前にずらす */
  PREV = -1,
  /** そのまま */
  KEEP = 0,
  /** 後にずらす */
  NEXT = 1,
}

type Evaluation<T> = (e1: T) => number;

export function complexOrder<T>(arr: T[], evaluation: Evaluation<T>[]) {
  return _(
    [...arr].sort((e1, e2) => {
      for (const func of evaluation) {
        const result = func(e1) - func(e2);
        // 入れ替わるときはその値を返す
        if (result !== ORDER.KEEP) {
          return result;
        }
      }
      return ORDER.KEEP;
    }),
  );
}
