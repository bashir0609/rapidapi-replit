export interface SearchFilters {
  jobTitle?: string;
  location?: string;
  companySize?: string;
  industry?: string;
  department?: string;
  seniority?: string;
}

export interface SearchRequest {
  query: string;
  searchType: 'company' | 'domain' | 'url';
  filters?: SearchFilters;
}

export interface SearchResult {
  searchId: number;
  totalResults: number;
  verifiedEmails: number;
  apiCallsUsed: number;
  searchTime: number;
  leads: Lead[];
}

export interface Lead {
  id: number;
  firstName?: string;
  lastName?: string;
  fullName: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  company?: string;
  companyDomain?: string;
  location?: string;
  department?: string;
  seniority?: string;
  emailStatus?: 'verified' | 'probable' | 'unverified';
  source: string;
  rawData?: any;
  searchId?: number;
  createdAt?: Date;
}

export interface ApiConfiguration {
  id: number;
  name: string;
  apiKey: string;
  endpoint: string;
  isActive: boolean;
  rateLimitPerMonth: number;
  usedThisMonth: number;
  createdAt?: Date;
}

export interface Analytics {
  totalLeads: number;
  verifiedEmails: number;
  verificationRate: number;
  totalApiCalls: number;
  remainingCalls: number;
  avgSearchTime: number;
  recentSearches: any[];
}

export interface ExportOptions {
  searchId: number;
  format: 'csv' | 'json';
}
