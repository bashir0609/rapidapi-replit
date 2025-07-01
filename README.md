# RapidAPI Lead Miner - Professional Lead Generation Platform

A comprehensive lead generation platform that efficiently scrapes and aggregates company contact information using RapidAPI services with intelligent quota management and bulk processing capabilities.

## Features

- **Multi-Source API Integration**: Connects to Apollo.io, Website Contacts Scraper, and other RapidAPI services
- **Bulk CSV Processing**: Upload CSV files with automatic domain detection and bulk lead generation
- **Smart Quota Management**: Gracefully handles API limits and preserves collected results
- **User-Configurable API Keys**: Allows users to input their own RapidAPI credentials
- **Real-time Progress Tracking**: Shows processing status during bulk operations
- **Advanced Export Options**: Export results in CSV or JSON formats
- **Pagination Controls**: Navigate through large result sets efficiently
- **Email Verification**: Displays verification status for collected email addresses

## Technology Stack

- **Frontend**: React 18 with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **External APIs**: RapidAPI platform integrations
- **Build Tool**: Vite for development and production builds

## Quick Start

### Prerequisites

- Node.js 18+ installed
- RapidAPI account with access to contact scraping services
- PostgreSQL database (for production) or use in-memory storage (for development)

### Environment Variables

Create a `.env` file in the root directory:

```bash
RAPIDAPI_KEY=your_rapidapi_key_here
NODE_ENV=development
```

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd rapidapi-lead-miner
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `RAPIDAPI_KEY`: Your RapidAPI key

Vercel will automatically build and deploy your application.

### Manual Build

For other hosting platforms:

```bash
npm run build
npm start
```

## Usage

1. **Single Search**: Enter a company domain or URL to find contacts
2. **Bulk Processing**: Upload a CSV file with domains for batch processing
3. **API Configuration**: Set your own RapidAPI keys in the settings
4. **Export Results**: Download collected leads in CSV or JSON format
5. **Monitor Progress**: Track API usage and quota limits in real-time

## API Sources

- **Website Contacts Scraper**: Primary source for domain-based contact extraction
- **Apollo.io API**: Advanced people search with company filters
- **Apollo Scraper**: Direct profile URL processing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open a GitHub issue or contact support.