import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

// --- CONFIGURATION ---
const GRAPH_FONT = 'Courier New';

// --- ICONS ---
const IconPlus = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>;
const IconLink = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>;
const IconPlay = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
const IconTrash = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
const IconMagic = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>;
const IconDice = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><circle cx="15.5" cy="15.5" r="1.5"></circle><circle cx="15.5" cy="8.5" r="1.5"></circle><circle cx="8.5" cy="15.5" r="1.5"></circle></svg>;
const IconBroom = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6.3 12.3l10-10a1 1 0 0 1 1.4 0l4 4a1 1 0 0 1 0 1.4l-10 10a1 1 0 0 1-.7.3H7a1 1 0 0 1-1-1v-4a1 1 0 0 1 .3-.7zM15 14l4 4M2 22h20"></path></svg>;
const IconBomb = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 2a9 9 0 0 1 9 9c0 3-1.5 5.5-4 7M6 11c0-3 1.5-5.5 4-7M2 22h20M12 22v-5M15 17l-3-3-3 3"></path></svg>;
const IconX = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

// --- ALGORITHMS ---
const INF = 1e9;

const getMetricClosure = (nodes, edges) => {
  const nodeIds = nodes.map(n => n.id);
  const n = nodeIds.length;
  const idToIndex = {};
  nodeIds.forEach((id, i) => idToIndex[id] = i);

  let dist = Array(n).fill(null).map(() => Array(n).fill(INF));
  for (let i = 0; i < n; i++) dist[i][i] = 0;

  edges.forEach(e => {
    const u = idToIndex[e.from];
    const v = idToIndex[e.to];
    if (e.id && String(e.id).startsWith('virtual')) return;
    const weight = parseInt(e.label || "0");
    if (u !== undefined && v !== undefined && !isNaN(weight)) {
      dist[u][v] = weight;
      dist[v][u] = weight;
    }
  });

  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] !== INF && dist[k][j] !== INF) {
          if (dist[i][j] > dist[i][k] + dist[k][j]) {
            dist[i][j] = dist[i][k] + dist[k][j];
          }
        }
      }
    }
  }
  return { dist, idToIndex };
};

const solveTSP = (dist, startIdx, n) => {
  let visited = Array(n).fill(false);
  let path = [];
  let current = startIdx;
  let totalCost = 0;
  visited[current] = true;
  path.push(current);

  for (let i = 0; i < n - 1; i++) {
    let nearest = -1;
    let minDist = INF;
    for (let v = 0; v < n; v++) {
      if (!visited[v] && dist[current][v] < minDist) {
        minDist = dist[current][v];
        nearest = v;
      }
    }
    if (nearest !== -1) {
      visited[nearest] = true;
      path.push(nearest);
      totalCost += minDist;
      current = nearest;
    }
  }

  if (dist[current][startIdx] >= INF) totalCost += INF;
  else totalCost += dist[current][startIdx];

  path.push(startIdx);
  return { path, totalCost };
};

export default function App() {
  const containerRef = useRef(null);
  const [network, setNetwork] = useState(null);
  const [result, setResult] = useState(null);
  const [routeLog, setRouteLog] = useState([]);
  const [selection, setSelection] = useState(null);
  const [instruction, setInstruction] = useState("Click 'Add City' to start.");
  const [startNodeId, setStartNodeId] = useState('S');
  const [availableNodes, setAvailableNodes] = useState([]);
  const [layoutMode, setLayoutMode] = useState('organic');

  const [isConnecting, setIsConnecting] = useState(false);
  const isConnectingRef = useRef(false);
  const connectionSourceRef = useRef(null);

  const nodesRef = useRef(new DataSet([
    { id: 'S', label: 'Start', color: '#6366f1', font: { color: 'white', size: 22, face: GRAPH_FONT } },
    { id: 'A', label: 'City A', color: '#3b82f6', font: { color: 'white', size: 22, face: GRAPH_FONT } },
    { id: 'B', label: 'City B', color: '#3b82f6', font: { color: 'white', size: 22, face: GRAPH_FONT } },
  ]));

  const edgesRef = useRef(new DataSet([
    { id: 'e1', from: 'S', to: 'A', label: '15', color: { color: '#6b7280' }, font: { color: 'white', background: '#374151', strokeWidth: 0, size: 16, face: GRAPH_FONT } },
    { id: 'e2', from: 'A', to: 'B', label: '20', color: { color: '#6b7280' }, font: { color: 'white', background: '#374151', strokeWidth: 0, size: 16, face: GRAPH_FONT } },
  ]));

  const updateNodeList = () => {
    const nodes = nodesRef.current.get();
    setAvailableNodes(nodes.map(n => ({ id: n.id, label: n.label })));
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const data = { nodes: nodesRef.current, edges: edgesRef.current };

    const options = {
      height: '100%',
      width: '100%',
      manipulation: { enabled: false },
      physics: {
        enabled: true,
        solver: 'repulsion',
        repulsion: { nodeDistance: 300, springLength: 300, springConstant: 0.05 },
        stabilization: { iterations: 100 }
      },
      layout: { hierarchical: false },
      interaction: { hover: true, selectConnectedEdges: false },
      nodes: {
        shape: 'circle',
        margin: 10,
        borderWidth: 2,
        font: { color: 'white', size: 22, face: GRAPH_FONT, bold: true }
      },
      edges: {
        width: 3,
        smooth: { type: 'continuous' },
        arrows: { to: { enabled: false } },
        font: { color: '#e5e7eb', background: '#1f2937', strokeWidth: 0, size: 16, face: GRAPH_FONT, align: 'horizontal' }
      }
    };

    const net = new Network(containerRef.current, data, options);
    setNetwork(net);
    updateNodeList();

    // --- MAIN INTERACTION HANDLER ---
    net.on("click", (params) => {
      // CHECK 1: ARE WE IN CONNECT MODE?
      if (isConnectingRef.current) {
        if (params.nodes.length > 0) {
          const clickedId = params.nodes[0];

          if (connectionSourceRef.current === null) {
            // Step 1: Select Source
            connectionSourceRef.current = clickedId;
            setInstruction(`Source: ${nodesRef.current.get(clickedId).label}. Now click Destination.`);
          } else {
            // Step 2: Select Destination
            const sourceId = connectionSourceRef.current;
            if (sourceId !== clickedId) {

              // NEW: DUPLICATE CHECK
              const allEdges = edgesRef.current.get();
              const exists = allEdges.some(e =>
                !String(e.id).startsWith('virtual') && // Ignore simulation lines
                ((e.from === sourceId && e.to === clickedId) ||
                  (e.from === clickedId && e.to === sourceId))
              );

              if (exists) {
                setInstruction("⚠️ Already connected! Select a different city.");
                connectionSourceRef.current = null; // Reset selection
              } else {
                edgesRef.current.add({
                  id: `e-${Date.now()}`,
                  from: sourceId,
                  to: clickedId,
                  label: '10',
                  color: { color: '#6b7280' },
                  font: { color: 'white', background: '#374151', strokeWidth: 0, size: 16, face: GRAPH_FONT }
                });
                setInstruction("Connected! Click a new Source city.");
                connectionSourceRef.current = null; // Reset for next pair
              }

            } else {
              // Clicked same node twice, reset
              connectionSourceRef.current = null;
              setInstruction("Cancelled. Click a Source city.");
            }
          }
        } else {
          // Clicked empty space: Cancel current pair, keep mode on
          connectionSourceRef.current = null;
          setInstruction("Ready to connect. Click a Source city.");
        }
        return; // STOP HERE (Don't open edit menu)
      }

      // CHECK 2: STANDARD SELECTION MODE
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        setSelection({ type: 'node', id: nodeId, data: nodesRef.current.get(nodeId) });
      } else if (params.edges.length > 0) {
        const edgeId = params.edges[0];
        const edge = edgesRef.current.get(edgeId);
        if (!String(edge.id).startsWith('virtual')) {
          setSelection({ type: 'edge', id: edgeId, data: edge });
        }
      } else {
        setSelection(null);
      }
    });

    nodesRef.current.on('*', updateNodeList);

    return () => net.destroy();
  }, []);

  const organizeLayout = () => {
    if (!network) return;
    setInstruction("Reorganizing layout...");

    const layoutOptions = {
      organic: { physics: { enabled: true, solver: 'repulsion', repulsion: { nodeDistance: 350, springLength: 250 } }, layout: { hierarchical: false } },
      force: { physics: { enabled: true, solver: 'forceAtlas2Based', forceAtlas2Based: { gravitationalConstant: -100, springLength: 100 } }, layout: { hierarchical: false } },
      hierarchical: { physics: { enabled: false }, layout: { hierarchical: { enabled: true, direction: 'UD', sortMethod: 'directed', levelSeparation: 150, nodeSpacing: 200 } } }
    };

    if (layoutOptions[layoutMode]) {
      network.setOptions(layoutOptions[layoutMode]);
      network.stabilize(500);
      network.fit({ animation: true });
    } else if (layoutMode === 'circular') {
      network.setOptions({ physics: { enabled: false }, layout: { hierarchical: false } });
      const nodes = nodesRef.current.get();
      const radius = 300;
      nodes.forEach((node, index) => {
        const angle = (2 * Math.PI * index) / nodes.length;
        nodesRef.current.update({ id: node.id, x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
      });
      network.fit({ animation: true });
    } else if (layoutMode === 'grid') {
      network.setOptions({ physics: { enabled: false }, layout: { hierarchical: false } });
      const nodes = nodesRef.current.get();
      const cols = Math.ceil(Math.sqrt(nodes.length));
      const spacing = 200;
      nodes.forEach((node, index) => {
        nodesRef.current.update({ id: node.id, x: (index % cols) * spacing, y: Math.floor(index / cols) * spacing });
      });
      network.fit({ animation: true });
    }
    setTimeout(() => setInstruction("Layout optimized."), 500);
  };

  const addNode = () => {
    const id = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Math.floor(Math.random() * 100);
    nodesRef.current.add({
      id: id,
      label: id,
      color: '#3b82f6',
      font: { color: 'white', size: 22, face: GRAPH_FONT }
    });
    setInstruction("City added. Drag to move.");
  };

  // --- TOGGLE CONNECT MODE ---
  const toggleConnectMode = () => {
    const newState = !isConnectingRef.current;
    isConnectingRef.current = newState;
    setIsConnecting(newState);

    if (newState) {
      setInstruction("🔗 MODE ACTIVE: Click Source then Destination.");
      setSelection(null);
      connectionSourceRef.current = null;
    } else {
      setInstruction("Edit Mode.");
      connectionSourceRef.current = null;
    }
  };

  const randomizeMap = () => {
    const currentNodes = nodesRef.current.get();
    if (currentNodes.length < 2) return;
    edgesRef.current.clear();
    setRouteLog([]);
    setResult(null);

    const newEdges = [];
    const nodeIds = currentNodes.map(n => n.id);

    currentNodes.forEach(node => {
      const numConnections = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numConnections; i++) {
        const targetId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
        if (targetId !== node.id) {
          const exists = newEdges.find(e => (e.from === node.id && e.to === targetId) || (e.from === targetId && e.to === node.id));
          if (!exists) {
            newEdges.push({
              id: `e-${Date.now()}-${Math.random()}`,
              from: node.id,
              to: targetId,
              label: String(Math.floor(Math.random() * 40) + 10),
              color: { color: '#6b7280' },
              font: { color: 'white', background: '#374151', strokeWidth: 0, size: 16, face: GRAPH_FONT }
            });
          }
        }
      }
    });
    edgesRef.current.add(newEdges);
    setInstruction("Map randomized!");
    setTimeout(organizeLayout, 100);
  };

  const clearRoads = () => {
    if (window.confirm("Remove all roads? Cities will remain.")) {
      edgesRef.current.clear();
      setRouteLog([]);
      setResult(null);
      setInstruction("Roads cleared.");
    }
  };

  const clearAll = () => {
    if (window.confirm("RESET EVERYTHING?")) {
      edgesRef.current.clear();
      nodesRef.current.clear();
      setRouteLog([]);
      setResult(null);
      setSelection(null);
      setInstruction("Map reset.");
    }
  };

  const deleteSelection = () => {
    if (!selection) return;
    if (selection.type === 'node') nodesRef.current.remove(selection.id);
    if (selection.type === 'edge') edgesRef.current.remove(selection.id);
    setSelection(null);
  };

  const updateLabel = (val) => {
    if (!selection) return;
    if (selection.type === 'node') nodesRef.current.update({ id: selection.id, label: val });
    if (selection.type === 'edge') edgesRef.current.update({ id: selection.id, label: val });
    setSelection({ ...selection, data: { ...selection.data, label: val } });
  };

  const runSimulation = () => {
    const allEdges = edgesRef.current.get();
    const cleanEdges = allEdges.filter(e => !String(e.id).startsWith('virtual'));
    cleanEdges.forEach(e => {
      e.color = { color: '#4b5563' };
      e.width = 2;
      e.arrows = undefined;
      e.dashes = false;
    });
    edgesRef.current.clear();
    edgesRef.current.add(cleanEdges);
    setRouteLog([]);

    const currentNodes = nodesRef.current.get();
    if (currentNodes.length < 2) {
      setResult({ text: "Need 2+ cities", type: 'error' });
      return;
    }

    const { dist, idToIndex } = getMetricClosure(currentNodes, cleanEdges);
    let startIndex = idToIndex[startNodeId];
    if (startIndex === undefined) startIndex = 0;

    const { path, totalCost } = solveTSP(dist, startIndex, currentNodes.length);

    if (totalCost >= INF) {
      setResult({ text: "Unreachable", type: 'error' });
    } else {
      setResult({ text: `Total Cost: ${totalCost}`, type: 'success' });
    }

    const indexToId = {};
    Object.keys(idToIndex).forEach(id => indexToId[idToIndex[id]] = id);
    const newLogs = [];

    for (let i = 0; i < path.length - 1; i++) {
      const u = indexToId[path[i]];
      const v = indexToId[path[i + 1]];
      const uLabel = nodesRef.current.get(u).label;
      const vLabel = nodesRef.current.get(v).label;
      const cost = dist[path[i]][path[i + 1]];

      const isVirtual = cleanEdges.find(e => (e.from === u && e.to === v) || (e.from === v && e.to === u)) === undefined;
      newLogs.push({ step: i + 1, from: uLabel, to: vLabel, cost, type: isVirtual ? 'Virtual' : 'Direct' });

      const existing = cleanEdges.find(e => (e.from === u && e.to === v) || (e.from === v && e.to === u));
      if (existing) {
        const isForward = existing.from === u;
        edgesRef.current.update({
          id: existing.id,
          color: { color: '#ef4444' },
          width: 5,
          arrows: { to: { enabled: isForward }, from: { enabled: !isForward } }
        });
      } else {
        edgesRef.current.add({
          id: `virtual-${u}-${v}-${i}`,
          from: u, to: v,
          label: `${cost} (VIRTUAL)`,
          color: { color: '#f87171' },
          dashes: true,
          width: 4,
          arrows: { to: { enabled: true } },
          font: { color: '#fca5a5', background: 'transparent' }
        });
      }
    }
    setRouteLog(newLogs);
  };

  const styles = {
    container: {
      display: 'flex',
      height: '100vh',
      width: '100vw',
      background: '#111827',
      color: 'white',
      fontFamily: 'Verdana, sans-serif',
      overflow: 'hidden',
    },
    sidebar: {
      width: '340px',
      background: '#1f2937',
      borderRight: '1px solid #374151',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      zIndex: 10,
    },
    scrollArea: {
      padding: '20px',
      overflowY: 'auto',
      flex: 1,
      scrollbarWidth: 'thin',
      scrollbarColor: '#4b5563 #1f2937',
    },
    graphArea: {
      flex: 1,
      position: 'relative',
      background: '#030712',
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      background: '#374151',
      color: 'white',
      border: '1px solid #4b5563',
      padding: '12px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      width: '100%',
      marginBottom: '10px',
      transition: 'all 0.2s',
      fontFamily: 'Verdana, sans-serif',
      boxSizing: 'border-box',
    },
    buttonPrimary: {
      background: '#2563eb',
      borderColor: '#2563eb',
      fontWeight: 'bold',
    },
    buttonActive: {
      background: '#059669',
      borderColor: '#059669',
      fontWeight: 'bold',
    },
    input: {
      background: '#111827',
      border: '1px solid #4b5563',
      color: 'white',
      padding: '10px',
      borderRadius: '4px',
      width: '100%',
      marginBottom: '10px',
      fontSize: '14px',
      fontFamily: 'Verdana, sans-serif',
      boxSizing: 'border-box',
    },
    select: {
      background: '#111827',
      border: '1px solid #4b5563',
      color: 'white',
      padding: '10px',
      borderRadius: '6px',
      width: '100%',
      marginBottom: '15px',
      cursor: 'pointer',
      fontFamily: 'Verdana, sans-serif',
      boxSizing: 'border-box',
    },
    sectionTitle: {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#9ca3af',
      marginBottom: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    logItem: {
      background: '#111827',
      padding: '10px',
      borderRadius: '6px',
      marginBottom: '8px',
      borderLeft: '3px solid #3b82f6',
      fontSize: '13px',
    },
    virtualLog: {
      borderLeft: '3px solid #f87171',
      borderStyle: 'dashed',
    },
    status: {
      position: 'absolute',
      top: 20,
      left: 20,
      background: 'rgba(31, 41, 55, 0.9)',
      padding: '8px 16px',
      borderRadius: '20px',
      border: '1px solid #374151',
      fontSize: '13px',
      color: '#e5e7eb',
    },
    resultBox: {
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      fontWeight: 'bold',
      textAlign: 'center',
      boxSizing: 'border-box',
      background: result?.type === 'error'
        ? 'rgba(239, 68, 68, 0.2)'
        : 'rgba(16, 185, 129, 0.2)',
      color: result?.type === 'error'
        ? '#fca5a5'
        : '#6ee7b7',
      border: `1px solid ${result?.type === 'error' ? '#ef4444' : '#10b981'
        }`,
    },
    editBox: {
      marginBottom: '20px',
      padding: '15px',
      background: '#111827',
      borderRadius: '8px',
      border: '1px solid #374151',
      boxSizing: 'border-box',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.scrollArea}>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>🚛 Route Optimizer</h2>
          <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#9ca3af' }}>Graph Algorithms Simulation</p>

          <div style={{ marginBottom: '20px' }}>
            <div style={styles.sectionTitle}>1. Build Map</div>
            <button style={styles.button} onClick={addNode}><IconPlus /> Add City</button>

            {/* TOGGLE CONNECT MODE BUTTON */}
            <button
              style={isConnecting ? { ...styles.button, ...styles.buttonActive } : styles.button}
              onClick={toggleConnectMode}
            >
              {isConnecting ? <IconX /> : <IconLink />}
              {isConnecting ? "Stop Connecting" : "Connect Cities"}
            </button>

            <button style={styles.button} onClick={randomizeMap}><IconDice /> Randomize Roads</button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ ...styles.button, width: '50%' }} onClick={clearRoads}><IconBroom /> Clear Roads</button>
              <button style={{ ...styles.button, width: '50%', borderColor: '#7f1d1d', color: '#fca5a5' }} onClick={clearAll}><IconBomb /> Reset All</button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={styles.sectionTitle}>2. Layout Engine</div>
            <select style={styles.select} value={layoutMode} onChange={(e) => setLayoutMode(e.target.value)}>
              <option value="organic">Organic (Default)</option>
              <option value="force">Force Atlas (Gravity)</option>
              <option value="hierarchical">Tree (Top-Down)</option>
              <option value="circular">Circular (Ring)</option>
              <option value="grid">Grid (Matrix)</option>
            </select>
            <button style={styles.button} onClick={organizeLayout}><IconMagic /> Optimize Layout</button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={styles.sectionTitle}>3. Simulation</div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: 5, color: '#d1d5db' }}>Start City:</label>
            <select style={styles.select} value={startNodeId} onChange={(e) => setStartNodeId(e.target.value)}>
              {availableNodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
            <button style={{ ...styles.button, ...styles.buttonPrimary }} onClick={runSimulation}>
              <IconPlay /> Run Simulation
            </button>
          </div>

          {selection && (
            <div style={styles.editBox}>
              <div style={styles.sectionTitle}>Edit {selection.type === 'node' ? 'City' : 'Road'}</div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: 5 }}>Name / Cost:</label>
              <input style={styles.input} value={selection.data.label} onChange={(e) => updateLabel(e.target.value)} />
              <button style={{ ...styles.button, background: '#7f1d1d', borderColor: '#ef4444', color: '#fca5a5', marginBottom: 0 }} onClick={deleteSelection}>
                <IconTrash /> Delete Item
              </button>
            </div>
          )}

          {result && (
            <div>
              <div style={styles.sectionTitle}>4. Results</div>
              <div style={styles.resultBox}>{result.text}</div>

              {routeLog.length > 0 && (
                <div>
                  {routeLog.map((log) => (
                    <div key={log.step} style={{ ...styles.logItem, ...(log.type === 'Virtual' ? styles.virtualLog : {}) }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 'bold', color: 'white' }}>Step {log.step}</span>
                        <span style={{ color: log.type === 'Virtual' ? '#f87171' : '#60a5fa', fontSize: '11px', textTransform: 'uppercase' }}>{log.type}</span>
                      </div>
                      <div style={{ color: '#9ca3af' }}>
                        {log.from} ➝ {log.to} <span style={{ color: '#d1d5db', marginLeft: '5px' }}>(Cost: {log.cost})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={styles.graphArea}>
        <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
        <div style={styles.status}>ℹ️ {instruction}</div>
      </div>
    </div>
  );
}