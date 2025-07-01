import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchRequest, SearchResult } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SearchInterfaceProps {
  onSearchStart: () => void;
  onSearchComplete: (results: SearchResult) => void;
  isSearching: boolean;
}

export default function SearchInterface({ onSearchStart, onSearchComplete, isSearching }: SearchInterfaceProps) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<'company' | 'domain' | 'url'>("domain");
  const [apiSource, setApiSource] = useState("all");
  const [filters, setFilters] = useState({
    jobTitle: "",
    location: "",
    companySize: "",
    industry: "",
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvDomains, setCsvDomains] = useState<string[]>([]);
  const [processingCsv, setProcessingCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  const searchMutation = useMutation({
    mutationFn: async (searchData: SearchRequest & { apiSource?: string }) => {
      try {
        console.log("Sending search request:", searchData);
        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(searchData),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("Search response:", result);
        return result;
      } catch (error) {
        console.error("Search request failed:", error);
        throw error;
      }
    },
    onSuccess: (data: SearchResult) => {
      console.log("=== SEARCH MUTATION SUCCESS ===");
      console.log("Search results data:", data);
      console.log("Total results:", data.totalResults);
      console.log("Leads array:", data.leads);
      
      onSearchComplete(data);
      
      toast({
        title: "Search Completed",
        description: `Found ${data.totalResults} leads with ${data.verifiedEmails} verified emails`,
      });
    },
    onError: (error: any) => {
      console.error("Search failed:", error);
      toast({
        title: "Search Failed",
        description: error.message || "An error occurred during search",
        variant: "destructive",
      });
    },
  });

  const bulkSearchMutation = useMutation({
    mutationFn: async (domains: string[]) => {
      const results = [];
      for (const domain of domains) {
        try {
          const response = await apiRequest("POST", "/api/search", {
            query: domain.trim(),
            searchType: "domain",
            filters,
            apiSource,
          });
          const result = await response.json();
          results.push(result);
        } catch (error) {
          console.error(`Failed to search ${domain}:`, error);
        }
      }
      return results;
    },
    onSuccess: (results: SearchResult[]) => {
      const combinedResult = results.reduce((acc, result) => ({
        searchId: result.searchId,
        totalResults: acc.totalResults + result.totalResults,
        verifiedEmails: acc.verifiedEmails + result.verifiedEmails,
        apiCallsUsed: acc.apiCallsUsed + result.apiCallsUsed,
        searchTime: acc.searchTime + result.searchTime,
        leads: [...acc.leads, ...result.leads],
      }), {
        searchId: 0,
        totalResults: 0,
        verifiedEmails: 0,
        apiCallsUsed: 0,
        searchTime: 0,
        leads: [],
      });
      
      onSearchComplete(combinedResult);
      toast({
        title: "Bulk Search Completed",
        description: `Processed ${csvDomains.length} domains, found ${combinedResult.totalResults} total leads`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Search Failed",
        description: error.message || "An error occurred during bulk search",
        variant: "destructive",
      });
    },
  });

  const parseCsvFile = (file: File) => {
    return new Promise<string[]>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
          
          // Auto-detect domain column
          const domainColumnIndex = headers.findIndex(header => 
            header.includes('domain') || 
            header.includes('website') || 
            header.includes('url') ||
            header.includes('site')
          );
          
          if (domainColumnIndex === -1) {
            reject(new Error('No domain column found. Please ensure your CSV has a column named "domain", "website", "url", or "site".'));
            return;
          }
          
          const domains = lines.slice(1)
            .map(line => {
              const columns = line.split(',');
              return columns[domainColumnIndex]?.trim().replace(/['"]/g, '');
            })
            .filter(domain => domain && domain.length > 0)
            .map(domain => {
              // Clean domain: remove http/https and www
              return domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
            });
          
          resolve(domains);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }
    
    setProcessingCsv(true);
    try {
      const domains = await parseCsvFile(file);
      setCsvFile(file);
      setCsvDomains(domains);
      toast({
        title: "CSV Processed",
        description: `Found ${domains.length} domains ready for bulk search`,
      });
    } catch (error: any) {
      toast({
        title: "CSV Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingCsv(false);
    }
  };

  const handleSearch = async () => {
    console.log("=== FRONTEND SEARCH BUTTON CLICKED ===");
    alert("Search button clicked! Check console for details.");
    
    if (!query.trim()) {
      toast({
        title: "Invalid Query",
        description: "Please enter a company name, domain, or URL",
        variant: "destructive",
      });
      return;
    }

    onSearchStart();
    
    try {
      const searchData = {
        query: query.trim(),
        searchType,
        filters,
        apiSource: "website-contacts-scraper",
      };
      
      console.log("Frontend sending search request:", searchData);
      
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Frontend received search results:", result);
      
      onSearchComplete(result);
      
      toast({
        title: "Search Completed",
        description: `Found ${result.totalResults} leads with ${result.verifiedEmails} verified emails`,
      });
      
    } catch (error) {
      console.error("Frontend search error:", error);
      toast({
        title: "Search Failed",
        description: "Failed to connect to search API",
        variant: "destructive",
      });
    }
  };

  const handleBulkSearch = () => {
    if (csvDomains.length === 0) {
      toast({
        title: "No Domains",
        description: "Please upload a CSV file with domains first",
        variant: "destructive",
      });
      return;
    }

    onSearchStart();
    bulkSearchMutation.mutate(csvDomains);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-6">
      <div className="max-w-6xl">
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="single">Single Search</TabsTrigger>
            <TabsTrigger value="bulk">Bulk CSV Upload</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Search Input */}
              <div className="lg:col-span-2">
                <Label className="block text-sm font-medium text-gray-700 mb-2">Company Search</Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter company name, domain, or URL..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full px-4 py-3 pr-20"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    type="button"
                  >
                    {isSearching ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-search mr-2"></i>
                        Search
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* API Selection */}
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">API Source Control</Label>
                <Select value={apiSource} onValueChange={setApiSource}>
                  <SelectTrigger className="w-full px-4 py-3 border-2 border-primary/20 focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 rounded-full"></div>
                        <span>All APIs (Best Results)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="apollo-scraper">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Apollo Scraper Only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="apollo-api">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Apollo.io API Only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="contact-scraper">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Contact Scraper Only</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {apiSource === "all" ? "Uses multiple APIs for maximum coverage and data enrichment" : 
                   apiSource === "apollo-scraper" ? "Specialized for Apollo.io profile URLs and direct email extraction" :
                   apiSource === "apollo-api" ? "Advanced search with filters for people within companies" :
                   "Search by domain, website URL, or company name for direct contacts"}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <Card className="border-2 border-dashed border-gray-300 hover:border-primary transition-colors">
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <i className="fas fa-file-csv text-primary text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Upload CSV File</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Upload a CSV file with domains. We'll automatically detect columns named 'domain', 'website', 'url', or 'site'.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".csv"
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={processingCsv}
                      className="bg-primary text-white"
                    >
                      {processingCsv ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-upload mr-2"></i>
                          Choose CSV File
                        </>
                      )}
                    </Button>
                    
                    {csvFile && csvDomains.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 text-green-800">
                          <i className="fas fa-check-circle"></i>
                          <span className="font-medium">{csvFile.name}</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          {csvDomains.length} domains ready for bulk search
                        </p>
                        <div className="mt-3 space-y-2">
                          <Button
                            onClick={handleBulkSearch}
                            disabled={isSearching || bulkSearchMutation.isPending}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                          >
                            {isSearching || bulkSearchMutation.isPending ? (
                              <>
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                Processing {csvDomains.length} domains...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-rocket mr-2"></i>
                                Start Bulk Search ({csvDomains.length} domains)
                              </>
                            )}
                          </Button>
                          <div className="text-xs text-gray-500">
                            Preview: {csvDomains.slice(0, 3).join(', ')}{csvDomains.length > 3 ? '...' : ''}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Filters - Shared between both tabs */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Advanced Filters (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Job Title</Label>
                <Input
                  type="text"
                  placeholder="e.g., Sales Manager"
                  value={filters.jobTitle}
                  onChange={(e) => setFilters({ ...filters, jobTitle: e.target.value })}
                  className="w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Location</Label>
                <Input
                  type="text"
                  placeholder="e.g., San Francisco, CA"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Company Size</Label>
                <Select value={filters.companySize} onValueChange={(value) => setFilters({ ...filters, companySize: value })}>
                  <SelectTrigger className="w-full px-3 py-2 text-sm">
                    <SelectValue placeholder="Any Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Size</SelectItem>
                    <SelectItem value="1-50">1-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-1000">201-1000 employees</SelectItem>
                    <SelectItem value="1000+">1000+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Industry</Label>
                <Select value={filters.industry} onValueChange={(value) => setFilters({ ...filters, industry: value })}>
                  <SelectTrigger className="w-full px-3 py-2 text-sm">
                    <SelectValue placeholder="All Industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
