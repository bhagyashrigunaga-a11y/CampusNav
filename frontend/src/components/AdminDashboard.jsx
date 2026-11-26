import React, { useState, useEffect, useRef } from 'react';
import { 
  Building, 
  MapPin, 
  GitFork, 
  Upload, 
  BarChart3, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle,
  Accessibility,
  QrCode,
  Pencil,
  Users
} from 'lucide-react';
import { 
  adminCreateNode, 
  adminUpdateNode,
  adminUploadFloorPlan,
  adminDeleteNode, 
  adminCreateEdge, 
  adminUpdateEdgeStatus,
  adminUpdateBlockAvailability,
  adminDeleteEdge, 
  adminGetStats, 
  adminResetDatabase,
  adminCreateFaculty,
  adminUpdateFaculty,
  adminDeleteFaculty,
  validateFloorPlanFile,
  fetchFaculty
} from '../services/api';
import { defaultBlocks } from '../services/defaultData';

export default function AdminDashboard({
  floors = [],
  nodes = [],
  edges = [],
  currentFloorId,
  onRefreshData
}) {
  const [activeTab, setActiveTab] = useState('nodes'); // 'nodes' | 'edges' | 'upload' | 'analytics'
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState(null);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState(null);
  const [uploadingFloorPlan, setUploadingFloorPlan] = useState(false);
  const [uploadFloorId, setUploadFloorId] = useState('');
  const floorPlanInputRef = useRef(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [facultyRecords, setFacultyRecords] = useState([]);
  const [editingFacultyId, setEditingFacultyId] = useState(null);
  const [facultyForm, setFacultyForm] = useState({
    name: '',
    department: '',
    designation: '',
    cabin: '',
    room_no: '',
    floor: '',
    office_node_id: ''
  });

  // Form states for adding node
  const [nodeForm, setNodeForm] = useState({
    name: '',
    code: '',
    floor_id: currentFloorId || 'floor-g',
    block_id: 'block-c',
    x: 500,
    y: 325,
    type: 'room',
    facility_type: '',
    description: '',
    is_accessible: true
  });

  // Form states for adding edge
  const [edgeForm, setEdgeForm] = useState({
    source_node_id: '',
    target_node_id: '',
    weight: 15,
    type: 'corridor',
    bidirectional: true
  });

  useEffect(() => {
    loadStats();
    loadFaculty();
  }, []);

  const loadStats = async () => {
    try {
      const data = await adminGetStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  const loadFaculty = async () => {
    try {
      setFacultyRecords(await fetchFaculty());
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load faculty records.' });
    }
  };

  const handleSaveFaculty = async (event) => {
    event.preventDefault();
    try {
      const data = { ...facultyForm, office_node_id: facultyForm.office_node_id || null };
      if (editingFacultyId) {
        await adminUpdateFaculty(editingFacultyId, data);
        setMessage({ type: 'success', text: 'Faculty record updated.' });
      } else {
        await adminCreateFaculty(data);
        setMessage({ type: 'success', text: 'Faculty record added.' });
      }
      setEditingFacultyId(null);
      setFacultyForm({ name: '', department: '', designation: '', cabin: '', room_no: '', floor: '', office_node_id: '' });
      await loadFaculty();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save faculty record.' });
    }
  };

  const handleEditFaculty = (person) => {
    setEditingFacultyId(person.id);
    setFacultyForm({
      name: person.name,
      department: person.department,
      designation: person.designation,
      cabin: person.cabin || '',
      room_no: person.room_no || '',
      floor: person.floor || '',
      office_node_id: person.office_node_id || ''
    });
  };

  const handleDeleteFaculty = async (person) => {
    if (!confirm(`Delete faculty record for "${person.name}"?`)) return;
    try {
      await adminDeleteFaculty(person.id);
      setMessage({ type: 'success', text: 'Faculty record deleted.' });
      await loadFaculty();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete faculty record.' });
    }
  };

  const handleAddNode = async (e) => {
    e.preventDefault();
    try {
      const nodeData = {
        ...nodeForm,
        x: Number(nodeForm.x),
        y: Number(nodeForm.y)
      };
      if (editingNodeId) {
        await adminUpdateNode(editingNodeId, nodeData);
        setMessage({ type: 'success', text: `Location "${nodeForm.name}" updated successfully.` });
        setEditingNodeId(null);
      } else {
        await adminCreateNode(nodeData);
        setMessage({ type: 'success', text: `Node "${nodeForm.name}" created successfully!` });
      }
      setNodeForm({ ...nodeForm, name: '', code: '', description: '' });
      if (onRefreshData) onRefreshData();
      loadStats();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to create node.' });
    }
  };

  const handleEditNode = (node) => {
    setEditingNodeId(node.id);
    setNodeForm({
      name: node.name || '',
      code: node.code || '',
      floor_id: node.floor_id,
      block_id: node.block_id,
      x: node.x,
      y: node.y,
      type: node.type || 'room',
      facility_type: node.facility_type || '',
      description: node.description || '',
      is_accessible: Boolean(node.is_accessible)
    });
  };

  const handleCancelEdit = () => {
    setEditingNodeId(null);
    setNodeForm({ ...nodeForm, name: '', code: '', description: '' });
  };

  const handleDeleteNode = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}" and its edges?`)) return;
    try {
      await adminDeleteNode(id);
      setMessage({ type: 'success', text: `Deleted "${name}".` });
      if (onRefreshData) onRefreshData();
      loadStats();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleAddEdge = async (e) => {
    e.preventDefault();
    if (!edgeForm.source_node_id || !edgeForm.target_node_id) {
      alert('Please select both source and target nodes.');
      return;
    }
    try {
      await adminCreateEdge(edgeForm);
      setMessage({ type: 'success', text: 'Edge pathway successfully created!' });
      if (onRefreshData) onRefreshData();
      loadStats();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteEdge = async (id) => {
    try {
      await adminDeleteEdge(id);
      setMessage({ type: 'success', text: 'Edge removed.' });
      if (onRefreshData) onRefreshData();
      loadStats();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleToggleEdgeBlocked = async (edge) => {
    const isBlocked = !(edge.is_blocked === true || edge.is_blocked === 1 || edge.is_blocked === '1');
    try {
      await adminUpdateEdgeStatus(edge.id, isBlocked);
      setMessage({ type: 'success', text: isBlocked ? 'Path blocked; future routes will avoid it.' : 'Path reopened.' });
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update path status.' });
    }
  };

  const handleNodeStatusChange = async (node, status) => {
    try {
      await adminUpdateNode(node.id, { availability_status: status });
      setMessage({ type: 'success', text: `${node.name} status updated to ${status}.` });
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update classroom status.' });
    }
  };

  const handleToggleBlockAvailability = async (blockId, currentlyUnavailable) => {
    const isAvailable = currentlyUnavailable;
    try {
      const result = await adminUpdateBlockAvailability(blockId, isAvailable);
      setMessage({
        type: 'success',
        text: `${blockId} ${isAvailable ? 'reopened' : 'marked unavailable'} (${result.updatedNodes} locations updated).`
      });
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update building availability.' });
    }
  };

  const handleResetPaperData = async () => {
    if (!confirm('Reset campus graph back to RV University SoCSE Figure 2 default model?')) return;
    try {
      await adminResetDatabase();
      setMessage({ type: 'success', text: 'Graph reset to original RV University model.' });
      if (onRefreshData) onRefreshData();
      loadStats();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };
  const handleFloorPlanSelection = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFloorPlan(null);
    if (!file) return;

    try {
      validateFloorPlanFile(file);
      setSelectedFloorPlan(file);
      setMessage(null);
    } catch (error) {
      event.target.value = '';
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleFloorPlanUpload = async () => {
    const floorId = uploadFloorId || currentFloorId || floors[0]?.id;

    if (!selectedFloorPlan) {
      setMessage({ type: 'error', text: 'Please select a floor plan file.' });
      return;
    }

    if (!floorId) {
      setMessage({ type: 'error', text: 'Please select a floor.' });
      return;
    }

    setUploadingFloorPlan(true);

    try {
      const result = await adminUploadFloorPlan(selectedFloorPlan, floorId);
      setMessage({
        type: 'success',
        text: result.message || 'Floor plan uploaded successfully!'
      });
      setSelectedFloorPlan(null);
      setUploadFloorId('');
      if (floorPlanInputRef.current) floorPlanInputRef.current.value = '';

      if (onRefreshData) await onRefreshData();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Floor plan upload failed.'
      });
    } finally {
      setUploadingFloorPlan(false);
    }
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Admin Portal
            </span>
            <h2 className="text-lg font-bold text-slate-900">Campus Graph & Facility Manager</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage rooms, corridors, staircases, lifts, and AWS S3 floor-plan assets without code changes.
          </p>
        </div>

        <button
          onClick={handleResetPaperData}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
          title="Restore original RV University Figure 2 graph"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Default Graph</span>
        </button>
      </div>

      {/* Status Alert */}
      {message && (
        <div className={`p-3 rounded-xl text-xs flex items-center justify-between ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold ml-2">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('nodes')}
          className={`pb-2.5 px-3 flex items-center space-x-1.5 border-b-2 transition-all ${
            activeTab === 'nodes'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Rooms & Nodes ({nodes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('edges')}
          className={`pb-2.5 px-3 flex items-center space-x-1.5 border-b-2 transition-all ${
            activeTab === 'edges'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GitFork className="w-4 h-4" />
          <span>Paths & Edges ({edges.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('faculty')}
          className={`pb-2.5 px-3 flex items-center space-x-1.5 border-b-2 transition-all ${
            activeTab === 'faculty'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Faculty ({facultyRecords.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`pb-2.5 px-3 flex items-center space-x-1.5 border-b-2 transition-all ${
            activeTab === 'upload'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Floor Plan</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-2.5 px-3 flex items-center space-x-1.5 border-b-2 transition-all ${
            activeTab === 'analytics'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>CloudWatch & Analytics</span>
        </button>
      </div>

      {/* TAB 1: NODES MANAGEMENT */}
      {activeTab === 'nodes' && (
        <div className="space-y-6">
          
          {/* Add New Node Form */}
          <form onSubmit={handleAddNode} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4">
            <h3 className="font-bold text-xs text-slate-800 flex items-center space-x-1">
              <Plus className="w-3.5 h-3.5 text-sky-600" />
              <span>{editingNodeId ? 'Edit Campus Location' : 'Add New Room or Vertex Node'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Room / Node Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IoT Laboratory"
                  value={nodeForm.name}
                  onChange={(e) => setNodeForm({ ...nodeForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Room Code</label>
                <input
                  type="text"
                  placeholder="e.g. LAB-IOT-01"
                  value={nodeForm.code}
                  onChange={(e) => setNodeForm({ ...nodeForm, code: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Floor Level</label>
                <select
                  value={nodeForm.floor_id}
                  onChange={(e) => setNodeForm({ ...nodeForm, floor_id: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                >
                  {floors.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Type</label>
                <select
                  value={nodeForm.type}
                  onChange={(e) => setNodeForm({ ...nodeForm, type: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="room">Room / Classroom / Lab</option>
                  <option value="corridor_junction">Corridor Junction</option>
                  <option value="entrance">Main Entrance</option>
                  <option value="staircase">Staircase (Non-Accessible)</option>
                  <option value="lift">Elevator / Lift (Accessible)</option>
                  <option value="facility">Facility</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Facility Subtype</label>
                <select
                  value={nodeForm.facility_type}
                  onChange={(e) => setNodeForm({ ...nodeForm, facility_type: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">None (Standard Room)</option>
                  <option value="canteen">Canteen & Food</option>
                  <option value="washroom">Washroom / Restroom</option>
                  <option value="library">Library</option>
                  <option value="emergency_exit">Emergency Exit</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Map Coordinates (X, Y)</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={nodeForm.x}
                    onChange={(e) => setNodeForm({ ...nodeForm, x: e.target.value })}
                    className="w-1/2 px-2 py-1.5 rounded-lg border border-slate-300"
                    placeholder="X"
                  />
                  <input
                    type="number"
                    value={nodeForm.y}
                    onChange={(e) => setNodeForm({ ...nodeForm, y: e.target.value })}
                    className="w-1/2 px-2 py-1.5 rounded-lg border border-slate-300"
                    placeholder="Y"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              {editingNodeId ? 'Save Location Changes' : 'Add Node to Campus Graph'}
            </button>
            {editingNodeId && (
              <button type="button" onClick={handleCancelEdit} className="ml-2 px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700">
                Cancel
              </button>
            )}
          </form>

          <section className="space-y-3 rounded-xl border border-slate-200 p-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800">Building availability</h3>
              <p className="mt-1 text-[11px] text-slate-500">Unavailable buildings are removed from route calculations until reopened.</p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[...new Set(nodes.map(node => node.block_id))].map(blockId => {
                const blockNodes = nodes.filter(node => node.block_id === blockId);
                const unavailable = blockNodes.length > 0 && blockNodes.every(node =>
                  node.is_available === false || node.is_available === 0 || node.is_available === '0' ||
                  node.availability_status === 'unavailable'
                );
                const blockName = defaultBlocks.find(block => block.id === blockId)?.name || blockId;
                return (
                  <div key={blockId} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2">
                    <span className="truncate text-xs font-medium text-slate-700">{blockName}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleBlockAvailability(blockId, unavailable)}
                      className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold ${
                        unavailable ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {unavailable ? 'Unavailable · reopen' : 'Available · close'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Existing Nodes Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Code</th>
                  <th className="p-3">Floor</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Accessible</th>
                  <th className="p-3">Availability</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {nodes.map(n => (
                  <tr key={n.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{n.name}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{n.code || '-'}</td>
                    <td className="p-3">{n.floor_id.replace('floor-', 'FL-').toUpperCase()}</td>
                    <td className="p-3 capitalize">{n.facility_type || n.type}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        n.is_accessible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {n.is_accessible ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="p-3">
                      <select
                        aria-label={`Availability status for ${n.name}`}
                        value={n.availability_status || 'unknown'}
                        onChange={(event) => handleNodeStatusChange(n, event.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[10px] font-semibold"
                      >
                        <option value="unknown">Not reported</option>
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="reserved">Reserved</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleEditNode(n)}
                        className="rounded p-1 text-indigo-700 hover:bg-indigo-50"
                        title={`Edit ${n.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => window.open(`/api/locations/${encodeURIComponent(n.id)}/qr`, '_blank', 'noopener,noreferrer')}
                        className="rounded p-1 text-sky-700 hover:bg-sky-50"
                        title={`Open printable QR code for ${n.name}`}
                      >
                        <QrCode className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNode(n.id, n.name)}
                        className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50"
                        title="Delete node"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 2: EDGES MANAGEMENT */}
      {activeTab === 'edges' && (
        <div className="space-y-6">
          <form onSubmit={handleAddEdge} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4">
            <h3 className="font-bold text-xs text-slate-800 flex items-center space-x-1">
              <Plus className="w-3.5 h-3.5 text-sky-600" />
              <span>Connect Two Nodes (Add Path Edge)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Source Node (u)</label>
                <select
                  value={edgeForm.source_node_id}
                  onChange={(e) => setEdgeForm({ ...edgeForm, source_node_id: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  required
                >
                  <option value="">Select source...</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name} ({n.floor_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Target Node (v)</label>
                <select
                  value={edgeForm.target_node_id}
                  onChange={(e) => setEdgeForm({ ...edgeForm, target_node_id: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  required
                >
                  <option value="">Select target...</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name} ({n.floor_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Walking Cost / Weight w(e)</label>
                <input
                  type="number"
                  required
                  value={edgeForm.weight}
                  onChange={(e) => setEdgeForm({ ...edgeForm, weight: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  placeholder="Distance (meters)"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Edge Type</label>
                <select
                  value={edgeForm.type}
                  onChange={(e) => setEdgeForm({ ...edgeForm, type: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                >
                  <option value="corridor">Corridor Walkway</option>
                  <option value="staircase">Staircase (Penalized in Accessible Mode)</option>
                  <option value="lift">Elevator / Lift (Accessible)</option>
                  <option value="ramp">Ramp (Accessible)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              Add Edge Connection
            </button>
          </form>

          {/* Edges List */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">From</th>
                  <th className="p-3">To</th>
                  <th className="p-3">Weight (m)</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {edges.map(e => {
                  const u = nodes.find(n => n.id === e.source_node_id);
                  const v = nodes.find(n => n.id === e.target_node_id);
                  return (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium">{u ? u.name : e.source_node_id}</td>
                      <td className="p-3 font-medium">{v ? v.name : e.target_node_id}</td>
                      <td className="p-3 font-mono font-bold text-sky-700">{e.weight}</td>
                      <td className="p-3 capitalize">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          e.type === 'lift' ? 'bg-amber-100 text-amber-800' :
                          e.type === 'staircase' ? 'bg-rose-100 text-rose-800' :
                          'bg-sky-100 text-sky-800'
                        }`}>
                          {e.type}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleEdgeBlocked(e)}
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                            e.is_blocked === true || e.is_blocked === 1 || e.is_blocked === '1'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {e.is_blocked === true || e.is_blocked === 1 || e.is_blocked === '1' ? 'Blocked · reopen' : 'Open · block'}
                        </button>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDeleteEdge(e.id)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                          title="Delete edge"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'faculty' && (
        <div className="space-y-5">
          <form onSubmit={handleSaveFaculty} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-[11px] font-semibold text-slate-600">
              Faculty / staff name
              <input required value={facultyForm.name} onChange={event => setFacultyForm({ ...facultyForm, name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-xs" />
            </label>
            <label className="text-[11px] font-semibold text-slate-600">
              Department
              <input required value={facultyForm.department} onChange={event => setFacultyForm({ ...facultyForm, department: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-xs" />
            </label>
            <label className="text-[11px] font-semibold text-slate-600">
              Designation
              <input required value={facultyForm.designation} onChange={event => setFacultyForm({ ...facultyForm, designation: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-xs" />
            </label>
            <label className="text-[11px] font-semibold text-slate-600">
              Cabin number
              <input placeholder="e.g. C-204" value={facultyForm.cabin} onChange={event => setFacultyForm({ ...facultyForm, cabin: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-xs" />
            </label>
            <label className="text-[11px] font-semibold text-slate-600">
              Room number
              <input value={facultyForm.room_no} onChange={event => setFacultyForm({ ...facultyForm, room_no: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-xs" />
            </label>
            <label className="text-[11px] font-semibold text-slate-600">
              Floor
              <input value={facultyForm.floor} onChange={event => setFacultyForm({ ...facultyForm, floor: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-xs" />
            </label>
            <label className="text-[11px] font-semibold text-slate-600">
              Office location
              <select value={facultyForm.office_node_id} onChange={event => setFacultyForm({ ...facultyForm, office_node_id: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs">
                <option value="">Not linked</option>
                {nodes.filter(node => node.type === 'room').map(node => (
                  <option key={node.id} value={node.id}>{node.name}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500">
                {editingFacultyId ? 'Save changes' : 'Add verified record'}
              </button>
              {editingFacultyId && (
                <button type="button" onClick={() => { setEditingFacultyId(null); setFacultyForm({ name: '', department: '', designation: '', cabin: '', room_no: '', floor: '', office_node_id: '' }); }} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
                  Cancel
                </button>
              )}
            </div>
          </form>

          <p className="text-[11px] text-slate-500">Enter only approved staff information. The directory begins empty and does not invent faculty records.</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-700">
                <tr><th className="p-3">Name</th><th className="p-3">Department</th><th className="p-3">Designation</th><th className="p-3">Cabin no.</th><th className="p-3">Room no.</th><th className="p-3">Floor</th><th className="p-3">Office</th><th className="p-3">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {facultyRecords.map(person => (
                  <tr key={person.id}>
                    <td className="p-3 font-semibold">{person.name}</td>
                    <td className="p-3">{person.department}</td>
                    <td className="p-3">{person.designation}</td>
                    <td className="p-3">{person.cabin || '—'}</td>
                    <td className="p-3">{person.room_no || '—'}</td>
                    <td className="p-3">{person.floor || '—'}</td>
                    <td className="p-3">{person.office_name || 'Not linked'}</td>
                    <td className="p-3">
                      <button onClick={() => handleEditFaculty(person)} className="rounded p-1 text-indigo-700 hover:bg-indigo-50" title="Edit record"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteFaculty(person)} className="rounded p-1 text-rose-700 hover:bg-rose-50" title="Delete record"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
                {facultyRecords.length === 0 && (
                  <tr><td colSpan="8" className="p-4 text-center text-slate-500">No staff records have been entered.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* TAB: FLOOR PLAN UPLOAD */}
      {activeTab === 'upload' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">
              Upload Campus Floor Plan
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                Select Floor
              </label>
              <select
                value={uploadFloorId || currentFloorId || floors[0]?.id || ''}
                onChange={(event) => setUploadFloorId(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                required
              >
                <option value="">Choose a floor</option>
                {floors.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                Select Floor Plan Image
              </label>
              <input
                ref={floorPlanInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp,.png,.jpg,.jpeg,.svg,.webp"
                onChange={handleFloorPlanSelection}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Maximum file size: 10 MB.
              </p>
            </div>

            {selectedFloorPlan && (
              <p className="text-xs text-slate-600">
                Selected: {selectedFloorPlan.name}
              </p>
            )}

            <button
              type="button"
              onClick={handleFloorPlanUpload}
              disabled={uploadingFloorPlan || !selectedFloorPlan}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {uploadingFloorPlan ? 'Uploading...' : 'Upload Floor Plan'}
            </button>
          </div>
        </div>
      )}
      {/* TAB 3: CLOUDWATCH & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Total Graph Vertices</span>
              <p className="text-2xl font-black text-sky-950 mt-1">{nodes.length}</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Traversable Edges</span>
              <p className="text-2xl font-black text-indigo-950 mt-1">{edges.length}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Total Route Searches</span>
              <p className="text-2xl font-black text-emerald-950 mt-1">{stats?.totalSearches || 0}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Accessible Mode Uses</span>
              <p className="text-2xl font-black text-amber-950 mt-1">{stats?.accessibleSearches || 0}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded-xl text-slate-200 font-mono text-xs space-y-2">
            <p className="text-sky-400 font-bold">// CampusNav application telemetry</p>
            <p className="text-slate-400">[Metrics] Route searches are recorded by the configured local or MySQL data store.</p>
            <p className="text-slate-400">[AWS] CloudWatch/S3 connectivity is not verified by this dashboard.</p>
            <p className="text-amber-300">[Status] Configure and test AWS credentials and IAM permissions before treating cloud services as live.</p>
          </div>
        </div>
      )}

    </div>
  );
}
