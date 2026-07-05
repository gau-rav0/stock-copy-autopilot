export type StockMeta = {
  symbol: string;
  name: string;
  sector: string;
  fallbackPrice: number;
  fallbackHistory: number[];
};

const curve = (base: number, drift: number, shock = 0) =>
  Array.from({ length: 36 }, (_, index) => {
    const wave = Math.sin(index / 2.8) * 0.035 + Math.cos(index / 5.1) * 0.025;
    const draw = index > 17 && index < 25 ? shock : 0;
    return Math.max(4, Number((base * (1 + drift * index + wave + draw)).toFixed(2)));
  });

export const NSE_UNIVERSE: StockMeta[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy", fallbackPrice: 2942.4, fallbackHistory: curve(2520, 0.004, -0.05) },
  { symbol: "TCS", name: "Tata Consultancy Services", sector: "IT", fallbackPrice: 4018.6, fallbackHistory: curve(3440, 0.0046, -0.03) },
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking", fallbackPrice: 1712.2, fallbackHistory: curve(1545, 0.0027, -0.08) },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Banking", fallbackPrice: 1196.7, fallbackHistory: curve(1020, 0.0041, -0.06) },
  { symbol: "INFY", name: "Infosys", sector: "IT", fallbackPrice: 1518.3, fallbackHistory: curve(1460, 0.0013, -0.09) },
  { symbol: "SBIN", name: "State Bank of India", sector: "Banking", fallbackPrice: 836.8, fallbackHistory: curve(602, 0.0085, -0.07) },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", sector: "Telecom", fallbackPrice: 1422.5, fallbackHistory: curve(980, 0.0102, -0.02) },
  { symbol: "ITC", name: "ITC", sector: "FMCG", fallbackPrice: 439.6, fallbackHistory: curve(418, 0.0011, -0.04) },
  { symbol: "LT", name: "Larsen & Toubro", sector: "Capital Goods", fallbackPrice: 3625.1, fallbackHistory: curve(2840, 0.0071, -0.05) },
  { symbol: "AXISBANK", name: "Axis Bank", sector: "Banking", fallbackPrice: 1183.9, fallbackHistory: curve(930, 0.0062, -0.09) },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Banking", fallbackPrice: 1775.2, fallbackHistory: curve(1860, -0.001, -0.08) },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", sector: "FMCG", fallbackPrice: 2487.8, fallbackHistory: curve(2620, -0.0012, -0.03) },
  { symbol: "MARUTI", name: "Maruti Suzuki", sector: "Automobile", fallbackPrice: 12450.3, fallbackHistory: curve(9860, 0.0072, -0.04) },
  { symbol: "SUNPHARMA", name: "Sun Pharma", sector: "Pharma", fallbackPrice: 1568.4, fallbackHistory: curve(1080, 0.0101, -0.02) },
  { symbol: "TITAN", name: "Titan Company", sector: "Consumer Discretionary", fallbackPrice: 3476.1, fallbackHistory: curve(3120, 0.0029, -0.07) },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", sector: "Financial Services", fallbackPrice: 7062.5, fallbackHistory: curve(7480, -0.0018, -0.12) },
  { symbol: "ASIANPAINT", name: "Asian Paints", sector: "Consumer Discretionary", fallbackPrice: 2918.4, fallbackHistory: curve(3240, -0.0027, -0.05) },
  { symbol: "HCLTECH", name: "HCL Technologies", sector: "IT", fallbackPrice: 1454.8, fallbackHistory: curve(1180, 0.0063, -0.04) },
  { symbol: "WIPRO", name: "Wipro", sector: "IT", fallbackPrice: 493.7, fallbackHistory: curve(418, 0.0045, -0.08) },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement", sector: "Cement", fallbackPrice: 11182.6, fallbackHistory: curve(8560, 0.008, -0.04) },
  { symbol: "ONGC", name: "ONGC", sector: "Energy", fallbackPrice: 274.8, fallbackHistory: curve(168, 0.014, -0.11) },
  { symbol: "NTPC", name: "NTPC", sector: "Utilities", fallbackPrice: 363.2, fallbackHistory: curve(198, 0.017, -0.05) },
  { symbol: "POWERGRID", name: "Power Grid", sector: "Utilities", fallbackPrice: 322.9, fallbackHistory: curve(218, 0.0105, -0.04) },
  { symbol: "TATAMOTORS", name: "Tata Motors", sector: "Automobile", fallbackPrice: 987.4, fallbackHistory: curve(585, 0.014, -0.10) },
  { symbol: "M&M", name: "Mahindra & Mahindra", sector: "Automobile", fallbackPrice: 2894.5, fallbackHistory: curve(1340, 0.021, -0.04) },
  { symbol: "COALINDIA", name: "Coal India", sector: "Energy", fallbackPrice: 452.1, fallbackHistory: curve(232, 0.0175, -0.08) },
  { symbol: "ADANIENT", name: "Adani Enterprises", sector: "Conglomerate", fallbackPrice: 3188.2, fallbackHistory: curve(2450, 0.0077, -0.18) },
  { symbol: "ADANIPORTS", name: "Adani Ports", sector: "Logistics", fallbackPrice: 1468.9, fallbackHistory: curve(760, 0.021, -0.12) },
  { symbol: "JSWSTEEL", name: "JSW Steel", sector: "Metals", fallbackPrice: 921.7, fallbackHistory: curve(785, 0.004, -0.10) },
  { symbol: "TATASTEEL", name: "Tata Steel", sector: "Metals", fallbackPrice: 165.2, fallbackHistory: curve(124, 0.0075, -0.13) },
  { symbol: "NESTLEIND", name: "Nestle India", sector: "FMCG", fallbackPrice: 2486.7, fallbackHistory: curve(2380, 0.001, -0.03) },
  { symbol: "GRASIM", name: "Grasim Industries", sector: "Materials", fallbackPrice: 2674.8, fallbackHistory: curve(1810, 0.011, -0.06) },
  { symbol: "TECHM", name: "Tech Mahindra", sector: "IT", fallbackPrice: 1428.3, fallbackHistory: curve(1240, 0.0032, -0.08) },
  { symbol: "CIPLA", name: "Cipla", sector: "Pharma", fallbackPrice: 1496.6, fallbackHistory: curve(1040, 0.0104, -0.03) },
  { symbol: "DRREDDY", name: "Dr. Reddy's Labs", sector: "Pharma", fallbackPrice: 6372.8, fallbackHistory: curve(4860, 0.0078, -0.04) },
  { symbol: "BRITANNIA", name: "Britannia Industries", sector: "FMCG", fallbackPrice: 5326.9, fallbackHistory: curve(4520, 0.0046, -0.03) },
  { symbol: "EICHERMOT", name: "Eicher Motors", sector: "Automobile", fallbackPrice: 4828.4, fallbackHistory: curve(3520, 0.009, -0.05) },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp", sector: "Automobile", fallbackPrice: 5168.7, fallbackHistory: curve(2860, 0.016, -0.06) },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv", sector: "Financial Services", fallbackPrice: 1594.5, fallbackHistory: curve(1680, -0.0013, -0.09) },
  { symbol: "DIVISLAB", name: "Divi's Laboratories", sector: "Pharma", fallbackPrice: 4526.2, fallbackHistory: curve(3580, 0.0065, -0.08) }
];

export const STOCK_LOOKUP = new Map(NSE_UNIVERSE.map((stock) => [stock.symbol, stock]));
