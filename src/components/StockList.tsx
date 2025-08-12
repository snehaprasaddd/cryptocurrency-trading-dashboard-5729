import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

const fetchStockData = async (): Promise<Stock[]> => {
  // For demo purposes, using mock data. In production, replace with real API like Alpha Vantage, IEX Cloud, etc.
  const mockStocks: Stock[] = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 185.92,
      change: 2.45,
      changePercent: 1.34,
      volume: 45623000
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 138.21,
      change: -1.87,
      changePercent: -1.33,
      volume: 25847000
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      price: 378.85,
      change: 5.23,
      changePercent: 1.40,
      volume: 32156000
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      price: 248.50,
      change: -8.75,
      changePercent: -3.40,
      volume: 78963000
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      price: 145.86,
      change: 3.12,
      changePercent: 2.18,
      volume: 34521000
    }
  ];

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return mockStocks;
};

const StockList = () => {
  const { data: stocks, isLoading } = useQuery({
    queryKey: ['stocks'],
    queryFn: fetchStockData,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return <div className="glass-card rounded-lg p-6 animate-pulse">Loading stocks...</div>;
  }

  return (
    <div className="glass-card rounded-lg p-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-6">Top Stocks</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-muted-foreground">
              <th className="pb-4">Name</th>
              <th className="pb-4">Price</th>
              <th className="pb-4">24h Change</th>
              <th className="pb-4">Volume</th>
            </tr>
          </thead>
          <tbody>
            {stocks?.map((stock) => (
              <tr key={stock.symbol} className="border-t border-secondary">
                <td className="py-4">
                  <div>
                    <p className="font-medium">{stock.name}</p>
                    <p className="text-sm text-muted-foreground">{stock.symbol}</p>
                  </div>
                </td>
                <td className="py-4">${stock.price.toLocaleString()}</td>
                <td className="py-4">
                  <span
                    className={`flex items-center gap-1 ${
                      stock.changePercent >= 0 ? "text-success" : "text-warning"
                    }`}
                  >
                    {stock.changePercent >= 0 ? (
                      <ArrowUpIcon className="w-3 h-3" />
                    ) : (
                      <ArrowDownIcon className="w-3 h-3" />
                    )}
                    {Math.abs(stock.changePercent).toFixed(2)}%
                  </span>
                  <span className={`text-sm ${stock.changePercent >= 0 ? "text-success" : "text-warning"}`}>
                    ${Math.abs(stock.change).toFixed(2)}
                  </span>
                </td>
                <td className="py-4">{(stock.volume / 1e6).toFixed(1)}M</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockList;