import { StructuredDataItem, StructuredDataGroup, Connection } from '../types/crawler';

export function groupStructuredData(items: StructuredDataItem[]): StructuredDataGroup[] {
  const groups = new Map<string, StructuredDataGroup>();
  const idToHashMap = new Map<string, string>();
  const urlToHashMap = new Map<string, string>();
  
  // First pass: create groups and build ID to hash mapping
  items.forEach(item => {
    if (item.id) {
      idToHashMap.set(item.id, item.hash);
    }
    
    // Also map URLs to hashes for better connection detection
    urlToHashMap.set(item.url, item.hash);
    
    // Extract @id from nested data structures
    if (item.data && typeof item.data === 'object') {
      const extractIds = (obj: any, path: string = '') => {
        if (typeof obj === 'object' && obj !== null) {
          if (obj['@id']) {
            idToHashMap.set(obj['@id'], item.hash);
          }
          Object.entries(obj).forEach(([key, value]) => {
            extractIds(value, path ? `${path}.${key}` : key);
          });
        }
      };
      extractIds(item.data);
    }
    
    if (!groups.has(item.hash)) {
      groups.set(item.hash, {
        hash: item.hash,
        items: [],
        type: item.type,
        format: item.format,
        connections: [],
        duplicateCount: 0
      });
    }
    
    const group = groups.get(item.hash)!;
    group.items.push(item);
    group.duplicateCount = group.items.length;
    
    // Update format if we have mixed formats in the same group
    if (group.format !== item.format) {
      group.format = 'Mixed';
    }
  });
  
  // Second pass: find connections
  groups.forEach(group => {
    group.connections = findConnections(group.items[0], idToHashMap, urlToHashMap);
  });
  
  return Array.from(groups.values()).sort((a, b) => b.duplicateCount - a.duplicateCount);
}

function findConnections(item: StructuredDataItem, idToHashMap: Map<string, string>, urlToHashMap: Map<string, string>): Connection[] {
  const connections: Connection[] = [];
  const seenConnections = new Set<string>();
  const data = item.data;
  
  // Helper function to check for references in any value
  const checkForReferences = (obj: any, path: string = '') => {
    if (typeof obj === 'string') {
      // Check if this looks like an ID reference or URL reference
      let targetHash: string | undefined;
      let targetId = obj;
      
      if (idToHashMap.has(obj)) {
        targetHash = idToHashMap.get(obj);
      } else if (urlToHashMap.has(obj)) {
        targetHash = urlToHashMap.get(obj);
      }
      
      if (targetHash && targetHash !== item.hash) {
        const connectionKey = `${determineConnectionType(path)}-${obj}-${path}`;
        if (!seenConnections.has(connectionKey)) {
          seenConnections.add(connectionKey);
          connections.push({
            type: determineConnectionType(path),
            targetId: targetId,
            targetHash: targetHash,
            property: path,
            value: obj
          });
        }
      }
    } else if (obj && typeof obj === 'object' && obj['@id']) {
      // Handle objects with @id properties (like author objects)
      const id = obj['@id'];
      let targetHash: string | undefined;
      
      if (idToHashMap.has(id)) {
        targetHash = idToHashMap.get(id);
      } else if (urlToHashMap.has(id)) {
        targetHash = urlToHashMap.get(id);
      }
      
      if (targetHash && targetHash !== item.hash) {
        const connectionKey = `${determineConnectionType(path)}-${id}-${path}`;
        if (!seenConnections.has(connectionKey)) {
          seenConnections.add(connectionKey);
          connections.push({
            type: determineConnectionType(path),
            targetId: id,
            targetHash: targetHash,
            property: path,
            value: id
          });
        }
      }
      
      // Continue checking other properties of the object
      Object.entries(obj).forEach(([key, value]) => {
        if (key !== '@id') {
          checkForReferences(value, `${path}.${key}`);
        }
      });
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
    'mainEntityOfPage', 'url', 'itemid', 'resource', 'isPartOf', 'hasPart', 'creator',
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
  if (lowerProp.includes('creator')) return 'author';
  
  return 'reference';
}

export function findRelatedGroups(
  targetGroup: StructuredDataGroup, 
  allGroups: StructuredDataGroup[]
): StructuredDataGroup[] {
  const relatedGroups: StructuredDataGroup[] = [];
  
  // Find groups that this group references
  targetGroup.connections.forEach(connection => {
    if (connection.targetHash) {
      const relatedGroup = allGroups.find(g => g.hash === connection.targetHash);
      if (relatedGroup && !relatedGroups.includes(relatedGroup)) {
        relatedGroups.push(relatedGroup);
      }
    }
  });
  
  // Find groups that reference this group
  allGroups.forEach(group => {
    if (group.hash === targetGroup.hash) return;
    
    const hasReferenceToTarget = group.connections.some(conn => 
      conn.targetHash === targetGroup.hash ||
      (targetGroup.items[0].id && conn.targetId === targetGroup.items[0].id)
    );
    
    if (hasReferenceToTarget && !relatedGroups.includes(group)) {
      relatedGroups.push(group);
    }
  });
  
  return relatedGroups;
}