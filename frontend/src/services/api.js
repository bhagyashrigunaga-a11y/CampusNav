/**
 * CampusNav API Service Client
 * Handles communication with Amazon EC2 API & AWS Lambda endpoints
 * With automatic fallback to embedded RV University dataset if backend is offline.
 */

import { 
  defaultBlocks, 
  defaultFloors, 
  defaultNodes, 
  defaultEdges,
  clientDijkstra 
} from './defaultData';

const API_BASE = '/api';

async function safeFetchJson(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      return null;
    }
    const text = await res.text();
    if (!text || text.trim() === '') return null;
    return JSON.parse(text);
  } catch (err) {
    // Network or parse error: return null to trigger fallback
    return null;
  }
}

export async function fetchBlocks() {
  const data = await safeFetchJson(`${API_BASE}/blocks`);
  if (data && Array.isArray(data)) return data;
  return defaultBlocks;
}

export async function fetchFloors(blockId) {
  const url = blockId ? `${API_BASE}/floors?blockId=${blockId}` : `${API_BASE}/floors`;
  const data = await safeFetchJson(url);
  if (data && Array.isArray(data)) return data;
  return defaultFloors;
}

export async function fetchNodes(floorId, blockId) {
  let url = `${API_BASE}/nodes`;
  const params = new URLSearchParams();
  if (floorId) params.set('floorId', floorId);
  if (blockId) params.set('blockId', blockId);
  if (params.toString()) url += `?${params}`;
  
  const data = await safeFetchJson(url);
  if (data && Array.isArray(data)) return data;
  
  let nodes = defaultNodes;
  if (floorId) nodes = nodes.filter(n => n.floor_id === floorId);
  if (blockId) nodes = nodes.filter(n => n.block_id === blockId);
  return nodes;
}

export async function saveCampusOffline() {
  if (!('caches' in window) || !('serviceWorker' in navigator)) {
    throw new Error('Offline storage is not supported in this browser.');
  }

  const [blocks, floors, nodes, edges, faculty] = await Promise.all([
    fetchBlocks(),
    fetchFloors(),
    fetchNodes(),
    fetchEdges(),
    fetchFaculty()
  ]);
  const cache = await caches.open('campusnav-offline-v1');
  const mapUrl = '/assets/maps/rvu_campus_map.jpg';
  const mapResponse = await fetch(mapUrl);
  if (!mapResponse.ok) throw new Error('The RVU campus map could not be cached.');
  await cache.put(mapUrl, mapResponse);

  const datasets = [
    ['/api/blocks', blocks],
    ['/api/floors', floors],
    ['/api/nodes', nodes],
    ['/api/edges', edges],
    ['/api/faculty', faculty]
  ];
  await Promise.all(datasets.map(([url, data]) => cache.put(
    url,
    new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
  )));
  return { cachedFloorCount: floors.length, cachedLocationCount: nodes.length };
}

export async function fetchEdges(floorId) {
  const url = floorId ? `${API_BASE}/edges?floorId=${floorId}` : `${API_BASE}/edges`;
  const data = await safeFetchJson(url);
  if (data && Array.isArray(data)) return data;
  return defaultEdges;
}

export async function searchLocations(q, type) {
  let url = `${API_BASE}/search?q=${encodeURIComponent(q || '')}`;
  if (type) url += `&type=${encodeURIComponent(type)}`;
  const data = await safeFetchJson(url);
  if (data && Array.isArray(data)) return data;

  const query = (q || '').toLowerCase();
  const cachedNodes = await fetchNodes();
  return cachedNodes.filter(n => 
    n.name.toLowerCase().includes(query) || 
    (n.code || '').toLowerCase().includes(query) ||
    (n.facility_type || '').toLowerCase().includes(query)
  );
}

export async function fetchFaculty(query = '') {
  const search = query ? `?q=${encodeURIComponent(query)}` : '';
  const response = await fetch(`${API_BASE}/faculty${search}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || 'Faculty directory request failed.');
  if (!Array.isArray(data)) throw new Error('Faculty directory returned an invalid response.');
  return data;
}

export async function calculateRoute(sourceId, destinationId, accessible = false, algorithm = 'dijkstra') {
  let response = null;
  try {
    response = await fetch(`${API_BASE}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId, destinationId, accessible, algorithm })
    });
  } catch (error) {
    console.warn('[API] Backend unavailable; using the embedded offline route graph.', error);
  }

  if (response) {
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || 'The server could not calculate this route.');
    if (!data?.success) throw new Error(data?.error || 'The server could not calculate this route.');
    return data;
  }

  // Graceful client-side fallback
  const [offlineNodes, offlineEdges] = await Promise.all([fetchNodes(), fetchEdges()]);
  const route = clientDijkstra(offlineNodes, offlineEdges, sourceId, destinationId, accessible, algorithm);
  if (!route.success) throw new Error(route.error || 'No offline route is available.');
  let accessibleAlternative = null;
  if (!accessible && route.usesStairs) {
    accessibleAlternative = clientDijkstra(offlineNodes, offlineEdges, sourceId, destinationId, true, algorithm);
  }

  return {
    success: true,
    route,
    accessibleAlternative,
    calculationTimeMs: 1,
    source: 'offline'
  };
}

export async function findNearbyFacilities(sourceId, facilityType = null, accessible = false) {
  const data = await safeFetchJson(`${API_BASE}/facilities/nearby`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId, facilityType, accessible })
  });

  if (data && data.success) {
    return data;
  }

  // Graceful client fallback
  const [offlineNodes, offlineEdges] = await Promise.all([fetchNodes(), fetchEdges()]);
  const sourceNode = offlineNodes.find(n => n.id === sourceId) || offlineNodes[0];
  const targetType = (facilityType || '').toLowerCase();
  
  const matches = offlineNodes.filter(n => {
    if (n.id === sourceId) return false;
    if (!targetType || targetType === 'all') return Boolean(n.facility_type);
    return (n.facility_type || '').toLowerCase().includes(targetType);
  });

  const facilities = matches.map(fac => {
    const route = clientDijkstra(offlineNodes, offlineEdges, sourceId, fac.id, accessible);
    return {
      facility: fac,
      walkingDistanceMeters: route.totalCost,
      walkingTimeMinutes: Math.ceil(route.totalCost / 1.2 / 60),
      walkingTimeSeconds: route.walkingTimeSeconds,
      pathNodeIds: route.pathNodeIds,
      floorId: fac.floor_id,
      isSameFloor: fac.floor_id === sourceNode.floor_id
    };
  }).sort((a, b) => a.walkingDistanceMeters - b.walkingDistanceMeters);

  return {
    success: true,
    source: sourceNode,
    facilityType,
    accessibleMode: accessible,
    count: facilities.length,
    facilities
  };
}

async function requestAdminJson(path, options = {}) {
  const token = localStorage.getItem('campusnav-admin-token');
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error('The server returned an invalid response.');
    }
  }
  if (!response.ok) {
    if (response.status === 401) localStorage.removeItem('campusnav-admin-token');
    throw new Error(data?.error || `Request failed (${response.status}).`);
  }
  return data;
}

export async function adminLogin(username, password) {
  const data = await requestAdminJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  if (!data?.token) throw new Error('The server did not return an administrator session.');
  localStorage.setItem('campusnav-admin-token', data.token);
  return data;
}

export function adminLogout() {
  localStorage.removeItem('campusnav-admin-token');
}

export async function adminCheckSession() {
  return requestAdminJson('/auth/me');
}

export async function adminCreateNode(nodeData) {
  return requestAdminJson('/admin/nodes', {
    method: 'POST',
    body: JSON.stringify(nodeData)
  });
}

export async function adminUpdateNode(id, nodeData) {
  return requestAdminJson(`/admin/nodes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(nodeData)
  });
}

export async function adminDeleteNode(id) {
  return requestAdminJson(`/admin/nodes/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function adminCreateEdge(edgeData) {
  return requestAdminJson('/admin/edges', {
    method: 'POST',
    body: JSON.stringify(edgeData)
  });
}

export async function adminUpdateEdgeStatus(id, isBlocked) {
  return requestAdminJson(`/admin/edges/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ is_blocked: isBlocked })
  });
}

export async function adminUpdateBlockAvailability(id, isAvailable) {
  return requestAdminJson(`/admin/blocks/${encodeURIComponent(id)}/availability`, {
    method: 'PUT',
    body: JSON.stringify({ is_available: isAvailable })
  });
}

export async function adminCreateFaculty(facultyData) {
  return requestAdminJson('/admin/faculty', {
    method: 'POST',
    body: JSON.stringify(facultyData)
  });
}

export async function adminUpdateFaculty(id, facultyData) {
  return requestAdminJson(`/admin/faculty/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(facultyData)
  });
}

export async function adminDeleteFaculty(id) {
  return requestAdminJson(`/admin/faculty/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function adminDeleteEdge(id) {
  return requestAdminJson(`/admin/edges/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function adminGetStats() {
  return requestAdminJson('/admin/stats');
}

export async function adminResetDatabase() {
  return requestAdminJson('/admin/reset', { method: 'POST' });
}
