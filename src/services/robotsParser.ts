export function parseRobotsTxt(robotsText: string): Map<string, boolean> {
  const rules = new Map<string, boolean>();
  const lines = robotsText.split('\n');
  
  let currentUserAgent = '';
  let isRelevantUserAgent = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip comments and empty lines
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }
    
    const [directive, ...valueParts] = trimmedLine.split(':');
    const value = valueParts.join(':').trim();
    
    if (directive.toLowerCase() === 'user-agent') {
      currentUserAgent = value.toLowerCase();
      isRelevantUserAgent = currentUserAgent === '*' || 
                           currentUserAgent.includes('structureddatacrawler') ||
                           currentUserAgent === '';
    } else if (isRelevantUserAgent) {
      if (directive.toLowerCase() === 'disallow') {
        if (value === '') {
          // Empty disallow means allow everything
          continue;
        }
        rules.set(value, false);
      } else if (directive.toLowerCase() === 'allow') {
        rules.set(value, true);
      }
    }
  }
  
  return rules;
}