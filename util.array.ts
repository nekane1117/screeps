export enum ORDER {
  /** 前にずらす */
  PREV = -1,
  /** そのまま */
  KEEP = 0,
  /** 後にずらす */
  NEXT = 1,
}

type Order<T> = (e1: T, e2: T) => number;

export function complexOrder<T>(arr: T[], orders: Order<T>[]) {
  return [...arr].sort((e1, e2) => {
    for (const func of orders) {
      const result = func(e1, e2);
      // 入れ替わるときはその値を返す
      if (result !== ORDER.KEEP) {
        return result;
      }
    }
    return ORDER.KEEP;
  });
}
