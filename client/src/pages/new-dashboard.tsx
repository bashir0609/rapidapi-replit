import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { SearchResult, Lead } from "@/lib/types";
import { Download, Upload, Settings } from "lucide-react";
import ApiSettings from "@/components/api-settings";

export default function NewDashboard() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvDomains, setCsvDomains] = useState<string[]>([]);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [allResults, setAllResults] = useState<Lead[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsPerPage = 10;

  const handleSearch = async () => {
    if (!query.trim()) {
      alert("Please enter a domain name");
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      console.log("Searching for:", query);
      
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
          searchType: "domain",
          apiSource: "website-contacts-scraper"
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Search completed:", result);
      
      setSearchResults(result);

    } catch (err) {
      console.error("Search failed:", err);
      setError(String(err));
    } finally {
      setIsSearching(false);
    }
  };

  const parseCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) return;
      
      // More flexible parsing - handle quotes and various separators
      const parseCSVLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };
      
      const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
      
      // Enhanced domain column detection
      const domainColumns = [
        'domain', 'website', 'url', 'site', 'company_domain', 'web', 'link',
        'domain_name', 'website_url', 'company_url', 'homepage', 'web_address'
      ];
      
      let domainColumnIndex = headers.findIndex(h => domainColumns.includes(h));
      
      // If no exact match, look for partial matches
      if (domainColumnIndex === -1) {
        domainColumnIndex = headers.findIndex(h => 
          h.includes('domain') || h.includes('website') || h.includes('url') || 
          h.includes('web') || h.includes('site') || h.includes('link')
        );
      }
      
      if (domainColumnIndex === -1) {
        alert(`CSV must contain a domain column. Found headers: ${headers.join(', ')}\n\nSupported column names: domain, website, url, site, web, link`);
        return;
      }
      
      const domains = lines.slice(1)
        .map(line => {
          const cells = parseCSVLine(line);
          return cells[domainColumnIndex]?.trim().replace(/['"]/g, '');
        })
        .filter(domain => domain && domain.length > 0)
        .map(domain => {
          // Clean up domain format
          let cleanDomain = domain.toLowerCase();
          cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
          cleanDomain = cleanDomain.replace(/^www\./, '');
          cleanDomain = cleanDomain.replace(/\/$/, '');
          cleanDomain = cleanDomain.split('/')[0]; // Take only the domain part
          return cleanDomain;
        })
        .filter(domain => domain.includes('.')) // Must be a valid domain
        .filter((domain, index, arr) => arr.indexOf(domain) === index); // Remove duplicates
      
      setCsvDomains(domains);
      console.log(`Parsed ${domains.length} unique domains from CSV using column: ${headers[domainColumnIndex]}`);
    };
    reader.readAsText(file);
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      alert("Please upload a CSV file");
      return;
    }
    
    setCsvFile(file);
    parseCsvFile(file);
  };

  const processBulkSearch = async () => {
    if (csvDomains.length === 0) {
      alert("Please upload and parse a CSV file first");
      return;
    }

    setIsSearching(true);
    setError(null);
    setBulkProgress(0);
    setAllResults([]);

    const results: Lead[] = [];
    let quotaExhausted = false;
    let processedCount = 0;

    for (let i = 0; i < csvDomains.length; i++) {
      const domain = csvDomains[i];
      try {
        console.log(`Processing domain ${i + 1}/${csvDomains.length}: ${domain}`);
        
        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: domain,
            searchType: "domain",
            apiSource: "website-contacts-scraper"
          }),
        });

        if (response.ok) {
          const result = await response.json();
          
          // Check if quota was exhausted
          if (result.quotaExhausted) {
            quotaExhausted = true;
            console.log(`API quota exhausted after processing ${processedCount} domains`);
            break;
          }
          
          results.push(...result.leads);
          processedCount++;
        } else if (response.status === 429) {
          // Rate limit exceeded
          quotaExhausted = true;
          console.log(`Rate limit exceeded after processing ${processedCount} domains`);
          break;
        } else {
          console.log(`HTTP ${response.status} error for domain: ${domain}`);
        }
        
        setBulkProgress(Math.round(((i + 1) / csvDomains.length) * 100));
        setAllResults([...results]);
        
        // Small delay to prevent API rate limiting
        await new Promise(resolve => setTimeout(resolve, 150));
        
      } catch (err) {
        console.error(`Error processing ${domain}:`, err);
      }
    }

    setIsSearching(false);
    
    if (quotaExhausted) {
      setError(`API quota exhausted after processing ${processedCount} of ${csvDomains.length} domains. ${results.length} leads collected.`);
    }
    
    console.log(`Bulk search completed: ${results.length} total leads from ${processedCount} domains`);
  };

  const downloadResults = (format: 'csv' | 'json') => {
    const results = allResults.length > 0 ? allResults : searchResults?.leads || [];
    
    if (results.length === 0) {
      alert("No results to download");
      return;
    }

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'csv') {
      const headers = ['Name', 'Email', 'Title', 'Company', 'Phone', 'LinkedIn', 'Location'];
      const csvContent = [
        headers.join(','),
        ...results.map(lead => [
          `"${lead.fullName || ''}"`,
          `"${lead.email || ''}"`,
          `"${lead.title || ''}"`,
          `"${lead.company || ''}"`,
          `"${lead.phone || ''}"`,
          `"${lead.linkedinUrl || ''}"`,
          `"${lead.location || ''}"`
        ].join(','))
      ].join('\n');
      
      content = csvContent;
      filename = `leadminer-results-${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(results, null, 2);
      filename = `leadminer-results-${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">RapidAPI Lead Miner</h1>
            <p className="text-gray-600">Professional Lead Generation Platform</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            API Settings
          </Button>
        </div>

        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search for Company Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">Single Domain</TabsTrigger>
                <TabsTrigger value="bulk">CSV Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="single" className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    type="text"
                    placeholder="Enter domain (e.g., apple.com, microsoft.com)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                  >
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="bulk" className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Upload CSV file with domains. Supports columns: domain, website, url, site, web, link, homepage
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="hidden"
                    />
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="mt-2"
                    >
                      Choose CSV File
                    </Button>
                  </div>
                </div>
                
                {csvFile && csvDomains.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                      <span className="text-sm text-green-700">
                        📁 {csvFile.name} - {csvDomains.length} domains detected
                      </span>
                    </div>
                    
                    {isSearching && bulkProgress > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Processing domains...</span>
                          <span>{bulkProgress}%</span>
                        </div>
                        <Progress value={bulkProgress} className="w-full" />
                        {allResults.length > 0 && (
                          <div className="text-xs text-gray-600 text-center">
                            {allResults.length} leads collected so far
                          </div>
                        )}
                      </div>
                    )}
                    
                    <Button
                      onClick={processBulkSearch}
                      disabled={isSearching}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isSearching ? `Processing... (${bulkProgress}%)` : `Process ${csvDomains.length} Domains`}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                Error: {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {(searchResults || allResults.length > 0) && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Search Results</CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={() => downloadResults('csv')}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    CSV
                  </Button>
                  <Button
                    onClick={() => downloadResults('json')}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    JSON
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {allResults.length > 0 ? allResults.length : searchResults?.totalResults || 0} Total Leads
                  </Badge>
                  <Badge variant="default">
                    {allResults.length > 0 ? allResults.filter(l => l.emailStatus === 'verified').length : searchResults?.verifiedEmails || 0} Verified Emails
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const currentResults = allResults.length > 0 ? allResults : searchResults?.leads || [];
                const totalResults = currentResults.length;
                
                if (totalResults === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      No leads found for this domain
                    </div>
                  );
                }
                
                const totalPages = Math.ceil(totalResults / resultsPerPage);
                const startIndex = (currentPage - 1) * resultsPerPage;
                const endIndex = startIndex + resultsPerPage;
                const paginatedResults = currentResults.slice(startIndex, endIndex);
                
                return (
                  <div className="space-y-4">
                    {paginatedResults.map((lead: Lead, index: number) => (
                      <div key={lead.id || index} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{lead.fullName}</h3>
                            {lead.title && <p className="text-gray-600">{lead.title}</p>}
                            {lead.company && <p className="text-sm text-gray-500">{lead.company}</p>}
                          </div>
                          <div className="text-right">
                            {lead.email && (
                              <div className="mb-2">
                                <Badge variant={lead.emailStatus === 'verified' ? 'default' : 'secondary'}>
                                  {lead.email}
                                </Badge>
                              </div>
                            )}
                            {lead.phone && (
                              <p className="text-sm text-gray-600">{lead.phone}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600">
                          Page {currentPage} of {totalPages} ({totalResults} total results)
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}
        
        {/* API Settings Modal */}
        <ApiSettings 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
      </div>
    </div>
  );
}