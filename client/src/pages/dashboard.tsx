import { useState } from "react";
import Sidebar from "@/components/sidebar";
import SimpleSearch from "@/components/simple-search";
import ResultsTable from "@/components/results-table";
import AnalyticsCards from "@/components/analytics-cards";
import { SearchResult } from "@/lib/types";

export default function Dashboard() {
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchComplete = (results: SearchResult) => {
    console.log("=== DASHBOARD RECEIVED SEARCH RESULTS ===");
    console.log("Results object:", results);
    console.log("Total results:", results?.totalResults);
    console.log("Leads array:", results?.leads);
    console.log("Leads count:", results?.leads?.length);
    
    setSearchResults(results);
    setIsSearching(false);
    
    console.log("=== DASHBOARD STATE UPDATED ===");
    console.log("Current searchResults state:", results);
  };

  const handleSearchStart = () => {
    setIsSearching(true);
    setSearchResults(null);
  };

  return (
    <>
      <title>RapidAPI Lead Miner - Professional Lead Generation Platform</title>
      <meta name="description" content="Professional lead generation platform integrating multiple RapidAPI services for company contact scraping and data aggregation. Search companies, extract contacts, and export verified leads." />
      
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-gray-900">Lead Generation Dashboard</h2>
                <span className="bg-blue-100 text-primary text-sm font-medium px-3 py-1 rounded-full">
                  3 APIs Connected
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <i className="fas fa-bolt text-warning"></i>
                  <span>API Credits Available</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-white text-sm"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Dashboard User</span>
                </div>
              </div>
            </div>
          </header>

          {/* Simple Search - Testing */}
          <SimpleSearch 
            onSearchStart={handleSearchStart}
            onSearchComplete={handleSearchComplete}
            isSearching={isSearching}
          />

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            <div className="px-6 py-6">
              {searchResults && searchResults.leads && searchResults.leads.length > 0 ? (
                <ResultsTable 
                  searchResults={searchResults}
                  isSearching={isSearching}
                />
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
                    <span className="bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1 rounded-full">
                      0 leads found
                    </span>
                  </div>
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-4xl mb-4">
                      <i className="fas fa-search"></i>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No search results yet</h4>
                    <p className="text-gray-500 mb-6">
                      Start by entering a company domain above and clicking Search to find verified leads
                    </p>
                    <div className="text-sm text-gray-400">
                      Showing 1 to 0 of 0 results
                    </div>
                  </div>
                  
                  {/* Pagination placeholder */}
                  <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">0</span> to <span className="font-medium">0</span> of{' '}
                      <span className="font-medium">0</span> results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        disabled
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-400 rounded border cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        disabled
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-400 rounded border cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <AnalyticsCards searchResults={searchResults} />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
