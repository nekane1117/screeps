export function ObjectKeys<O extends object>(o: O): (keyof O)[] {
  return Object.keys(o) as (keyof O)[];
}

/** 理想的なBodyの指定からコストで作れる分だけを絞る */
export function getBodyByCost(bodies: BodyPartConstant[], cost: number): BodyPartConstant[] {
  return bodies
    .map((parts) => {
      return {
        parts,
        // 1つずつのコストを計算する
        cost: BODYPART_COST[parts],
      };
    })
    .map(({ parts }, i, arr) => {
      return {
        parts,
        // ここまでの合計を入れる
        totalCost: _(arr)
          .slice(0, i + 1)
          .map((p) => p.cost)
          .sum(),
      };
    })
    .filter((p) => {
      // 合計が指定コスト以下のものだけにする
      return p.totalCost <= cost;
    })
    .map((p) => p.parts);
}
