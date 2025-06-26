import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Node } from './Node';
import { Edge as EdgeComponent } from './Edge';
import type { RootState } from '../store';
import { setSelectedNodeId, type CodeNode, addNode, type Edge, addEdge, updateNode } from '../store/flowSlice';

interface ConnectionState {
  isConnecting: boolean;
  sourceNodeId: string | null;
  sourceHandle: string | null;
  sourcePosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
}

const API_ENDPOINTS = [
  {
    name: "Health Check",
    code: `// Health Check Endpoint
fetch('https://python-executor-487010489347.us-central1.run.app/health')
  .then(response => response.json())
  .then(data => console.log('Health Check:', data))
  .catch(error => console.error('Error:', error));
return "Health check initiated";`
  },
  {
    name: "Basic Function Test",
    code: `// Basic Function Test
const payload = {
  script: "def main():\\n    return {\\"message\\": \\"Hello from Cloud Run!\\", \\"status\\": \\"success\\"}"
};

fetch('https://python-executor-487010489347.us-central1.run.app/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
  .then(response => response.json())
  .then(data => console.log('Basic Function:', data))
  .catch(error => console.error('Error:', error));
return "Basic function test initiated";`
  },
  {
    name: "Library Test",
    code: `// Library Test (pandas/numpy)
const payload = {
  script: "import pandas as pd\\nimport numpy as np\\n\\ndef main():\\n    arr = np.array([1, 2, 3, 4, 5])\\n    df = pd.DataFrame({\\"numbers\\": arr})\\n    return {\\"mean\\": float(np.mean(arr)), \\"sum\\": int(np.sum(arr)), \\"dataframe_shape\\": df.shape}"
};

fetch('https://python-executor-487010489347.us-central1.run.app/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
  .then(response => response.json())
  .then(data => console.log('Library Test:', data))
  .catch(error => console.error('Error:', error));
return "Library test initiated";`
  },
  {
    name: "Stdout Capture Test",
    code: `// Stdout Capture Test
const payload = {
  script: "def main():\\n    print(\\"Processing data...\\")\\n    print(\\"Calculation complete!\\")\\n    return {\\"result\\": \\"success\\", \\"value\\": 42}"
};

fetch('https://python-executor-487010489347.us-central1.run.app/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
  .then(response => response.json())
  .then(data => console.log('Stdout Test:', data))
  .catch(error => console.error('Error:', error));
return "Stdout capture test initiated";`
  }
];

export const FlowCanvas: React.FC = () => {
  const dispatch = useDispatch();
  const nodes = useSelector( ( state: RootState ) => state.flow.nodes );
  const edges = useSelector( ( state: RootState ) => state.flow.edges );
  const selectedNodeId = useSelector( ( state: RootState ) => state.flow.selectedNodeId );

  const canvasRef = useRef<HTMLDivElement>( null );
  const hasInitialized = useRef( false );
  const [ connectionState, setConnectionState ] = useState<ConnectionState>( {
    isConnecting: false,
    sourceNodeId: null,
    sourceHandle: null,
    sourcePosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 }
  } );

  // Initialize with input node only once when component mounts
  useEffect( () => {
    // Only run once, rely on Redux duplicate prevention
    if ( hasInitialized.current ) return;
    hasInitialized.current = true;

    const inputNode: CodeNode = {
      id: 'input-node',
      position: { x: 400, y: 100 },
      data: {
        label: 'Input Node',
        code: `// Input Node - Starting point
console.log("Starting workflow execution...");
return { status: "initialized", timestamp: new Date().toISOString() };`
      }
    };

    // Let Redux duplicate prevention handle if it already exists
    dispatch( addNode( inputNode ) );
  }, [] ); // Empty dependency array - only run on mount

  const handleCanvasClick = useCallback( ( e: React.MouseEvent ) => {
    if ( e.target === canvasRef.current ) {
      dispatch( setSelectedNodeId( null ) );
      if ( connectionState.isConnecting ) {
        setConnectionState( {
          isConnecting: false,
          sourceNodeId: null,
          sourceHandle: null,
          sourcePosition: { x: 0, y: 0 },
          currentPosition: { x: 0, y: 0 }
        } );
      }
    }
  }, [ dispatch, connectionState.isConnecting ] );

  const getNextEndpointIndex = useCallback( () => {
    // Count non-input nodes to determine which endpoint to use
    const nonInputNodes = nodes.filter( node => node.id !== 'input-node' );
    const nodeCount = nonInputNodes.length;

    if ( nodeCount === 0 ) return 0; // Health check for first node

    // Cycle through endpoints 1-3 (Basic, Library, Stdout) after health check
    return ( ( nodeCount - 1 ) % 3 ) + 1;
  }, [ nodes ] );

  const handleAddNode = useCallback( () => {
    const inputNode = nodes.find( node => node.id === 'input-node' );
    if ( !inputNode ) return;

    const endpointIndex = getNextEndpointIndex();
    const endpoint = API_ENDPOINTS[ endpointIndex ];

    const newNode: CodeNode = {
      id: `node-${ Date.now() }`,
      position: {
        x: 200 + ( nodes.length * 250 ),
        y: 300 + ( Math.random() * 100 - 50 ) // Slight vertical variation
      },
      data: {
        label: endpoint.name,
        code: endpoint.code
      },
    };

    dispatch( addNode( newNode ) );

    // Auto-connect to input node
    const newEdge: Edge = {
      id: `edge-${ Date.now() }`,
      source: 'input-node',
      target: newNode.id,
      sourceHandle: 'bottom',
      targetHandle: 'top'
    };

    dispatch( addEdge( newEdge ) );
  }, [ dispatch, nodes, getNextEndpointIndex ] );

  const handleNodeClick = useCallback( ( nodeId: string ) => {
    dispatch( setSelectedNodeId( nodeId ) );
  }, [ dispatch ] );

  const handleConnectionStart = useCallback( ( nodeId: string, handleId: string, position: { x: number; y: number } ) => {
    // Disable manual connections - nodes auto-connect to input
    return;
  }, [] );

  const handleConnectionEnd = useCallback( ( targetNodeId: string, targetHandle: string ) => {
    // Disable manual connections - nodes auto-connect to input
    return;
  }, [] );

  return (
    <div
      ref={ canvasRef }
      style={ {
        position: 'relative',
        width: '100%',
        height: '100vh',
        backgroundColor: '#fafafa',
        overflow: 'hidden',
      } }
      onClick={ handleCanvasClick }
    >
      {/* Toolbar */ }
      <div
        style={ {
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 10,
          display: 'flex',
          gap: '10px',
        } }
      >
        <button
          onClick={ handleAddNode }
          style={ {
            padding: '8px 16px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          } }
        >
          Add API Node
        </button>
      </div>

      {/* Instructions */ }
      <div
        style={ {
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '15px',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '300px',
        } }
      >
        <h4 style={ { margin: '0 0 10px 0' } }>Workflow Instructions:</h4>
        <ul style={ { margin: 0, paddingLeft: '15px' } }>
          <li>Input node is automatically created</li>
          <li>New nodes auto-connect to input node</li>
          <li>Node 1: Health Check</li>
          <li>Node 2+: Cycles through API tests</li>
          <li>Use Execute Flow to run all nodes in sequence</li>
        </ul>
      </div>

      {/* Node Counter */ }
      <div
        style={ {
          position: 'absolute',
          top: '80px',
          left: '20px',
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '12px',
        } }
      >
        <strong>Total Nodes:</strong> { nodes.length } | <strong>API Nodes:</strong> { nodes.filter( n => n.id !== 'input-node' ).length }
      </div>

      {/* Edges */ }
      { edges.map( ( edge ) => (
        <EdgeComponent key={ edge.id } edge={ edge } />
      ) ) }

      {/* Nodes */ }
      { nodes.map( ( node ) => (
        <Node
          key={ node.id }
          node={ node }
          onNodeClick={ handleNodeClick }
          onConnectionStart={ handleConnectionStart }
          onConnectionEnd={ handleConnectionEnd }
          isConnecting={ connectionState.isConnecting }
          isInputNode={ node.id === 'input-node' }
        />
      ) ) }
    </div>
  );
};