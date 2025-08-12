import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";

interface SearchResult {
  symbol: string;
  name: string;
  type: 'stock' | 'crypto';
  price?: number;
}

interface SearchBarProps {
  onAddToPortfolio: (asset: SearchResult, quantity: number, purchasePrice: number) => void;
}

// Yahoo Finance API integration
const searchStocks = async (query: string) => {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&lang=en-US&region=US&quotesCount=8&newsCount=0`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch stock data');
    }
    
    const data = await response.json();
    
    return data.quotes?.filter((quote: any) => 
      quote.typeDisp === 'Equity' && quote.exchange
    ).map((quote: any) => ({
      symbol: quote.symbol,
      name: quote.longname || quote.shortname || quote.symbol,
      type: 'stock' as const,
      price: quote.regularMarketPrice || 0,
      exchange: quote.exchange
    })) || [];
  } catch (error) {
    console.error('Error searching stocks:', error);
    return [];
  }
};

const searchAssets = async (query: string): Promise<SearchResult[]> => {
  if (!query || query.length < 2) return [];

  const results: SearchResult[] = [];
  
  // Search stocks using Yahoo Finance
  const stockResults = await searchStocks(query);
  results.push(...stockResults.slice(0, 5));

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
  const [selectedAsset, setSelectedAsset] = useState<SearchResult | null>(null);
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchAssets(query),
    enabled: query.length >= 2,
    staleTime: 300000, // 5 minutes
  });

  const handleSelectAsset = (asset: SearchResult) => {
    setSelectedAsset(asset);
    setPurchasePrice(asset.price?.toString() || '');
    setIsAddDialogOpen(true);
    setIsOpen(false);
  };

  const handleAddToPortfolio = () => {
    if (!selectedAsset) return;

    const qty = parseFloat(quantity);
    const price = parseFloat(purchasePrice);

    if (isNaN(qty) || isNaN(price) || qty <= 0 || price <= 0) {
      return;
    }

    onAddToPortfolio(selectedAsset, qty, price);
    setIsAddDialogOpen(false);
    setSelectedAsset(null);
    setQuantity('');
    setPurchasePrice('');
    setQuery('');
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
                  onClick={() => handleSelectAsset(result)}
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

      {/* Add to Portfolio Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {selectedAsset?.name} to Portfolio</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Asset</p>
                <p className="font-medium">{selectedAsset.symbol} - {selectedAsset.name}</p>
                <span className={`text-xs px-2 py-1 rounded ${
                  selectedAsset.type === 'stock' 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-warning/20 text-warning'
                }`}>
                  {selectedAsset.type}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  min="0"
                  step="any"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Purchase Price ($)</label>
                <Input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="Enter purchase price"
                  min="0"
                  step="any"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddToPortfolio} className="flex-1">
                  Add to Portfolio
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SearchBar;