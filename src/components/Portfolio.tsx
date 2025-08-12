import { useState, useEffect } from "react";
import { PlusIcon, EditIcon, TrashIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import SearchBar from "./SearchBar";

interface PortfolioItem {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'crypto';
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
}

interface SearchResult {
  symbol: string;
  name: string;
  type: 'stock' | 'crypto';
  price?: number;
}

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Load portfolio from localStorage on component mount
  useEffect(() => {
    const savedPortfolio = localStorage.getItem('portfolio');
    if (savedPortfolio) {
      try {
        setPortfolio(JSON.parse(savedPortfolio));
      } catch (error) {
        console.error('Error loading portfolio:', error);
      }
    }
  }, []);

  // Save portfolio to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  // Mock function to get current prices (in production, replace with real API calls)
  const getCurrentPrice = async (symbol: string, type: 'stock' | 'crypto'): Promise<number> => {
    // Mock prices for demo
    const mockPrices: Record<string, number> = {
      'AAPL': 185.92,
      'GOOGL': 138.21,
      'MSFT': 378.85,
      'TSLA': 248.50,
      'AMZN': 145.86,
      'NVDA': 875.28,
      'META': 504.20,
      'NFLX': 489.33,
      'BTC': 119051,
      'ETH': 4399.16,
      'XRP': 3.18,
    };
    
    return mockPrices[symbol] || 100;
  };

  const addToPortfolio = async (asset: SearchResult, quantity: number, purchasePrice: number) => {
    const currentPrice = asset.price || await getCurrentPrice(asset.symbol, asset.type);
    
    const newItem: PortfolioItem = {
      id: Date.now().toString(),
      symbol: asset.symbol,
      name: asset.name,
      type: asset.type,
      quantity,
      purchasePrice,
      currentPrice,
    };

    setPortfolio(prev => [...prev, newItem]);
    toast({
      title: "Added to Portfolio",
      description: `${asset.symbol} has been added to your portfolio.`,
    });
  };

  const handleAddFromSearch = (asset: SearchResult) => {
    setIsAddDialogOpen(true);
    // You could pre-populate with the selected asset here
  };

  const removeFromPortfolio = (id: string) => {
    setPortfolio(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Removed from Portfolio",
      description: "Item has been removed from your portfolio.",
    });
  };

  const editPortfolioItem = (item: PortfolioItem) => {
    setEditingItem(item);
    setEditQuantity(item.quantity.toString());
    setEditPrice(item.purchasePrice.toString());
    setIsEditDialogOpen(true);
  };

  const saveEdit = () => {
    if (!editingItem) return;

    const quantity = parseFloat(editQuantity);
    const price = parseFloat(editPrice);

    if (isNaN(quantity) || isNaN(price) || quantity <= 0 || price <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid positive numbers.",
        variant: "destructive",
      });
      return;
    }

    setPortfolio(prev => prev.map(item => 
      item.id === editingItem.id 
        ? { ...item, quantity, purchasePrice: price }
        : item
    ));

    setIsEditDialogOpen(false);
    setEditingItem(null);
    toast({
      title: "Portfolio Updated",
      description: "Your portfolio item has been updated.",
    });
  };

  const calculateGainLoss = (item: PortfolioItem) => {
    const totalValue = item.currentPrice * item.quantity;
    const totalCost = item.purchasePrice * item.quantity;
    const gainLoss = totalValue - totalCost;
    const percentage = ((gainLoss / totalCost) * 100);
    return { gainLoss, percentage };
  };

  const getTotalPortfolioValue = () => {
    return portfolio.reduce((total, item) => total + (item.currentPrice * item.quantity), 0);
  };

  const getTotalInvested = () => {
    return portfolio.reduce((total, item) => total + (item.purchasePrice * item.quantity), 0);
  };

  const totalValue = getTotalPortfolioValue();
  const totalInvested = getTotalInvested();
  const totalGainLoss = totalValue - totalInvested;
  const totalPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  return (
    <div className="glass-card rounded-lg p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Your Portfolio</h2>
        <div className="flex items-center gap-4">
          <SearchBar onAddToPortfolio={handleAddFromSearch} />
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusIcon className="w-4 h-4" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Asset to Portfolio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Use the search bar above to find and add assets to your portfolio.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-secondary/30 p-4 rounded-lg">
          <h3 className="text-sm text-muted-foreground">Total Value</h3>
          <p className="text-2xl font-semibold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-secondary/30 p-4 rounded-lg">
          <h3 className="text-sm text-muted-foreground">Total Invested</h3>
          <p className="text-2xl font-semibold">${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-secondary/30 p-4 rounded-lg">
          <h3 className="text-sm text-muted-foreground">Total Gain/Loss</h3>
          <p className={`text-2xl font-semibold ${totalGainLoss >= 0 ? 'text-success' : 'text-warning'}`}>
            ${totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-sm flex items-center gap-1 ${totalGainLoss >= 0 ? 'text-success' : 'text-warning'}`}>
            {totalGainLoss >= 0 ? <TrendingUpIcon className="w-3 h-3" /> : <TrendingDownIcon className="w-3 h-3" />}
            {Math.abs(totalPercentage).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Portfolio Items */}
      {portfolio.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="mb-2">Your portfolio is empty</p>
          <p className="text-sm">Use the search bar to add stocks and crypto to track your investments</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground border-b border-border">
                <th className="pb-4">Asset</th>
                <th className="pb-4">Quantity</th>
                <th className="pb-4">Purchase Price</th>
                <th className="pb-4">Current Price</th>
                <th className="pb-4">Total Value</th>
                <th className="pb-4">Gain/Loss</th>
                <th className="pb-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((item) => {
                const { gainLoss, percentage } = calculateGainLoss(item);
                return (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="py-4">
                      <div>
                        <p className="font-medium">{item.symbol}</p>
                        <p className="text-sm text-muted-foreground">{item.name}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.type === 'stock' 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-warning/20 text-warning'
                        }`}>
                          {item.type}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">{item.quantity}</td>
                    <td className="py-4">${item.purchasePrice.toLocaleString()}</td>
                    <td className="py-4">${item.currentPrice.toLocaleString()}</td>
                    <td className="py-4">${(item.currentPrice * item.quantity).toLocaleString()}</td>
                    <td className="py-4">
                      <span className={`${gainLoss >= 0 ? 'text-success' : 'text-warning'}`}>
                        ${gainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <br />
                      <span className={`text-sm flex items-center gap-1 ${gainLoss >= 0 ? 'text-success' : 'text-warning'}`}>
                        {gainLoss >= 0 ? <TrendingUpIcon className="w-3 h-3" /> : <TrendingDownIcon className="w-3 h-3" />}
                        {Math.abs(percentage).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => editPortfolioItem(item)}
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeFromPortfolio(item.id)}
                          className="text-warning hover:text-warning"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Portfolio Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Asset</label>
                <p className="text-lg">{editingItem.symbol} - {editingItem.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  min="0"
                  step="any"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Purchase Price</label>
                <Input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="Enter purchase price"
                  min="0"
                  step="any"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveEdit} className="flex-1">
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
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

export default Portfolio;