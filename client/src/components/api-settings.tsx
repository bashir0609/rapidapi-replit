import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Eye, EyeOff, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApiSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiSettings({ isOpen, onClose }: ApiSettingsProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown');
  const { toast } = useToast();

  // Load saved API key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('rapidapi_key');
    if (savedKey) {
      setApiKey(savedKey);
      setKeyStatus('valid'); // Assume valid if previously saved
    }
  }, []);

  const validateApiKey = async (key: string) => {
    if (!key || key.length < 20) {
      setKeyStatus('invalid');
      return false;
    }

    setIsValidating(true);
    try {
      // Test the API key with a simple domain search
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": key
        },
        body: JSON.stringify({
          query: "test.com",
          searchType: "domain",
          apiSource: "website-contacts-scraper"
        }),
      });

      if (response.ok || response.status === 429) { // 429 = rate limit but key is valid
        setKeyStatus('valid');
        return true;
      } else {
        setKeyStatus('invalid');
        return false;
      }
    } catch (error) {
      setKeyStatus('invalid');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid RapidAPI key",
        variant: "destructive"
      });
      return;
    }

    const isValid = await validateApiKey(apiKey);
    
    if (isValid) {
      localStorage.setItem('rapidapi_key', apiKey);
      
      // Also send to backend
      try {
        await fetch("/api/settings/rapidapi-key", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ apiKey }),
        });
      } catch (error) {
        console.warn("Could not save key to backend:", error);
      }

      toast({
        title: "Success",
        description: "RapidAPI key saved and validated successfully",
      });
      onClose();
    } else {
      toast({
        title: "Invalid Key",
        description: "The RapidAPI key appears to be invalid. Please check and try again.",
        variant: "destructive"
      });
    }
  };

  const handleTestKey = () => {
    if (apiKey) {
      validateApiKey(apiKey);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rapidapi-key">RapidAPI Key</Label>
            <div className="relative">
              <Input
                id="rapidapi-key"
                type={showKey ? "text" : "password"}
                placeholder="Enter your RapidAPI key"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setKeyStatus('unknown');
                }}
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {keyStatus === 'valid' && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
                {keyStatus === 'invalid' && (
                  <X className="h-4 w-4 text-red-600" />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKey(!showKey)}
                  className="h-8 w-8 p-0"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {keyStatus === 'valid' && (
              <Badge variant="default" className="text-xs">
                ✓ Key validated successfully
              </Badge>
            )}
            {keyStatus === 'invalid' && (
              <Badge variant="destructive" className="text-xs">
                ✗ Invalid or expired key
              </Badge>
            )}
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>How to get your RapidAPI Key:</strong></p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Go to <a href="https://rapidapi.com" target="_blank" rel="noopener" className="text-blue-600 underline">RapidAPI.com</a></li>
              <li>Sign up or log in to your account</li>
              <li>Subscribe to "Website Contacts Scraper" API</li>
              <li>Copy your API key from the dashboard</li>
              <li>Paste it above and click "Save Key"</li>
            </ol>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleTestKey}
              disabled={!apiKey || isValidating}
              className="flex-1"
            >
              {isValidating ? "Testing..." : "Test Key"}
            </Button>
            <Button
              onClick={handleSaveKey}
              disabled={!apiKey || isValidating}
              className="flex-1"
            >
              Save Key
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}