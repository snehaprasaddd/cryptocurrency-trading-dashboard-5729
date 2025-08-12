import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface SearchResult {
  symbol: string;
  name: string;
  type: 'stock' | 'crypto';
  price?: number;
}

interface SearchBarProps {
  onAddToPortfolio: (asset: SearchResult) => void;
}

const searchAssets = async (query: string): Promise<SearchResult[]> => {
  if (!query || query.length < 2) return [];

  const results: SearchResult[] = [];
  
  // Search stocks using a free API (using Alpha Vantage or similar)
  try {
    // For demo purposes, using mock data. In production, replace with real API
    const mockStocks = [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' as const, price: 185.92 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' as const, price: 138.21 },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock' as const, price: 378.85 },
      { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' as const, price: 248.50 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock' as const, price: 145.86 },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock' as const, price: 875.28 },
      { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock' as const, price: 504.20 },
      { symbol: 'NFLX', name: 'Netflix Inc.', type: 'stock' as const, price: 489.33 },
    ];
    
    const filteredStocks = mockStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
    );
    
    results.push(...filteredStocks);
  } catch (error) {
    console.error('Error searching stocks:', error);
  }

  // Search crypto using CoinGecko
  try {
    const cryptoResponse = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`
    );
    
    if (cryptoResponse.ok) {
      const cryptoData = await cryptoResponse.json();
      const cryptoResults = cryptoData.coins?.slice(0, 5).map((coin: any) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        type: 'crypto' as const,
      })) || [];
      
      results.push(...cryptoResults);
    }
  } catch (error) {
    console.error('Error searching crypto:', error);
  }

  return results.slice(0, 10);
};

const SearchBar = ({ onAddToPortfolio }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchAssets(query),
    enabled: query.length >= 2,
    staleTime: 300000, // 5 minutes
  });

  const handleAddToPortfolio = (asset: SearchResult) => {
    onAddToPortfolio(asset);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search stocks & crypto..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.length >= 2);
          }}
          onFocus={() => setIsOpen(query.length >= 2)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 glass-card rounded-lg border border-border shadow-lg z-50 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((result, index) => (
                <button
                  key={`${result.symbol}-${index}`}
                  onClick={() => handleAddToPortfolio(result)}
                  className="w-full px-4 py-2 text-left hover:bg-muted/20 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{result.symbol}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {result.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.price && (
                      <span className="text-sm text-muted-foreground">
                        ${result.price.toFixed(2)}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded ${
                      result.type === 'stock' 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-warning/20 text-warning'
                    }`}>
                      {result.type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-muted-foreground">
              No results found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;