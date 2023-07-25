export interface KrakenHttpClient {
  request<TEndpoint extends KrakenEndpoint>(request: TEndpoint): InferKrakenResponse<TEndpoint>;
}

export type InferKrakenResponse<TEndpoint extends KrakenEndpoint> = Promise<
  KrakenResponse extends infer TResponse
    ? TResponse extends { name: string }
      ? TResponse["name"] extends TEndpoint["name"]
        ? TResponse
        : never
      : never
    : never
>;

export type KrakenEndpoint =
  | TradableAssetPairsEndpoint
  | TickerEndpoint
  | BalanceEndpoint
  | AddOrderEndpoint;

export type KrakenResponse =
  | TradableAssetPairsResponse
  | TickerResponse
  | BalanceResponse
  | AddOrderResponse;

export interface TradableAssetPairsEndpoint {
  type: "public";
  name: "AssetPairs";
  options?: {
    pair?: string;
  };
}

export interface TradableAssetPairsResponse {
  name: "AssetPairs";
  error: string[];
  result: Record<string, { altname: string; base: string; quote: string }>;
}

export interface TickerEndpoint {
  type: "public";
  name: "Ticker";
  options: {
    pair: string;
  };
}

export interface TickerResponse {
  name: "Ticker";
  error: string[];
  result: Record<string, { a: [price: string]; b: [price: string] }>;
}

export interface BalanceEndpoint {
  type: "private";
  name: "Balance";
  options?: never;
}

export interface BalanceResponse {
  name: "Balance";
  error: string[];
  result: Record<string, string>;
}

export interface AddOrderEndpoint {
  type: "private";
  name: "AddOrder";
  options: {
    type: "buy" | "sell";
    ordertype: "market" | "limit";
    pair: string;
    price: number;
    volume: number;
  };
}

export interface AddOrderResponse {
  name: "AddOrder";
  error: string[];
  result: {
    txid: string[];
    descr: { order: string };
  };
}
