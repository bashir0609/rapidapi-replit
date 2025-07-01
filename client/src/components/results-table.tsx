import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchResult, Lead, ExportOptions } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ResultsTableProps {
  searchResults: SearchResult;
  isSearching: boolean;
}

export default function ResultsTable({ searchResults, isSearching }: ResultsTableProps) {
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 25;
  
  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: async (options: ExportOptions) => {
      const response = await apiRequest("POST", "/api/export", options);
      return response.blob();
    },
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_export_${Date.now()}.${variables.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: `${variables.format.toUpperCase()} file downloaded successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "An error occurred during export",
        variant: "destructive",
      });
    },
  });

  const handleExport = (format: 'csv' | 'json') => {
    exportMutation.mutate({
      searchId: searchResults.searchId,
      format,
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(new Set(searchResults.leads.map(lead => lead.id)));
    } else {
      setSelectedLeads(new Set());
    }
  };

  const handleSelectLead = (leadId: number, checked: boolean) => {
    const newSelected = new Set(selectedLeads);
    if (checked) {
      newSelected.add(leadId);
    } else {
      newSelected.delete(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const getSourceBadgeClass = (source: string) => {
    switch (source) {
      case 'apollo-scraper':
        return 'badge-apollo-scraper';
      case 'apollo-api':
        return 'badge-apollo-api';
      case 'contact-scraper':
        return 'badge-contact-scraper';
      default:
        return 'bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full';
    }
  };

  const getEmailStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'verified':
        return 'badge-verified';
      case 'probable':
        return 'badge-probable';
      default:
        return 'badge-unverified';
    }
  };

  const paginatedLeads = searchResults.leads.slice(
    (currentPage - 1) * leadsPerPage,
    currentPage * leadsPerPage
  );

  const totalPages = Math.ceil(searchResults.leads.length / leadsPerPage);

  return (
    <>
      {/* Results Header with Export Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
          <span className="bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1 rounded-full">
            {searchResults.totalResults} leads found
          </span>
          
          {isSearching && (
            <div className="flex items-center space-x-2 text-sm text-primary">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <span>Processing APIs...</span>
            </div>
          )}
        </div>

        {/* Export Controls */}
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={exportMutation.isPending}
            className="flex items-center space-x-2"
          >
            <i className="fas fa-file-csv text-green-600"></i>
            <span>Export CSV</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            disabled={exportMutation.isPending}
            className="flex items-center space-x-2"
          >
            <i className="fas fa-file-code text-blue-600"></i>
            <span>Export JSON</span>
          </Button>
          <Button className="flex items-center space-x-2">
            <i className="fas fa-bookmark"></i>
            <span>Save Results</span>
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <Checkbox
                    checked={selectedLeads.size === searchResults.leads.length}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700">
                  Name <i className="fas fa-sort ml-1"></i>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700">
                  Title <i className="fas fa-sort ml-1"></i>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700">
                  Company <i className="fas fa-sort ml-1"></i>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Checkbox
                      checked={selectedLeads.has(lead.id)}
                      onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <i className="fas fa-user text-gray-500 text-sm"></i>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{lead.fullName}</div>
                        {lead.location && (
                          <div className="text-sm text-gray-500">{lead.location}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{lead.title || 'N/A'}</div>
                    {lead.department && (
                      <div className="text-sm text-gray-500">{lead.department}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{lead.company || 'N/A'}</div>
                    {lead.companyDomain && (
                      <div className="text-sm text-gray-500">{lead.companyDomain}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {lead.email ? (
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-envelope text-gray-400 text-xs"></i>
                          <span className="text-sm text-gray-900 font-mono">{lead.email}</span>
                          {lead.emailStatus && (
                            <span className={getEmailStatusBadgeClass(lead.emailStatus)}>
                              {lead.emailStatus}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-envelope text-gray-400 text-xs"></i>
                          <span className="text-sm text-gray-500">No email found</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-phone text-gray-400 text-xs"></i>
                          <span className="text-sm text-gray-600 font-mono">{lead.phone}</span>
                        </div>
                      )}
                      {lead.linkedinUrl && (
                        <div className="flex items-center space-x-2">
                          <i className="fab fa-linkedin text-gray-400 text-xs"></i>
                          <span className="text-sm text-gray-600">LinkedIn Profile</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={getSourceBadgeClass(lead.source)}>
                      {lead.source === 'apollo-scraper' ? 'Apollo Scraper' :
                       lead.source === 'apollo-api' ? 'Apollo API' :
                       lead.source === 'contact-scraper' ? 'Contact Scraper' :
                       lead.source}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="text-primary hover:text-blue-700" title="View Profile">
                        <i className="fas fa-eye text-sm"></i>
                      </button>
                      <button className="text-gray-400 hover:text-gray-600" title="Add to CRM">
                        <i className="fas fa-plus text-sm"></i>
                      </button>
                      <button className="text-gray-400 hover:text-gray-600" title="Export Contact">
                        <i className="fas fa-download text-sm"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-700">
            Showing <span className="font-medium">{(currentPage - 1) * leadsPerPage + 1}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * leadsPerPage, searchResults.totalResults)}</span> of{' '}
            <span className="font-medium">{searchResults.totalResults}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
            {totalPages > 5 && <span className="text-gray-500">...</span>}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
