export interface ScheduledTrade {
  boughtAssetTicker: string;
  soldAssetTicker: string;
  tradeValue: number;
}

export interface PlacedTrade {
  referenceId: string;
}

export interface KrakenTradeExecutor {
  executeScheduledTrade(trade: ScheduledTrade): Promise<PlacedTrade>;
}
