import type { KrakenHttpClient } from "~/features/platforms/kraken/client";

import type { KrakenTradeExecutor, ScheduledTrade } from "./kraken-trade-executor";

export class KrakenTradeExecutorLive implements KrakenTradeExecutor {
  #client: KrakenHttpClient;

  constructor(client: KrakenHttpClient) {
    this.#client = client;
  }

  async executeScheduledTrade({ boughtAssetTicker, soldAssetTicker, tradeValue }: ScheduledTrade) {
    const assetPair = `${boughtAssetTicker}/${soldAssetTicker}`;
    const bidPrice = await this.#getBidPrice(assetPair);
    const referenceId = await this.#placeTrade(assetPair, bidPrice, tradeValue);

    return { referenceId };
  }

  async #getBidPrice(assetPair: string) {
    const { error, result } = await this.#client.request({
      type: "public",
      name: "Ticker",
      options: { pair: assetPair },
    });

    if (error.length > 0) {
      throw new Error(error[0]);
    }

    return Number(result[assetPair]?.b.at(0));
  }

  async #placeTrade(assetPair: string, bidPrice: number, tradeValue: number) {
    const volume = tradeValue / bidPrice;

    const { error, result } = await this.#client.request({
      type: "private",
      name: "AddOrder",
      options: {
        type: "buy",
        ordertype: "limit",
        pair: assetPair,
        price: bidPrice,
        volume,
      },
    });

    if (error.length > 0) {
      throw new Error(error[0]);
    }

    return String(result.txid.at(0));
  }
}
