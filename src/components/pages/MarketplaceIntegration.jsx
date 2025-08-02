import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, Check, ChevronRight, ExternalLink } from "lucide-react";
import { notificationService } from "@/services/api/notificationService";
import { marketplaceService } from "@/services/api/marketplaceService";
import { productService } from "@/services/api/productService";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import POS from "@/components/pages/POS";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
const MarketplaceIntegration = () => {
  const [integrations, setIntegrations] = useState({
    ebay: { connected: false, status: 'disconnected', lastSync: null },
    amazon: { connected: false, status: 'disconnected', lastSync: null },
    whatsapp: { connected: false, status: 'disconnected', lastSync: null },
    facebook: { connected: false, status: 'disconnected', lastSync: null },
    instagram: { connected: false, status: 'disconnected', lastSync: null }
  });
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState({});
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [integrationData, productData] = await Promise.all([
        marketplaceService.getIntegrationStatus(),
        productService.getAll()
      ]);
      
      setIntegrations(integrationData);
      setProducts(productData);
    } catch (err) {
      setError('Failed to load marketplace data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform) => {
    try {
      setSyncing(prev => ({ ...prev, [platform]: true }));
      
      const result = await marketplaceService.connect(platform);
      
      if (result.success) {
        setIntegrations(prev => ({
          ...prev,
          [platform]: {
            connected: true,
            status: 'connected',
            lastSync: new Date().toISOString()
          }
        }));
        toast.success(`Connected to ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`);
      }
    } catch (error) {
      console.error(`Failed to connect to ${platform}:`, error);
      toast.error(`Failed to connect to ${platform}`);
    } finally {
      setSyncing(prev => ({ ...prev, [platform]: false }));
    }
  };

  const handleSync = async (platform) => {
    try {
      setSyncing(prev => ({ ...prev, [platform]: true }));
      
      const selectedIds = selectedProducts.length > 0 ? selectedProducts : products.map(p => p.Id);
      const result = await marketplaceService.syncProducts(platform, selectedIds);
      
      if (result.success) {
        setIntegrations(prev => ({
          ...prev,
          [platform]: {
            ...prev[platform],
            lastSync: new Date().toISOString()
          }
        }));
        toast.success(`Synced ${result.count} products to ${platform}!`);
      }
    } catch (error) {
      console.error(`Sync failed for ${platform}:`, error);
      toast.error(`Failed to sync to ${platform}`);
    } finally {
      setSyncing(prev => ({ ...prev, [platform]: false }));
    }
  };

  const handleWhatsAppCatalog = async () => {
    try {
      setSyncing(prev => ({ ...prev, whatsapp: true }));
      
      const phoneNumber = prompt('Enter customer phone number (with country code):');
      if (!phoneNumber) return;
      
      const selectedProductData = selectedProducts.length > 0 
        ? products.filter(p => selectedProducts.includes(p.Id))
        : products.slice(0, 10);
      
      await notificationService.sendWhatsAppCatalog(phoneNumber, selectedProductData);
      toast.success('Catalog sent via WhatsApp!');
    } catch (error) {
      console.error('WhatsApp catalog failed:', error);
      toast.error('Failed to send WhatsApp catalog');
    } finally {
      setSyncing(prev => ({ ...prev, whatsapp: false }));
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  if (loading) return <Loading type="grid" count={6} />;
  if (error) return <Error message={error} onRetry={loadData} />;

  const platformConfigs = {
    ebay: {
      name: 'eBay',
      icon: 'Globe',
      color: 'blue',
      description: 'List products on eBay marketplace'
    },
    amazon: {
      name: 'Amazon',
      icon: 'Package',
      color: 'orange',
      description: 'Sell on Amazon marketplace'
    },
    whatsapp: {
      name: 'WhatsApp Business',
      icon: 'MessageCircle',
      color: 'green',
      description: 'Share catalog via WhatsApp'
    },
    facebook: {
      name: 'Facebook Shop',
      icon: 'Facebook',
      color: 'blue',
      description: 'Sell on Facebook marketplace'
    },
    instagram: {
      name: 'Instagram Shop',
      icon: 'Instagram',
      color: 'pink',
      description: 'Create Instagram shopping posts'
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold gradient-text">Marketplace Integration</h1>
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/pos'}
              icon="ArrowLeft"
            >
              Back to POS
            </Button>
          </div>
          <p className="text-gray-600">Manage your omnichannel sales across multiple platforms</p>
        </div>

        {/* Integration Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Object.entries(platformConfigs).map(([platform, config]) => {
            const integration = integrations[platform];
            const isSyncing = syncing[platform];
            
            return (
              <motion.div
                key={platform}
                className="bg-white rounded-lg shadow-md p-6"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <ApperIcon 
                      name={config.icon} 
                      className={`w-8 h-8 text-${config.color}-500`} 
                    />
                    <div>
                      <h3 className="font-semibold">{config.name}</h3>
                      <p className="text-sm text-gray-500">{config.description}</p>
                    </div>
                  </div>
                  
                  <Badge variant={integration.connected ? "success" : "error"}>
                    {integration.status}
                  </Badge>
                </div>

                {integration.connected && integration.lastSync && (
                  <p className="text-xs text-gray-500 mb-4">
                    Last sync: {new Date(integration.lastSync).toLocaleString()}
                  </p>
                )}

                <div className="space-y-2">
                  {!integration.connected ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleConnect(platform)}
                      disabled={isSyncing}
                      className="w-full"
                      icon={isSyncing ? "Loader" : "Link"}
                    >
                      {isSyncing ? 'Connecting...' : 'Connect'}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(platform)}
                        disabled={isSyncing}
                        className="w-full"
                        icon={isSyncing ? "Loader" : "Upload"}
                      >
                        {isSyncing ? 'Syncing...' : 'Sync Products'}
                      </Button>
                      
                      {platform === 'whatsapp' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleWhatsAppCatalog}
                          disabled={isSyncing}
                          className="w-full"
                          icon="Send"
                        >
                          Send Catalog
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Product Selection */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Product Selection</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProducts([])}
                icon="X"
              >
                Clear Selection ({selectedProducts.length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProducts(products.map(p => p.Id))}
                icon="CheckSquare"
              >
                Select All
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <motion.div
                key={product.Id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedProducts.includes(product.Id)
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleProductSelection(product.Id)}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <ApperIcon name="Package" className="w-6 h-6 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{product.name}</h4>
                    <p className="text-primary font-bold">${product.price}</p>
                  </div>
                  {selectedProducts.includes(product.Id) && (
                    <ApperIcon name="Check" className="w-5 h-5 text-primary" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceIntegration;