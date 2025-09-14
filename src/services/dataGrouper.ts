import { StructuredDataItem, StructuredDataSnippet, Connection } from '../types/crawler';

export function groupStructuredData(items: StructuredDataItem[]): StructuredDataSnippet[] {
  const snippets = new Map<string, StructuredDataSnippet>();
  const idToHashMap = new Map<string, string>();

  // Helper: recursively collect all @id values from an object
  function collectAllIds(obj: any, hash: string) {
    if (obj && typeof obj === 'object') {
      if (typeof obj['@id'] === 'string') {
        if (!idToHashMap.has(obj['@id']) || idToHashMap.get(obj['@id']) === hash) {
          idToHashMap.set(obj['@id'], hash);
        }
      }
      Object.values(obj).forEach(value => {
        if (typeof value === 'object') {
          collectAllIds(value, hash);
        }
      });
    }
  }

  // First pass: create groups and build ID to hash mapping
  items.forEach(item => {
    // Top-level id mapping
    const canonicalId = item.data['@id'] || item.id;
    if (canonicalId) {
      if (!idToHashMap.has(canonicalId) || idToHashMap.get(canonicalId) === item.hash) {
        idToHashMap.set(canonicalId, item.hash);
      }
    }
    // Recursively collect nested @id
    collectAllIds(item.data, item.hash);

    if (!snippets.has(item.hash)) {
      snippets.set(item.hash, {
        hash: item.hash,
        items: [],
        type: item.type,
        format: item.format,
        connections: [],
        duplicateCount: 0
      });
    }

    const snippet = snippets.get(item.hash)!;
    snippet.items.push(item);
    snippet.duplicateCount = snippet.items.length;

    // Update format if we have mixed formats in the same group
    if (snippet.format !== item.format) {
      snippet.format = 'Mixed';
    }
  });

  // Second pass: find connections  
  snippets.forEach(snippet => {
    snippet.connections = findConnections(snippet.items[0], idToHashMap);
  });
  
  return Array.from(snippets.values()).sort((a, b) => b.duplicateCount - a.duplicateCount);
}

function findConnections(item: StructuredDataItem, idToHashMap: Map<string, string>): Connection[] {
  const connections: Connection[] = [];
  const seenConnections = new Set<string>();
  const data = item.data;
  
  // Helper function to check for references in any value
  const checkForReferences = (obj: any, path: string = '') => {
    if (typeof obj === 'string') {
      // Check if this looks like an ID reference
      if (idToHashMap.has(obj)) {
        const targetHash = idToHashMap.get(obj);
          if (targetHash !== item.hash) {
          const connectionKey = `${determineConnectionType(path)}-${obj}-${path}`;
          if (!seenConnections.has(connectionKey)) {
            seenConnections.add(connectionKey);
            connections.push({
              type: determineConnectionType(path),
              targetId: obj,
              targetHash: idToHashMap.get(obj),
              property: path,
              value: obj
            });
          }
        }
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        checkForReferences(item, `${path}[${index}]`);
      });
    } else if (obj && typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        const newPath = path ? `${path}.${key}` : key;
        checkForReferences(value, newPath);
      });
    }
  };
  
  // Look for common reference patterns
  const referencePatterns = [
    '@id', 'id', 'sameAs', 'mainEntity', 'about', 'author', 'publisher',
    'mainEntityOfPage', 'url', 'itemid', 'resource', 'isPartOf', 'hasPart',
    'mentions', 'citation', 'workExample', 'exampleOfWork'
  ];
  
  referencePatterns.forEach(pattern => {
    if (data[pattern]) {
      checkForReferences(data[pattern], pattern);
    }
  });
  
  // Also check nested objects for references
  checkForReferences(data);
  
  return connections;
}

function determineConnectionType(property: string): Connection['type'] {
  const lowerProp = property.toLowerCase();
  
  if (lowerProp.includes('sameas')) return 'sameAs';
  if (lowerProp.includes('mainentity')) return 'mainEntity';
  if (lowerProp.includes('about')) return 'about';
  if (lowerProp.includes('author')) return 'author';
  if (lowerProp.includes('publisher')) return 'publisher';
  
  return 'reference';
}

export function findRelatedSnippets(
  targetSnippet: StructuredDataSnippet, 
  allSnippets: StructuredDataSnippet[]
): StructuredDataSnippet[] {
  const relatedSnippets: StructuredDataSnippet[] = [];
  
  // Find snippets that this snippet references
  targetSnippet.connections.forEach(connection => {
    if (connection.targetHash) {
      const relatedSnippet = allSnippets.find(s => s.hash === connection.targetHash);
      if (relatedSnippet && !relatedSnippets.includes(relatedSnippet)) {
        relatedSnippets.push(relatedSnippet);
      }
    }
  });
  
  // Find snippets that reference this snippet
  allSnippets.forEach(snippet => {
    if (snippet.hash === targetSnippet.hash) return;
    
    const hasReferenceToTarget = snippet.connections.some(conn => 
      conn.targetHash === targetSnippet.hash ||
      (targetSnippet.items[0].id && conn.targetId === targetSnippet.items[0].id)
    );
    
    if (hasReferenceToTarget && !relatedSnippets.includes(snippet)) {
      relatedSnippets.push(snippet);
    }
  });
  
  return relatedSnippets;
}

export function findIncomingReferences(
  targetSnippet: StructuredDataSnippet,
  allSnippets: StructuredDataSnippet[]
): StructuredDataSnippet[] {
  const incomingSnippets: StructuredDataSnippet[] = [];
  
  // Get all possible IDs that could reference this snippet
  const targetIds = new Set<string>();
  
  // Add the snippet's main ID if it exists
  if (targetSnippet.items[0]?.id) {
    targetIds.add(targetSnippet.items[0].id);
  }
  
  // Add any @id values from the data
  targetSnippet.items.forEach(item => {
    if (item.data['@id']) {
      targetIds.add(item.data['@id']);
    }
    // Also check for other ID-like properties
    if (item.data.url) {
      targetIds.add(item.data.url);
    }
    if (item.data.sameAs) {
      if (Array.isArray(item.data.sameAs)) {
        item.data.sameAs.forEach(id => targetIds.add(id));
      } else {
        targetIds.add(item.data.sameAs);
      }
    }
  });
  
  // Find snippets that reference any of these IDs
  allSnippets.forEach(snippet => {
    if (snippet.hash === targetSnippet.hash) return; // Skip self
    
    const hasIncomingReference = snippet.connections.some(connection => 
      targetIds.has(connection.targetId) || connection.targetHash === targetSnippet.hash
    );
    
    if (hasIncomingReference && !incomingSnippets.includes(snippet)) {
      incomingSnippets.push(snippet);
    }
  });
  
  return incomingSnippets;
}