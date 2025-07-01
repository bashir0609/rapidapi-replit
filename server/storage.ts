import { 
  apiConfigurations, 
  leads, 
  searches, 
  exportHistory,
  type ApiConfiguration,
  type InsertApiConfiguration,
  type Lead,
  type InsertLead,
  type Search,
  type InsertSearch,
  type ExportHistory,
  type InsertExportHistory
} from "@shared/schema";

export interface IStorage {
  // API Configuration
  getApiConfigurations(): Promise<ApiConfiguration[]>;
  getApiConfiguration(id: number): Promise<ApiConfiguration | undefined>;
  createApiConfiguration(config: InsertApiConfiguration): Promise<ApiConfiguration>;
  updateApiConfiguration(id: number, config: Partial<InsertApiConfiguration>): Promise<ApiConfiguration | undefined>;
  deleteApiConfiguration(id: number): Promise<boolean>;
  updateApiUsage(id: number, increment: number): Promise<void>;

  // Leads
  getLeads(searchId?: number): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  createLeads(leads: InsertLead[]): Promise<Lead[]>;
  getLeadsBySearch(searchId: number): Promise<Lead[]>;

  // Searches
  getSearches(): Promise<Search[]>;
  getSearch(id: number): Promise<Search | undefined>;
  createSearch(search: InsertSearch): Promise<Search>;
  updateSearch(id: number, search: Partial<InsertSearch>): Promise<Search | undefined>;
  getRecentSearches(limit?: number): Promise<Search[]>;

  // Export History
  getExportHistory(): Promise<ExportHistory[]>;
  createExportRecord(exportRecord: InsertExportHistory): Promise<ExportHistory>;
}

export class MemStorage implements IStorage {
  private apiConfigs: Map<number, ApiConfiguration>;
  private leadsMap: Map<number, Lead>;
  private searchesMap: Map<number, Search>;
  private exportsMap: Map<number, ExportHistory>;
  private currentApiConfigId: number;
  private currentLeadId: number;
  private currentSearchId: number;
  private currentExportId: number;

  constructor() {
    this.apiConfigs = new Map();
    this.leadsMap = new Map();
    this.searchesMap = new Map();
    this.exportsMap = new Map();
    this.currentApiConfigId = 1;
    this.currentLeadId = 1;
    this.currentSearchId = 1;
    this.currentExportId = 1;

    // Initialize with default API configurations
    this.initializeDefaultConfigs();
  }

  private initializeDefaultConfigs() {
    const defaultConfigs = [
      {
        name: "Apollo Scraper",
        apiKey: process.env.RAPIDAPI_KEY || "your_rapidapi_key_here",
        endpoint: "https://apollo-scraper-with-emails-no-login-upto-50k-leads-url.p.rapidapi.com",
        isActive: !!process.env.RAPIDAPI_KEY,
        rateLimitPerMonth: 5000,
        usedThisMonth: 0,
        createdAt: new Date(),
      },
      {
        name: "Apollo.io API",
        apiKey: process.env.RAPIDAPI_KEY || "your_rapidapi_key_here",
        endpoint: "https://apollo-io-no-cookies-required.p.rapidapi.com",
        isActive: !!process.env.RAPIDAPI_KEY,
        rateLimitPerMonth: 3000,
        usedThisMonth: 0,
        createdAt: new Date(),
      },
      {
        name: "Website Contacts Scraper",
        apiKey: process.env.RAPIDAPI_KEY || "your_rapidapi_key_here",
        endpoint: "https://website-contacts-scraper.p.rapidapi.com",
        isActive: !!process.env.RAPIDAPI_KEY,
        rateLimitPerMonth: 2000,
        usedThisMonth: 0,
        createdAt: new Date(),
      },
    ];

    defaultConfigs.forEach(config => {
      const id = this.currentApiConfigId++;
      this.apiConfigs.set(id, { ...config, id });
    });
  }

  // API Configuration methods
  async getApiConfigurations(): Promise<ApiConfiguration[]> {
    return Array.from(this.apiConfigs.values());
  }

  async getApiConfiguration(id: number): Promise<ApiConfiguration | undefined> {
    return this.apiConfigs.get(id);
  }

  async createApiConfiguration(config: InsertApiConfiguration): Promise<ApiConfiguration> {
    const id = this.currentApiConfigId++;
    const newConfig: ApiConfiguration = {
      id,
      name: config.name,
      apiKey: config.apiKey,
      endpoint: config.endpoint,
      isActive: config.isActive !== undefined ? config.isActive : true,
      rateLimitPerMonth: config.rateLimitPerMonth !== undefined ? config.rateLimitPerMonth : 1000,
      usedThisMonth: config.usedThisMonth !== undefined ? config.usedThisMonth : 0,
      createdAt: new Date(),
    };
    this.apiConfigs.set(id, newConfig);
    return newConfig;
  }

  async updateApiConfiguration(id: number, config: Partial<InsertApiConfiguration>): Promise<ApiConfiguration | undefined> {
    const existing = this.apiConfigs.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...config };
    this.apiConfigs.set(id, updated);
    return updated;
  }

  async deleteApiConfiguration(id: number): Promise<boolean> {
    const exists = this.apiConfigs.has(id);
    if (exists) {
      this.apiConfigs.delete(id);
      return true;
    }
    return false;
  }

  async updateApiUsage(id: number, increment: number): Promise<void> {
    const config = this.apiConfigs.get(id);
    if (config) {
      config.usedThisMonth = (config.usedThisMonth || 0) + increment;
    }
  }

  // Leads methods
  async getLeads(searchId?: number): Promise<Lead[]> {
    const allLeads = Array.from(this.leadsMap.values());
    if (searchId) {
      return allLeads.filter(lead => lead.searchId === searchId);
    }
    return allLeads;
  }

  async getLead(id: number): Promise<Lead | undefined> {
    return this.leadsMap.get(id);
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const id = this.currentLeadId++;
    const newLead: Lead = {
      id,
      firstName: lead.firstName || null,
      lastName: lead.lastName || null,
      fullName: lead.fullName,
      title: lead.title || null,
      email: lead.email || null,
      phone: lead.phone || null,
      linkedinUrl: lead.linkedinUrl || null,
      company: lead.company || null,
      companyDomain: lead.companyDomain || null,
      location: lead.location || null,
      department: lead.department || null,
      seniority: lead.seniority || null,
      emailStatus: lead.emailStatus || null,
      source: lead.source,
      rawData: lead.rawData || null,
      searchId: lead.searchId || null,
      createdAt: new Date(),
    };
    this.leadsMap.set(id, newLead);
    return newLead;
  }

  async createLeads(leads: InsertLead[]): Promise<Lead[]> {
    const newLeads: Lead[] = [];
    for (const lead of leads) {
      const newLead = await this.createLead(lead);
      newLeads.push(newLead);
    }
    return newLeads;
  }

  async getLeadsBySearch(searchId: number): Promise<Lead[]> {
    return Array.from(this.leadsMap.values()).filter(lead => lead.searchId === searchId);
  }

  // Searches methods
  async getSearches(): Promise<Search[]> {
    return Array.from(this.searchesMap.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getSearch(id: number): Promise<Search | undefined> {
    return this.searchesMap.get(id);
  }

  async createSearch(search: InsertSearch): Promise<Search> {
    const id = this.currentSearchId++;
    const newSearch: Search = {
      id,
      query: search.query,
      searchType: search.searchType,
      status: search.status || null,
      filters: search.filters || null,
      totalResults: search.totalResults || null,
      verifiedEmails: search.verifiedEmails || null,
      apiCallsUsed: search.apiCallsUsed || null,
      searchTime: search.searchTime || null,
      createdAt: new Date(),
    };
    this.searchesMap.set(id, newSearch);
    return newSearch;
  }

  async updateSearch(id: number, search: Partial<InsertSearch>): Promise<Search | undefined> {
    const existing = this.searchesMap.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...search };
    this.searchesMap.set(id, updated);
    return updated;
  }

  async getRecentSearches(limit: number = 10): Promise<Search[]> {
    const searches = await this.getSearches();
    return searches.slice(0, limit);
  }

  // Export History methods
  async getExportHistory(): Promise<ExportHistory[]> {
    return Array.from(this.exportsMap.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createExportRecord(exportRecord: InsertExportHistory): Promise<ExportHistory> {
    const id = this.currentExportId++;
    const newExport: ExportHistory = {
      id,
      searchId: exportRecord.searchId !== undefined ? exportRecord.searchId : null,
      format: exportRecord.format,
      fileName: exportRecord.fileName,
      recordCount: exportRecord.recordCount || null,
      createdAt: new Date(),
    };
    this.exportsMap.set(id, newExport);
    return newExport;
  }
}

export const storage = new MemStorage();
