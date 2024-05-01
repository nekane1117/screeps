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

export function shallowEq<T>(value1: T) {
  return (value2: T) => {
    return value1 === value2;
  };
}

export function someOf<T>(...arr: T[]) {
  return (value: T) => arr.some((v) => v === value);
}

export function stubTrue<T>() {
  return (_v2: T) => {
    return true;
  };
}
export function noop<T>(_: T) {
  // noop
}

export function cond<T, R = unknown>(...conditions: [(value: T) => boolean, (value: T) => R][]) {
  if (conditions.length === 0) {
    throw new Error("no conditions");
  }

  return (value: T) => {
    return (conditions.find((c) => c[0](value)) || conditions[conditions.length - 1])[1](value);
  };
}

/**
 * tickごとにキャッシュしたcreepの一覧を返す
 * このtickでspawnしたやつとかは入らないので注意
 * */
export function getCreepsInRoom(room: Room) {
  if (Game.time === room.memory.creeps?.tick) {
    return room.memory.creeps.value;
  } else {
    return (room.memory.creeps = {
      tick: Game.time,
      value: Object.values(Game.creeps)
        .filter((c) => c.room.name === room.name)
        .reduce(
          (creeps, c) => {
            return {
              ...creeps,
              [c.memory.role]: (creeps[c.memory.role] || []).concat(),
            };
          },
          {} as Record<ROLES, Creeps[]>,
        ),
    }).value;
  }
}

/**
 * tickごとにキャッシュしたspawnの一覧を返す
 * このtickで作ったやつとかは入らないので注意
 * */
export function getSpawnsInRoom(room: Room) {
  if (Game.time === room.memory.spawns?.tick) {
    return room.memory.spawns.value;
  } else {
    return (room.memory.spawns = {
      tick: Game.time,
      value: Object.values(Game.spawns).filter((c) => c.room.name === room.name),
    }).value;
  }
}
