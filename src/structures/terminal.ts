import { getCreepsInRoom, RETURN_CODE_DECODER } from "../utils/creep";
import { TRANSFER_THRESHOLD } from "../constants";
import { getLabs, getTerminals, logUsage } from "../utils";

export default function behaviors(terminal: Structure) {
  logUsage(`terminal:${terminal.room.name}`, () => {
    if (!isTerminal(terminal)) {
      return console.log(`${terminal.id} is not terminal`);
    }

    if (terminal.cooldown > 0) {
      return ERR_BUSY;
    }
    const memory = ((Memory.terminals = Memory.terminals || {})[terminal.id] = Memory.terminals[terminal.id] || {});
    if (memory.cache) {
      terminal.room.visual.text(memory.cache.toLocaleString(), terminal.pos.x, terminal.pos.y, { font: 0.25, color: "#ffff00" });
    }

    // とにかくリソースを共有する
    const terminals = getTerminals();

    // ターミナルが2個以下の時は特に何もさせない
    if (terminals.length < 2) {
      return OK;
    }

    for (const resourceType of RESOURCES_ALL.filter((r) => {
      if ((terminal.room.controller?.level || 0) === 8) {
        return true;
      } else {
        return r !== RESOURCE_ENERGY;
      }
    })) {
      // 閾値の2倍あるときは不足してるターミナルに送る
      if (terminal.store[resourceType] > _.floor(TRANSFER_THRESHOLD * 2, -2)) {
        const transferTarget = terminals.find((t) => t.store[resourceType] < TRANSFER_THRESHOLD);
        // 足らないターミナルを見つけたとき
        if (transferTarget) {
          console.log(`terminal.send(${resourceType}, ${TRANSFER_THRESHOLD}, ${transferTarget.room.name})`);
          const result = terminal.send(resourceType, TRANSFER_THRESHOLD, transferTarget.room.name);
          if (result === OK) {
            return;
          } else {
            console.log(RETURN_CODE_DECODER[result]);
          }
        }
      }
    }

    // 共有できない or 済んでるとき

    if (memory.reserved) {
      const allOrderHistory = [...Game.market.outgoingTransactions, ...Game.market.incomingTransactions];
      // 売った予約の時
      if (memory.reserved.type === ORDER_SELL) {
        const executed = allOrderHistory.find((t) => {
          return t.time === memory.reserved?.time && t.order?.id === memory.reserved.orderId && t.from === terminal.room.name;
        });
        // 見つかった時はキャッシュに足す
        if (executed) {
          memory.cache = (memory.cache || 0) + executed.amount * (executed.order?.price || 0);
        }
      } else {
        // 買った予約の時
        const executed = allOrderHistory.find((t) => {
          return t.time === memory.reserved?.time && t.order?.id === memory.reserved.orderId && t.to === terminal.room.name;
        });
        // 見つかった時はキャッシュから引く
        if (executed) {
          memory.cache = (memory.cache || 0) - executed.amount * (executed.order?.price || 0);
        }
      }
      memory.lastReserve = memory.reserved;
      memory.reserved = undefined;
    } else {
      // bucketが500を切ってるときは何もしない
      if (Game.cpu.bucket < 500) {
        return OK;
      }

      // キャッシュがあるかないか
      if (memory.cache) {
        // キャッシュがあるとき
        const shortage = BUY_TARGET.find((t) => {
          return getRoomResources(terminal.room)[t] < TRANSFER_THRESHOLD;
        });
        // 不足がないときはOK
        if (!shortage) {
          return OK;
        }
        const avgPrice = getAveragePrice(shortage);
        // 相場がわからないときは買わない
        if (avgPrice === undefined) {
          return ERR_NOT_FOUND;
        }
        const sellOrderToBuy = _(
          Game.market.getAllOrders({
            resourceType: shortage,
            type: ORDER_SELL,
          }),
        )
          .filter((o) => o.remainingAmount > 0)
          .map((o) => ({ order: o, effectivePrice: o.price + getEnergyCostPerUnit(o, terminal.room.name) }))
          // 輸送費込みで相場より高すぎるものは買わない
          .filter((o) => o.effectivePrice <= avgPrice * BUY_MAX_RATE)
          .sortBy((o) => o.effectivePrice)
          .first()?.order;

        if (!sellOrderToBuy) {
          console.log(`terminal:${terminal.room.name} ${shortage}の手頃な売り注文なし(相場:${_.round(avgPrice, 3)})`);
          return ERR_NOT_FOUND;
        }

        if (memory.cache < sellOrderToBuy.price) {
          memory.cache = undefined;
          return ERR_NOT_ENOUGH_RESOURCES;
        }

        const dealResult = Game.market.deal(
          sellOrderToBuy.id,
          Math.min(TRANSFER_THRESHOLD, Math.floor((memory.cache || 0) / sellOrderToBuy.price), sellOrderToBuy.remainingAmount),
          terminal.room.name,
        );
        if (dealResult === OK) {
          memory.reserved = {
            orderId: sellOrderToBuy.id,
            type: ORDER_BUY,
            time: Game.time,
          };
        }
        return dealResult;
      } else {
        // キャッシュがないときは売ってキャッシュを作る
        const target = _(SELL_TARGETS)
          .filter((t) => terminal.store[t] >= TRANSFER_THRESHOLD * 2)
          .sortBy((t) => {
            // 部屋に一番あるやつ
            return -(getRoomResources(terminal.room)[t] || 0);
          })
          .first();
        // 売れるものがない
        if (!target) {
          return ERR_NOT_ENOUGH_RESOURCES;
        }

        const avgPrice = getAveragePrice(target);
        // 相場がわからないときは売らない
        if (avgPrice === undefined) {
          return ERR_NOT_FOUND;
        }
        const buyOrderToSell = _(
          Game.market.getAllOrders({
            type: ORDER_BUY,
            resourceType: target,
          }),
        )
          .filter((o) => {
            return o.remainingAmount > 0;
          })
          .map((o) => ({ order: o, effectivePrice: o.price - getEnergyCostPerUnit(o, terminal.room.name) }))
          // 輸送費を引いて相場より安すぎるものには売らない
          .filter((o) => o.effectivePrice >= avgPrice * SELL_MIN_RATE)
          .sortBy((o) => {
            // 一番高く売れるやつ
            return -o.effectivePrice;
          })
          .first()?.order;

        if (!buyOrderToSell) {
          console.log(`terminal:${terminal.room.name} ${target}の手頃な買い注文なし(相場:${_.round(avgPrice, 3)})`);
          return ERR_NOT_FOUND;
        }
        // 処理前のクレジット
        const dealResult = Game.market.deal(buyOrderToSell.id, Math.min(TRANSFER_THRESHOLD, buyOrderToSell.remainingAmount), terminal.room.name);
        if (dealResult === OK) {
          // 購入予約に登録
          memory.reserved = {
            time: Game.time,
            type: ORDER_SELL,
            orderId: buyOrderToSell.id,
          };
        }
        return dealResult;
      }
    }
  });
}

function isTerminal(s: Structure): s is StructureTerminal {
  return s.structureType === STRUCTURE_TERMINAL;
}

function getRoomResources(room: Room) {
  const labs = getLabs(room);
  const { labManager = [], mineralHarvester = [] } = getCreepsInRoom(room);

  const targets = _([room.terminal, room.storage, ...labs.value(), ...labManager, ...mineralHarvester]).compact();

  return RESOURCES_ALL.reduce(
    (v, type) => {
      return {
        ...v,
        [type]: targets.sum((s) => s.store[type]),
      };
    },
    {} as Record<ResourceConstant, number>,
  );
}

/** 相場に対してこの倍率以上なら売る */
const SELL_MIN_RATE = 0.9;
/** 相場に対してこの倍率以下なら買う */
const BUY_MAX_RATE = 1.1;
/** 相場キャッシュの有効期間(tick) 履歴は日単位なので長めでいい */
const PRICE_CACHE_TTL = 1000;

// ヒープに置くキャッシュ(グローバルリセットで消えても再計算するだけ)
const priceCache: Partial<Record<MarketResourceConstant, { time: number; price: number | undefined }>> = {};

/**
 * 直近の取引履歴から出来高加重の平均価格を返す
 * 履歴が無いときはundefined
 */
function getAveragePrice(resourceType: MarketResourceConstant): number | undefined {
  const cached = priceCache[resourceType];
  if (cached && Game.time - cached.time < PRICE_CACHE_TTL) {
    return cached.price;
  }
  const history = Game.market.getHistory(resourceType);
  const volume = _.sum(history, (h) => h.volume);
  const price = volume > 0 ? _.sum(history, (h) => h.avgPrice * h.volume) / volume : undefined;
  priceCache[resourceType] = { time: Game.time, price };
  return price;
}

/**
 * 1単位あたりの輸送エネルギーをクレジット換算したもの
 */
function getEnergyCostPerUnit(order: Order, roomName: string) {
  if (!order.roomName) {
    return 0;
  }
  const energyPrice = getAveragePrice(RESOURCE_ENERGY) || 0;
  return (Game.market.calcTransactionCost(TRANSFER_THRESHOLD, roomName, order.roomName) / TRANSFER_THRESHOLD) * energyPrice;
}

const BUY_TARGET = [RESOURCE_HYDROGEN, RESOURCE_OXYGEN, RESOURCE_LEMERGIUM, RESOURCE_UTRIUM, RESOURCE_KEANIUM, RESOURCE_ZYNTHIUM];

const SELL_TARGETS = [
  ...BUY_TARGET.filter((t) => t !== RESOURCE_HYDROGEN && t !== RESOURCE_OXYGEN),
  RESOURCE_CATALYST,
  // xxx_bar
  RESOURCE_LEMERGIUM_BAR,
  RESOURCE_UTRIUM_BAR,
  RESOURCE_KEANIUM_BAR,
  RESOURCE_ZYNTHIUM_BAR,
  // factory生産物
  ...(Object.entries(COMMODITIES)
    .filter(([_, c]) => {
      return "level" in c;
    })
    .map(([key]) => {
      return key;
    }) as CommodityConstant[]),
];
