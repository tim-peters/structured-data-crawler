# Structured Data Crawler

A powerful web crawler that discovers and analyzes structured data across websites. The tool can extract JSON-LD, Microdata, RDFa, OpenGraph, and Twitter Cards from web pages, group duplicate content, and visualize relationships between structured data elements.

## Features

- **Multi-format Support**: Extracts JSON-LD, Microdata, RDFa, OpenGraph, and Twitter Cards
- **Smart Grouping**: Groups identical structured data found across multiple pages
- **Relationship Detection**: Identifies connections between structured data through @id references and other linking mechanisms
- **Duplicate Prevention**: URL normalization prevents crawling the same page multiple times
- **Canonical URL Support**: Respects canonical URLs to avoid duplicate content
- **Multiple View Modes**: 
  - **By Type**: Groups snippets by format and data type
  - **By Snippet**: Shows individual snippets with their relationships
  - **By Occurrence**: Lists all individual occurrences separately
- **Advanced Filtering**: Filter by data type, format, or search content
- **Export Functionality**: Export results as JSON for further analysis
- **CORS Proxy Support**: Built-in support for local PHP proxy with public proxy fallback

## Quick Start

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd structured-data-crawler
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the provided local URL (typically `http://localhost:5173`)

## Optional: Local PHP Proxy Setup

For better performance and reliability, you can run a local PHP proxy server to handle CORS requests:

### Prerequisites for PHP Proxy

- PHP (version 7.4 or higher)

### Starting the PHP Proxy

1. Navigate to the `public` directory:
```bash
cd public
```

2. Start the PHP development server:
```bash
php -S localhost:8000
```

3. The proxy will be available at `http://localhost:8000/proxy.php`

The crawler will automatically detect and use the local PHP proxy when available, falling back to public CORS proxies if needed.

## Usage

### Basic Crawling

1. **Enter Target Domain**: Input the domain you want to crawl (e.g., `example.com` or `https://example.com`)

2. **Configure Options** (Optional):
   - **Max Pages**: Maximum number of pages to crawl (default: 50)
   - **Max Depth**: How deep to follow links from the starting page (default: 3)
   - **Delay**: Delay between requests in milliseconds (default: 1000ms)
   - **Respect robots.txt**: Whether to follow robots.txt rules (default: enabled)

3. **Start Crawling**: Click "Start Crawling" to begin the process

4. **Monitor Progress**: Watch real-time statistics showing pages crawled and structured data found

### Viewing Results

The crawler provides three different view modes:

#### By Type View
- Groups snippets by their format (JSON-LD, Microdata, etc.) and data type
- Shows hierarchical organization of structured data
- Expandable categories for easy navigation
- Best for understanding the overall structure of a site's structured data

#### By Snippet View
- Shows individual snippets with their relationships
- Displays connections between related structured data
- Shows duplicate counts and related snippets
- Best for analyzing specific structured data implementations

#### By Occurrence View
- Lists all individual occurrences separately
- Shows every instance where structured data was found
- Useful for detailed analysis and debugging
- Best for comprehensive auditing

### Filtering and Search

- **Search**: Find specific content, URLs, or data types
- **Data Type Filter**: Filter by specific schema types (Article, Product, etc.)
- **Format Filter**: Filter by structured data format (JSON-LD, Microdata, etc.)

### Understanding Connections

The crawler automatically detects relationships between structured data:

- **Reference**: General ID references between items
- **SameAs**: Items that represent the same entity
- **MainEntity**: Primary entity relationships
- **About**: Subject matter connections
- **Author/Publisher**: Authorship and publishing relationships

### Exporting Results

Click the "Export JSON" button to download a complete dataset including:
- Individual structured data items
- Grouped snippets with relationships
- Crawl metadata and statistics

## Technical Details

### URL Normalization

The crawler implements intelligent URL normalization to prevent duplicate crawling:

- Removes `www.` prefixes for consistent domain handling
- Normalizes trailing slashes and query parameters
- Respects canonical URLs from `<link rel="canonical">` tags
- Prevents crawling equivalent URLs multiple times

### Structured Data Detection

The crawler uses multiple extraction methods:

1. **JSON-LD**: Parses `<script type="application/ld+json">` tags
2. **Microdata**: Extracts `itemscope`, `itemtype`, and `itemprop` attributes
3. **RDFa**: Processes `typeof`, `property`, and `resource` attributes
4. **OpenGraph**: Collects `og:*` meta properties
5. **Twitter Cards**: Gathers `twitter:*` meta properties

### Grouping Algorithm

Structured data is grouped using content-based hashing:

1. **Hash Generation**: Creates unique fingerprints for each structured data item
2. **Duplicate Detection**: Groups items with identical content hashes
3. **Connection Mapping**: Identifies relationships through @id references and other linking properties
4. **Relationship Analysis**: Builds a network of connected structured data snippets

## Configuration

### Crawl Options

- **maxPages** (number): Maximum pages to crawl (1-1000, default: 50)
- **maxDepth** (number): Maximum link depth to follow (1-10, default: 3)
- **delay** (number): Delay between requests in milliseconds (100-10000, default: 1000)
- **respectRobots** (boolean): Whether to respect robots.txt (default: true)

### CORS Proxy Configuration

The crawler supports multiple proxy strategies:

1. **Local PHP Proxy**: `http://localhost:8000/proxy.php` (preferred)
2. **Public CORS Proxies**: Fallback services for when local proxy is unavailable

## Development

### Project Structure

```
src/
├── components/          # React components
│   ├── CrawlerForm.tsx     # Main crawling form
│   ├── CrawlerResults.tsx  # Results display
│   ├── CrawlerStats.tsx    # Statistics display
│   ├── StructuredDataCard.tsx      # Individual data item display
│   └── StructuredDataSnippetCard.tsx  # Snippet group display
├── hooks/              # Custom React hooks
│   └── useCrawler.ts      # Main crawling logic hook
├── services/           # Core business logic
│   ├── crawler.ts         # Web crawling engine
│   ├── structuredDataExtractor.ts  # Data extraction logic
│   ├── dataGrouper.ts     # Grouping and relationship detection
│   └── robotsParser.ts    # robots.txt parsing
├── types/              # TypeScript type definitions
│   └── crawler.ts         # Core type definitions
└── App.tsx             # Main application component
```

### Building for Production

```bash
npm run build
```

The built files will be available in the `dist` directory.

### Linting

```bash
npm run lint
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: 
   - Start the local PHP proxy server
   - Check that the proxy is running on `localhost:8000`
   - Verify firewall settings aren't blocking the proxy

2. **No Structured Data Found**:
   - Verify the target website actually contains structured data
   - Check if the site blocks crawlers via robots.txt
   - Try reducing the crawl delay or increasing max pages

3. **Slow Crawling**:
   - Reduce the delay between requests (but be respectful)
   - Use the local PHP proxy instead of public proxies
   - Reduce max depth or max pages for faster results

### Performance Tips

- Use the local PHP proxy for better performance
- Set appropriate delays to be respectful to target servers
- Filter results to focus on specific data types or formats
- Export large datasets for analysis in external tools

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions, please visit the project repository or create an issue in the issue tracker.