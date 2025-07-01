import { ApiConfiguration } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2 } from "lucide-react";

interface ApiManagementProps {
  configs: ApiConfiguration[];
}

function AddApiDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    apiKey: "",
    endpoint: "",
    rateLimitPerMonth: 1000,
    isActive: true
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const addApiMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/configurations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/configurations"] });
      toast({ title: "API added successfully" });
      setOpen(false);
      setFormData({
        name: "",
        apiKey: "",
        endpoint: "",
        rateLimitPerMonth: 1000,
        isActive: true
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to add API", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.apiKey || !formData.endpoint) {
      toast({ 
        title: "Missing required fields", 
        description: "Please fill in all required fields",
        variant: "destructive" 
      });
      return;
    }
    addApiMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add New API
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New API Configuration</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">API Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Custom Lead API"
              required
            />
          </div>
          <div>
            <Label htmlFor="apiKey">API Key *</Label>
            <Input
              id="apiKey"
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="Your API key"
              required
            />
          </div>
          <div>
            <Label htmlFor="endpoint">API Endpoint *</Label>
            <Input
              id="endpoint"
              value={formData.endpoint}
              onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
              placeholder="https://api.example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="rateLimit">Monthly Rate Limit</Label>
            <Input
              id="rateLimit"
              type="number"
              value={formData.rateLimitPerMonth}
              onChange={(e) => setFormData({ ...formData, rateLimitPerMonth: parseInt(e.target.value) || 1000 })}
              min="1"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
            />
            <Label htmlFor="isActive">Enable API</Label>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={addApiMutation.isPending} className="flex-1">
              {addApiMutation.isPending ? "Adding..." : "Add API"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditApiDialog({ config }: { config: ApiConfiguration }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: config.name,
    apiKey: config.apiKey,
    endpoint: config.endpoint,
    rateLimitPerMonth: config.rateLimitPerMonth || 1000,
    isActive: config.isActive || true
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const updateApiMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("PUT", `/api/configurations/${config.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/configurations"] });
      toast({ title: "API updated successfully" });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update API", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateApiMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Edit2 className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit API Configuration</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">API Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-apiKey">API Key *</Label>
            <Input
              id="edit-apiKey"
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-endpoint">API Endpoint *</Label>
            <Input
              id="edit-endpoint"
              value={formData.endpoint}
              onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-rateLimit">Monthly Rate Limit</Label>
            <Input
              id="edit-rateLimit"
              type="number"
              value={formData.rateLimitPerMonth}
              onChange={(e) => setFormData({ ...formData, rateLimitPerMonth: parseInt(e.target.value) || 1000 })}
              min="1"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="edit-isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
            />
            <Label htmlFor="edit-isActive">Enable API</Label>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={updateApiMutation.isPending} className="flex-1">
              {updateApiMutation.isPending ? "Updating..." : "Update API"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ApiManagement({ configs }: ApiManagementProps) {
  const DeleteApiButton = ({ configId, configName }: { configId: number; configName: string }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    
    const deleteApiMutation = useMutation({
      mutationFn: async () => {
        const response = await apiRequest("DELETE", `/api/configurations/${configId}`, {});
        return response.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/configurations"] });
        toast({ title: `${configName} API deleted successfully` });
      },
      onError: (error: any) => {
        toast({ 
          title: "Failed to delete API", 
          description: error.message,
          variant: "destructive" 
        });
      }
    });

    const handleDelete = () => {
      if (window.confirm(`Are you sure you want to delete "${configName}"? This action cannot be undone.`)) {
        deleteApiMutation.mutate();
      }
    };

    return (
      <Button 
        size="sm" 
        variant="outline" 
        onClick={handleDelete}
        disabled={deleteApiMutation.isPending}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    );
  };
  const getStatusColor = (config: ApiConfiguration) => {
    if (!config.isActive) return "status-error";
    const usagePercentage = (config.usedThisMonth / config.rateLimitPerMonth) * 100;
    if (usagePercentage > 80) return "status-warning";
    return "status-active";
  };

  const getStatusText = (config: ApiConfiguration) => {
    if (!config.isActive) return "Inactive";
    const usagePercentage = (config.usedThisMonth / config.rateLimitPerMonth) * 100;
    if (usagePercentage > 80) return "Limited";
    return "Active";
  };

  const getApiIcon = (name: string) => {
    switch (name) {
      case "Apollo Scraper": return "🔵";
      case "Apollo.io API": return "🟣";
      case "Contact Scraper": return "🟠";
      default: return "⚪";
    }
  };

  const getUsagePercentage = (config: ApiConfiguration) => {
    return Math.round((config.usedThisMonth / config.rateLimitPerMonth) * 100);
  };

  return (
    <div className="p-4 border-t border-gray-200">
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">API Configuration</h3>
        
        {/* Active APIs */}
        <div className="space-y-3 mb-4">
          {configs.map((config) => (
            <div key={config.id} className="bg-white rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{getApiIcon(config.name)}</span>
                  <span className="text-xs font-medium text-gray-700">{config.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <EditApiDialog config={config} />
                  <DeleteApiButton configId={config.id} configName={config.name} />
                  <div className={`status-dot ${getStatusColor(config)}`}></div>
                  <span className="text-xs text-gray-500">{getStatusText(config)}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Usage</span>
                  <span>{config.usedThisMonth}/{config.rateLimitPerMonth}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      getUsagePercentage(config) > 80 ? 'bg-red-500' : 
                      getUsagePercentage(config) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(getUsagePercentage(config), 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  {getUsagePercentage(config)}% used this month
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add New API Button */}
        <AddApiDialog />

        {/* API Key Management */}
        <Button className="w-full bg-primary text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors">
          <i className="fas fa-key mr-2"></i>
          Manage Keys
        </Button>
      </div>
    </div>
  );
}
