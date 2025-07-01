import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchResult } from "@/lib/types";

interface SimpleSearchProps {
  onSearchComplete: (results: SearchResult) => void;
  onSearchStart: () => void;
  isSearching: boolean;
}

export default function SimpleSearch({ onSearchComplete, onSearchStart, isSearching }: SimpleSearchProps) {
  const [query, setQuery] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) {
      alert("Please enter a domain name");
      return;
    }

    console.log("Starting search for:", query);
    onSearchStart();

    try {
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
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log("Search result:", result);
      
      onSearchComplete(result);
      
    } catch (error) {
      console.error("Search failed:", error);
      alert("Search failed: " + String(error));
    }
  };

  return (
    <div className="bg-white p-6 border-b">
      <div className="flex gap-4 max-w-2xl">
        <Input
          type="text"
          placeholder="Enter domain (e.g., apple.com)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button 
          onClick={handleSearch}
          disabled={isSearching}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </div>
    </div>
  );
}