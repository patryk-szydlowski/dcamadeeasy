import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";

import { objectMatching } from "~/core/utils/tests";
import type { KrakenHttpClient } from "~/features/platforms/kraken/client";

import { KrakenTradeExecutorLive } from "./kraken-trade-executor-live";

describe("kraken trade executor live", () => {
  test("should place trade", async () => {
    const client = mock<KrakenHttpClient>();
    const executor = new KrakenTradeExecutorLive(client);

    client.request
      .calledWith(
        objectMatching({
          type: "public",
          name: "Ticker",
          options: { pair: "BTC/EUR" },
        }),
      )
      .mockResolvedValue({
        name: "Ticker",
        error: [],
        result: { "BTC/EUR": { a: ["10"], b: ["100"] } },
      });

    client.request
      .calledWith(
        objectMatching({
          type: "private",
          name: "AddOrder",
          options: { type: "buy", ordertype: "limit", pair: "BTC/EUR", price: 100, volume: 10 },
        }),
      )
      .mockResolvedValue({
        name: "AddOrder",
        error: [],
        result: { txid: ["reference-id"], descr: { order: "order description" } },
      });

    const { referenceId } = await executor.executeScheduledTrade({
      boughtAssetTicker: "BTC",
      soldAssetTicker: "EUR",
      tradeValue: 1000,
    });

    expect(referenceId).toEqual("reference-id");
  });
});
