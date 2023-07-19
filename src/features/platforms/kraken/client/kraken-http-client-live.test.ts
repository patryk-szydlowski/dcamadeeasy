import { describe, expect, expectTypeOf, test } from "vitest";
import { mock } from "vitest-mock-extended";

import type { Clock } from "~/core/services/clock";
import type { HttpClient } from "~/core/services/http-client";

import type { BalanceResponse, TradableAssetPairsResponse } from "./kraken-http-client";
import { KrakenHttpClientLive } from "./kraken-http-client-live";

describe("kraken http client live", () => {
  const publicKey = "public-key";
  const privateKey =
    "8+ik7Es1k9bNuwVyiAWYaNI52j8Am7q5YUcwO/JXauMifieLZtSKWR/V9NTSJLNcN8cGObLEF3/aVB4XOyE0AA==";

  test("should have inferred response types", async () => {
    const clock = mock<Clock>();
    const httpClient = mock<HttpClient>();
    const options = { publicKey, privateKey };

    const krakenHttpClient = new KrakenHttpClientLive(clock, httpClient, options);

    clock.currentTime.mockImplementation(() => new Date());
    httpClient.request.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({}))));

    const assetPairs = await krakenHttpClient.request({ type: "public", name: "AssetPairs" });
    const balance = await krakenHttpClient.request({ type: "private", name: "Balance" });

    expectTypeOf(assetPairs).toEqualTypeOf<TradableAssetPairsResponse>();
    expectTypeOf(balance).toEqualTypeOf<BalanceResponse>();
  });

  test("should not attach api and signing key when calling public endpoint", async () => {
    const clock = mock<Clock>();
    const httpClient = mock<HttpClient>();
    const options = { publicKey, privateKey };

    const krakenHttpClient = new KrakenHttpClientLive(clock, httpClient, options);

    const expectedAssetPairs = { result: { AAVEEUR: { altname: "AAVEEUR" } } };

    httpClient.request.mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(expectedAssetPairs))),
    );

    const assetPairs = await krakenHttpClient.request({ type: "public", name: "AssetPairs" });
    const request = httpClient.request.mock.lastCall?.[0].clone();

    expect(assetPairs).toEqual(expectedAssetPairs);
    expect(request?.url).toEqual("https://api.kraken.com/0/public/AssetPairs");
    expect(request?.method).toEqual("POST");
    expect(Array.from(request?.headers.keys() ?? [])).not.toContain("api-key");
    expect(Array.from(request?.headers.keys() ?? [])).not.toContain("api-sign");
  });

  test("should attach api and signing key when calling private endpoint", async () => {
    const clock = mock<Clock>();
    const httpClient = mock<HttpClient>();
    const options = { publicKey, privateKey };

    const krakenHttpClient = new KrakenHttpClientLive(clock, httpClient, options);

    const expectedBalance = { result: { XUSD: "100", XBTC: "100" } };
    const expectedSigningKey =
      "Q8AzlTVBdhxMrggU+uod/JTuXps+tnkdnJLiW9WJcVP1iz3OjPjw3w/XRTmEiy2efXbmf5WqDa7jNVdPWhTprA==";

    clock.currentTime.mockImplementation(() => new Date("2001-01-01"));
    httpClient.request.mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(expectedBalance))),
    );

    const assetPairs = await krakenHttpClient.request({ type: "private", name: "Balance" });
    const request = httpClient.request.mock.lastCall?.[0];

    expect(assetPairs).toEqual(expectedBalance);
    expect(request?.url).toEqual("https://api.kraken.com/0/private/Balance");
    expect(request?.method).toEqual("POST");
    expect(Object.fromEntries(request?.headers.entries() ?? [])).toMatchObject({
      "api-key": publicKey,
      "api-sign": expectedSigningKey,
    });
  });
});
