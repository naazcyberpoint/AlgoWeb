export interface UserDTO {
  id: string;
  email: string;
  role: 'admin' | 'trader' | 'analyst';
  createdAt: string;
}

export interface OrderTicketDTO {
  symbol: string;
  side: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP_LOSS';
  quantity: number;
  price?: number;
}

export interface StrategyConfigDTO {
  id: string;
  name: string;
  timeframe: string;
  symbols: string[];
  parameters: Record<string, unknown>;
}
