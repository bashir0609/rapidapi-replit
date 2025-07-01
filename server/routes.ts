import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { rapidAPIService } from "./services/rapidapi";
import { insertSearchSchema, insertLeadSchema, insertApiConfigurationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get API configurations
  app.get("/api/configurations", async (req, res) => {
    try {
      const configs = await storage.getApiConfigurations();
      res.json(configs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch API configurations" });
    }
  });

  // Create new API configuration
  app.post("/api/configurations", async (req, res) => {
    try {
      const configData = insertApiConfigurationSchema.parse(req.body);
      const newConfig = await storage.createApiConfiguration(configData);
      res.status(201).json(newConfig);
    } catch (error) {
      console.error("Create configuration error:", error);
      res.status(500).json({ message: "Failed to create configuration" });
    }
  });

  // Update API configuration
  app.patch("/api/configurations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateApiConfiguration(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update configuration" });
    }
  });

  // Also support PUT for API updates (frontend uses PUT)
  app.put("/api/configurations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateApiConfiguration(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update configuration" });
    }
  });

  // Delete API configuration
  app.delete("/api/configurations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteApiConfiguration(id);
      if (success) {
        res.json({ message: "Configuration deleted successfully" });
      } else {
        res.status(404).json({ message: "Configuration not found" });
      }
    } catch (error) {
      console.error("Delete configuration error:", error);
      res.status(500).json({ message: "Failed to delete configuration" });
    }
  });

  // Search leads
  app.post("/api/search", async (req, res) => {
    try {
      const { apiSource, ...searchData } = req.body;
      const parsedSearchData = insertSearchSchema.parse(searchData);
      const startTime = Date.now();
      
      // Create search record
      const search = await storage.createSearch({
        ...parsedSearchData,
        status: "pending",
      });

      // Determine search strategy based on query type and API source
      const { query, searchType = "domain" } = parsedSearchData;
      let totalResults = 0;
      let verifiedEmails = 0;
      let apiCallsUsed = 0;
      const allLeads: any[] = [];

      // Smart API routing based on functionality and user selection
      const isApolloUrl = query.includes("apollo.io") || query.includes("/person/");
      const isDomainSearch = searchType === "domain" || (!searchType && query.includes("."));
      const isCompanySearch = searchType === "company";
      const isUrlSearch = searchType === "url" || query.startsWith("http");

      // Only use Website Contacts Scraper (has valid API key)

      // Website Contacts Scraper - Best for domain-based email extraction
      if (apiSource === "contact-scraper" || apiSource === "Website Contacts Scraper" || apiSource === "website-contacts-scraper" || (apiSource === "all" && (isDomainSearch || isCompanySearch || isUrlSearch))) {
        const contactResult = await rapidAPIService.searchContactScraper(
          query, 
          searchType as 'domain' | 'company' | 'url'
        );
        if (contactResult.success && contactResult.data) {
          console.log('Contact API Response:', JSON.stringify(contactResult.data, null, 2));
          
          // Handle different response structures
          let emailsData = [];
          let domain = query;
          
          if (contactResult.data.data && contactResult.data.data[0]) {
            // Original structure
            const domainData = contactResult.data.data[0];
            emailsData = domainData.emails || [];
            domain = domainData.domain || query;
          } else if (contactResult.data.emails) {
            // Direct emails array
            emailsData = contactResult.data.emails;
          } else if (Array.isArray(contactResult.data)) {
            // Array of email objects
            emailsData = contactResult.data;
          }
          
          if (emailsData.length > 0) {
            console.log(`Processing ${emailsData.length} emails for ${domain}`);
            const leads = emailsData.map((emailData: any) => 
              rapidAPIService.normalizeLeadData({
                ...emailData,
                domain: domain
              }, 'website-contacts-scraper')
            );
            console.log('Normalized leads:', leads.length);
            allLeads.push(...leads);
            apiCallsUsed += contactResult.usage || 1;
            
            const configs = await storage.getApiConfigurations();
            const contactConfig = configs.find(c => c.name === "Website Contacts Scraper" || c.name === "Contact Scraper");
            if (contactConfig) {
              await storage.updateApiUsage(contactConfig.id, contactResult.usage || 1);
            }
          } else {
            console.log('No emails found in API response');
          }
        } else if (contactResult.error === 'quota_exceeded') {
          console.log('API quota exhausted for Website Contacts Scraper');
          
          // If we have any leads processed, return them with quota warning
          if (allLeads.length > 0) {
            const processedLeads = allLeads.map(lead => ({
              ...lead,
              searchId: search.id,
            }));

            const savedLeads = await storage.createLeads(processedLeads);
            const searchTime = Date.now() - startTime;
            
            await storage.updateSearch(search.id, {
              totalResults: savedLeads.length,
              verifiedEmails: savedLeads.filter(lead => lead.emailStatus === 'verified').length,
              apiCallsUsed,
              searchTime,
              status: "completed",
            });

            return res.status(200).json({
              searchId: search.id,
              totalResults: savedLeads.length,
              verifiedEmails: savedLeads.filter(lead => lead.emailStatus === 'verified').length,
              apiCallsUsed,
              searchTime,
              leads: savedLeads,
              quotaExhausted: true,
              message: `API quota exhausted. Processed results returned.`
            });
          } else {
            return res.status(200).json({
              searchId: search.id,
              totalResults: 0,
              verifiedEmails: 0,
              apiCallsUsed: 0,
              searchTime: Date.now() - startTime,
              leads: [],
              error: 'API quota exhausted. Please upgrade your RapidAPI plan or provide a different API key.',
              quotaExhausted: true
            });
          }
        }
      }

      // Process and save leads
      const processedLeads = allLeads.map(lead => ({
        ...lead,
        searchId: search.id,
      }));

      const savedLeads = await storage.createLeads(processedLeads);
      
      totalResults = savedLeads.length;
      verifiedEmails = savedLeads.filter(lead => lead.emailStatus === 'verified').length;

      // Update search with results
      const searchTime = Date.now() - startTime;
      await storage.updateSearch(search.id, {
        totalResults,
        verifiedEmails,
        apiCallsUsed,
        searchTime,
        status: "completed",
      });

      res.json({
        searchId: search.id,
        totalResults,
        verifiedEmails,
        apiCallsUsed,
        searchTime,
        leads: savedLeads,
      });

    } catch (error) {
      console.error("Search error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid search parameters", errors: error.errors });
      }
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Get search results
  app.get("/api/search/:id/results", async (req, res) => {
    try {
      const searchId = parseInt(req.params.id);
      const leads = await storage.getLeadsBySearch(searchId);
      const search = await storage.getSearch(searchId);
      
      res.json({
        search,
        leads,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });

  // Get all searches (history)
  app.get("/api/searches", async (req, res) => {
    try {
      const searches = await storage.getRecentSearches();
      res.json(searches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch search history" });
    }
  });

  // Get leads
  app.get("/api/leads", async (req, res) => {
    try {
      const searchId = req.query.searchId ? parseInt(req.query.searchId as string) : undefined;
      const leads = await storage.getLeads(searchId);
      res.json(leads);
    } catch (error) {
      console.error("Get leads error:", error);
      res.status(500).json({ message: "Failed to get leads" });
    }
  });

  // Export leads
  app.post("/api/export", async (req, res) => {
    try {
      const { searchId, format } = req.body;
      
      if (!searchId || !format || !['csv', 'json'].includes(format)) {
        return res.status(400).json({ message: "Invalid export parameters" });
      }

      const leads = await storage.getLeadsBySearch(searchId);
      const search = await storage.getSearch(searchId);
      
      if (!search) {
        return res.status(404).json({ message: "Search not found" });
      }

      const fileName = `leads_${search.query}_${Date.now()}.${format}`;
      
      // Save export record
      await storage.createExportRecord({
        searchId,
        format,
        fileName,
        recordCount: leads.length,
      });

      if (format === 'csv') {
        const csvHeaders = [
          'Name', 'Title', 'Email', 'Phone', 'Company', 'Location', 'LinkedIn', 'Source', 'Email Status'
        ];
        
        const csvRows = leads.map(lead => [
          lead.fullName || '',
          lead.title || '',
          lead.email || '',
          lead.phone || '',
          lead.company || '',
          lead.location || '',
          lead.linkedinUrl || '',
          lead.source || '',
          lead.emailStatus || '',
        ]);

        const csvContent = [csvHeaders, ...csvRows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(csvContent);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.json({
          search: {
            query: search.query,
            totalResults: search.totalResults,
            exportedAt: new Date().toISOString(),
          },
          leads: leads.map(lead => ({
            name: lead.fullName,
            title: lead.title,
            email: lead.email,
            phone: lead.phone,
            company: lead.company,
            location: lead.location,
            linkedin: lead.linkedinUrl,
            source: lead.source,
            emailStatus: lead.emailStatus,
          })),
        });
      }

    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Export failed" });
    }
  });

  // Get usage analytics
  app.get("/api/analytics", async (req, res) => {
    try {
      const configs = await storage.getApiConfigurations();
      const recentSearches = await storage.getRecentSearches(10);
      const allLeads = await storage.getLeads();
      
      const totalLeads = allLeads.length;
      const verifiedEmails = allLeads.filter(lead => lead.emailStatus === 'verified').length;
      const totalApiCalls = configs.reduce((sum, config) => sum + (config.usedThisMonth || 0), 0);
      const remainingCalls = configs.reduce((sum, config) => sum + (config.rateLimitPerMonth || 0) - (config.usedThisMonth || 0), 0);
      
      const avgSearchTime = recentSearches.length > 0 
        ? recentSearches.reduce((sum, search) => sum + (search.searchTime || 0), 0) / recentSearches.length
        : 0;

      res.json({
        totalLeads,
        verifiedEmails,
        verificationRate: totalLeads > 0 ? (verifiedEmails / totalLeads) * 100 : 0,
        totalApiCalls,
        remainingCalls,
        avgSearchTime: Math.round(avgSearchTime),
        recentSearches: recentSearches.slice(0, 5),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // API Settings route
  app.post("/api/settings/rapidapi-key", async (req, res) => {
    try {
      const { apiKey } = req.body;
      
      if (!apiKey || typeof apiKey !== 'string') {
        return res.status(400).json({ error: "Valid API key required" });
      }
      
      // Store in memory (in production, you'd store this securely)
      process.env.RAPIDAPI_KEY = apiKey;
      
      res.json({ success: true, message: "API key updated successfully" });
    } catch (error) {
      console.error("Error updating API key:", error);
      res.status(500).json({ error: "Failed to update API key" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
