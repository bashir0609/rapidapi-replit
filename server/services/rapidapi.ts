import axios from 'axios';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "3c16708260msh0fea8d154a142cbp10c69bjsn25c5663a295d";

export interface RapidAPIResponse {
  success: boolean;
  data?: any;
  error?: string;
  usage?: number;
}

export class RapidAPIService {
  private baseHeaders = {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': '',
  };

  async searchApolloScraper(url: string): Promise<RapidAPIResponse> {
    try {
      const response = await axios.post(
        'https://apollo-scraper-with-emails-no-login-upto-50k-leads-url.p.rapidapi.com/api/scrape',
        { url },
        {
          headers: {
            ...this.baseHeaders,
            'X-RapidAPI-Host': 'apollo-scraper-with-emails-no-login-upto-50k-leads-url.p.rapidapi.com',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      return {
        success: true,
        data: response.data,
        usage: 1,
      };
    } catch (error: any) {
      console.error('Apollo Scraper API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Apollo Scraper API failed',
        usage: 1,
      };
    }
  }

  async searchApolloIO(query: string, filters: any = {}): Promise<RapidAPIResponse> {
    try {
      const response = await axios.post(
        'https://apollo-io-no-cookies-required.p.rapidapi.com/search_people',
        {
          q_organization_domains: query,
          page: 1,
          per_page: 100,
          ...filters,
        },
        {
          headers: {
            ...this.baseHeaders,
            'X-RapidAPI-Host': 'apollo-io-no-cookies-required.p.rapidapi.com',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      return {
        success: true,
        data: response.data,
        usage: response.data?.people?.length || 0,
      };
    } catch (error: any) {
      console.error('Apollo.io API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Apollo.io API failed',
        usage: 1,
      };
    }
  }

  async searchContactScraper(query: string, searchType: 'domain' | 'company' | 'url' = 'domain'): Promise<RapidAPIResponse> {
    try {
      const headers = {
        ...this.baseHeaders,
        'X-RapidAPI-Host': 'website-contacts-scraper.p.rapidapi.com'
      };

      // Clean the query to extract domain if it's a URL
      const cleanQuery = query.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];

      const response = await axios.get(
        'https://website-contacts-scraper.p.rapidapi.com/scrape-contacts',
        {
          headers,
          params: {
            query: cleanQuery,
            match_email_domain: 'false',
            external_matching: 'false'
          },
          timeout: 30000,
        }
      );

      return {
        success: true,
        data: response.data,
        usage: 1,
      };
    } catch (error: any) {
      console.error('Contact Scraper API Error:', error.response?.data || error.message);
      
      // Check for quota/rate limit errors
      if (error.response?.status === 429 || error.response?.status === 403) {
        return {
          success: false,
          error: 'quota_exceeded',
          usage: 0,
        };
      }
      
      // Check error message for quota keywords
      const errorMessage = error.response?.data?.message || error.message || '';
      if (errorMessage.toLowerCase().includes('quota') || 
          errorMessage.toLowerCase().includes('limit') ||
          errorMessage.toLowerCase().includes('exceeded')) {
        return {
          success: false,
          error: 'quota_exceeded',
          usage: 0,
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Contact Scraper API failed',
        usage: 1,
      };
    }
  }

  normalizeLeadData(data: any, source: string): any {
    switch (source) {
      case 'apollo-scraper':
        return {
          firstName: data.first_name,
          lastName: data.last_name,
          fullName: data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          title: data.title,
          email: data.email,
          phone: data.phone,
          linkedinUrl: data.linkedin_url,
          company: data.organization?.name,
          companyDomain: data.organization?.primary_domain,
          location: `${data.city || ''}, ${data.state || ''}`.replace(/^,\s*|,\s*$/g, ''),
          department: data.departments?.[0],
          seniority: data.seniority,
          emailStatus: data.email_status,
          source: 'apollo-scraper',
          rawData: data,
        };

      case 'apollo-api':
        return {
          firstName: data.first_name,
          lastName: data.last_name,
          fullName: data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          title: data.title,
          email: data.email,
          phone: data.phone,
          linkedinUrl: data.linkedin_url,
          company: data.organization?.name,
          companyDomain: data.organization?.primary_domain,
          location: `${data.city || ''}, ${data.state || ''}`.replace(/^,\s*|,\s*$/g, ''),
          department: data.departments?.[0],
          seniority: data.seniority,
          emailStatus: data.email_status,
          source: 'apollo-api',
          rawData: data,
        };

      case 'contact-scraper':
      case 'website-contacts-scraper':
        // Handle Website Contacts Scraper format - extract name from email
        const emailValue = data.value || data.email;
        const extractedName = emailValue ? this.extractNameFromEmailHelper(emailValue) : '';
        
        return {
          firstName: extractedName.split(' ')[0] || '',
          lastName: extractedName.split(' ').slice(1).join(' ') || '',
          fullName: extractedName || data.name || data.full_name,
          title: data.title || data.position,
          email: emailValue,
          phone: data.phone,
          linkedinUrl: data.linkedin,
          company: data.company || data.domain,
          companyDomain: data.domain,
          location: data.location,
          department: data.department,
          seniority: data.seniority,
          emailStatus: emailValue ? 'verified' : undefined,
          source: 'website-contacts-scraper',
          rawData: data,
        };

      default:
        return data;
    }
  }

  private extractNameFromEmailHelper(email: string): string {
    if (!email) return '';
    const localPart = email.split('@')[0];
    // Convert common patterns like firstname.lastname or first.last to readable names
    return localPart
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

export const rapidAPIService = new RapidAPIService();
