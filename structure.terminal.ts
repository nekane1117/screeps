import { TRANSFER_THRESHOLD } from "./constants";
import { getTerminals, logUsage } from "./utils";
import { getRoomResouces, isCommodity, ObjectEntries } from "./utils.common";

export default function behaviors(terminal: Structure) {
  logUsage(`terminal:${terminal.room.name}`, () => {
    if (!isTerminal(terminal)) {
      return console.log(`${terminal.id} is not terminal`);
    }

    if (terminal.cooldown > 0) {
      return OK;
    }
    const memory = ((Memory.terminals = Memory.terminals || {})[terminal.id] = Memory.terminals[terminal.id] || {});

    memory.lastTrade && terminal.room.visual.text(memory.lastTrade, terminal.pos.x, terminal.pos.y, { font: 0.25, color: "#ffff00" });
    if (Game.cpu.bucket > 600 && terminal.cooldown > 0) {
      return;
    }

    // とにかくリソースを共有する
    const terminals = getTerminals();

    // ターミナルが2個以下の時は特に何もさせない
    if (terminals.length < 2) {
      return OK;
    }

    for (const resourceType of RESOURCES_ALL.filter((r) => !isCommodity(r) && r !== RESOURCE_ENERGY)) {
      // 閾値の2倍あるときは不足してるターミナルに送る
      if (terminal.store[resourceType] > _.floor(TRANSFER_THRESHOLD * 2, -2)) {
        const transferTarget = terminals.find((t) => t.store[resourceType] < TRANSFER_THRESHOLD);
        // 足らないターミナルを見つけたとき
        if (transferTarget) {
          if (
            terminal.send(
              resourceType,
              Math.min(terminal.store[resourceType] - _.floor(TRANSFER_THRESHOLD * 2, -2), TRANSFER_THRESHOLD),
              transferTarget.room.name,
            ) === OK
          ) {
            return;
          }
        }
      }
    }

    // 共有できない or 済んでるとき

    // bucketが500を切ってるときは何もしない
    if (Game.cpu.bucket < 500) {
      return OK;
    }

    if (terminal.store.energy < _.floor(TRANSFER_THRESHOLD * 2, -2)) {
      return ERR_NOT_ENOUGH_ENERGY;
    }

    const product = getProducts(terminal.room);
    if (!product || terminal.store[product] < _.floor(TRANSFER_THRESHOLD * 2, -2)) {
      // そもそもないときは何もしないのでOK
      return OK;
    }

    // 不足している基本ミネラル
    const shortage = BASE_MINERALS.find((m) => terminal.store[m] < _.floor(TRANSFER_THRESHOLD / 2, -2));

    if (!shortage) {
      // 不足していないなら問題ないのでOK
      return OK;
    }

    // 自分以外のエネルギーが一番多いターミナル
    const freeTerminal = _(terminals)
      .filter((t) => {
        return t.id !== terminal.id && t.cooldown === 0 && t.store.energy > _.floor(TRANSFER_THRESHOLD * 2, -2);
      })
      .sortBy((t) => t.store.energy)
      .last();

    // 見つからなければエネルギー不足
    if (!freeTerminal) {
      return ERR_NOT_ENOUGH_ENERGY;
    }

    // 手持ち品の買い注文を探す
    const buyOrder = _(
      Game.market.getAllOrders({
        resourceType: product,
        type: ORDER_BUY,
      }),
    )
      .sortBy((o) => o.price)
      .last();

    // 不足品の売り注文を探す
    const sellOrder = _(
      Game.market.getAllOrders({
        resourceType: shortage,
        type: ORDER_SELL,
      }),
    )
      .sortBy((o) => o.price)
      .first();

    if (buyOrder && sellOrder) {
      // まず売れるだけ売る

      // 売れる最大量は分配上限か販売量の小さいほう
      const sellAmountMax = Math.min(TRANSFER_THRESHOLD, buyOrder.remainingAmount);
      // 買い戻せる最大金額
      const returnPriceMax = buyOrder.price * sellAmountMax;

      // 実際に買い戻す量は最大買える量と実際に売ってる量の小さいほう
      const returnAmountActual = Math.min(Math.floor(returnPriceMax / sellOrder.price), sellOrder.remainingAmount);

      // 実際に買い戻すのに必要な金額
      const returnPriceActual = returnAmountActual * sellOrder.price;

      // 実際に売る必要がある量
      const sellAmountActual = Math.ceil(returnPriceActual / buyOrder.price);

      // 買い戻す個数
      if (returnPriceActual <= 0 || sellAmountActual <= 0) {
        console.log(`購入情報見合わず:${JSON.stringify({ buyOrder, sellOrder })}`);
        return ERR_INVALID_ARGS;
      }

      // 自分で売って、空きターミナルに買い戻す
      const memory = Memory.terminals[terminal.id];
      memory.lastTrade = buyOrder.resourceType;
      memory.lastTradeTick = Game.time;
      memory.paritId = freeTerminal.id;
      if ((memory.lastTradeResult = Game.market.deal(buyOrder.id, sellAmountActual, terminal.room.name)) === OK) {
        freeTerminal.memory.lastTrade = sellOrder.resourceType;
        freeTerminal.memory.lastTradeResult = Game.market.deal(sellOrder.id, returnAmountActual, freeTerminal.room.name);
        freeTerminal.memory.lastTradeTick = Game.time;
        freeTerminal.memory.paritId = terminal.id;
      }
    }
  });
}

function isTerminal(s: Structure): s is StructureTerminal {
  return s.structureType === STRUCTURE_TERMINAL;
}

const BASE_MINERALS = [RESOURCE_HYDROGEN, RESOURCE_OXYGEN, RESOURCE_UTRIUM, RESOURCE_KEANIUM, RESOURCE_LEMERGIUM, RESOURCE_ZYNTHIUM, RESOURCE_CATALYST];

function getProducts(room: Room) {
  const roomResouces = getRoomResouces(room);

  const all = ObjectEntries(Game.market.orders).reduce((mapping, [, order]) => {
    mapping[order.resourceType].push(order);
    return mapping;
  }, defaultOrderMap);

  const roomMineral = _.first(room.find(FIND_MINERALS));
  // 売却対象の計算
  return (
    _(ObjectEntries(roomResouces))
      // 部屋のミネラルかcommodityで上限の2倍以上あるやつ
      .filter(([key]) => (key === roomMineral?.mineralType || isCommodity(key)) && (roomResouces[key] || 0) > _.floor(TRANSFER_THRESHOLD * 2, -2))
      .map(([key, value]) => {
        if (key === "timestamp") {
          return undefined;
        }
        return {
          key,
          amount: value || 0,
        };
      })
      .compact()
      // 一番売却効率がよさそうな奴
      .sortBy((v) => {
        const h = _(all[v.key])
          .sortBy((v) => -(v.price * v.remainingAmount))
          .first();
        return -((h?.price || 0) * (h?.remainingAmount || 0));
      })
      .first()?.key
  );
}

const defaultOrderMap = Object.freeze(
  RESOURCES_ALL.reduce(
    (d, type) => {
      return {
        ...d,
        [type]: [],
      };
    },
    {} as Record<MarketResourceConstant, Order[]>,
  ),
);
