export function priceUSD(value: number): string {
  const digits = value >= 100 ? 2 : value >= 1 ? 3 : 5;
  return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 2 }).format(value)}`;
}

export function compactUSD(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 }).format(value);
}

export function changeText(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function dateText(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

export function timeText(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "--:--" : new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

export function localISODate(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}\nexport function resolveMeetingLiveText(text: string, market: MarketSnapshot): string {\n  return text.replace(/\\{\\{PRICE:(BTC|ETH|BNB|XRP|SOL)\\}\\}/g, (_, id: CoinId) => {\n    const coin = market.coins.find((item) => item.id === id);\n    return coin ? priceUSD(coin.price) : "N/A";\n  }).replace(/\\{\\{CHANGE:(BTC|ETH|BNB|XRP|SOL)\\}\\}/g, (_, id: CoinId) => {\n    const coin = market.coins.find((item) => item.id === id);\n    return coin ? changeText(coin.change24h) : "N/A";\n  });\n}\n