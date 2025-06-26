import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Position {
  x: number;
  y: number;
}

export interface CodeNode {
  id: string;
  position: Position;
  data: {
    label: string;
    code: string;
    output?: unknown;
    isExecuting?: boolean;
    hasError?: boolean;
    errorMessage?: string;
  };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface FlowState {
  nodes: CodeNode[];
  edges: Edge[];
  isExecuting: boolean;
  executionPath: string[];
  currentNodeId: string | null;
  selectedNodeId: string | null;
  draggingNodeId: string | null;
}

const initialState: FlowState = {
  nodes: [],
  edges: [],
  isExecuting: false,
  executionPath: [],
  currentNodeId: null,
  selectedNodeId: null,
  draggingNodeId: null,
};

const flowSlice = createSlice({
  name: "flow",
  initialState,
  reducers: {
    addNode: (state, action: PayloadAction<CodeNode>) => {
      state.nodes.push(action.payload);
    },
    updateNode: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<CodeNode> }>
    ) => {
      const node = state.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        Object.assign(node, action.payload.updates);
      }
    },
    removeNode: (state, action: PayloadAction<string>) => {
      state.nodes = state.nodes.filter((n) => n.id !== action.payload);
      state.edges = state.edges.filter(
        (e) => e.source !== action.payload && e.target !== action.payload
      );
    },
    addEdge: (state, action: PayloadAction<Edge>) => {
      state.edges.push(action.payload);
    },
    removeEdge: (state, action: PayloadAction<string>) => {
      state.edges = state.edges.filter((e) => e.id !== action.payload);
    },
    updateNodeCode: (
      state,
      action: PayloadAction<{ id: string; code: string }>
    ) => {
      const node = state.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.data.code = action.payload.code;
      }
    },
    updateNodeLabel: (
      state,
      action: PayloadAction<{ id: string; label: string }>
    ) => {
      const node = state.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.data.label = action.payload.label;
      }
    },
    setNodeOutput: (
      state,
      action: PayloadAction<{ id: string; output: unknown }>
    ) => {
      const node = state.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.data.output = action.payload.output;
        node.data.hasError = false;
        node.data.errorMessage = undefined;
      }
    },
    setNodeError: (
      state,
      action: PayloadAction<{ id: string; error: string }>
    ) => {
      const node = state.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.data.hasError = true;
        node.data.errorMessage = action.payload.error;
        node.data.output = undefined;
      }
    },
    setNodeExecuting: (
      state,
      action: PayloadAction<{ id: string; isExecuting: boolean }>
    ) => {
      const node = state.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.data.isExecuting = action.payload.isExecuting;
      }
    },
    setExecuting: (state, action: PayloadAction<boolean>) => {
      state.isExecuting = action.payload;
    },
    setExecutionPath: (state, action: PayloadAction<string[]>) => {
      state.executionPath = action.payload;
    },
    setCurrentNodeId: (state, action: PayloadAction<string | null>) => {
      state.currentNodeId = action.payload;
    },
    setSelectedNodeId: (state, action: PayloadAction<string | null>) => {
      state.selectedNodeId = action.payload;
    },
    setDraggingNodeId: (state, action: PayloadAction<string | null>) => {
      state.draggingNodeId = action.payload;
    },
    clearExecutionState: (state) => {
      state.isExecuting = false;
      state.executionPath = [];
      state.currentNodeId = null;
      state.nodes.forEach((node) => {
        node.data.isExecuting = false;
        node.data.output = undefined;
        node.data.hasError = false;
        node.data.errorMessage = undefined;
      });
    },
  },
});

export const {
  addNode,
  updateNode,
  removeNode,
  addEdge,
  removeEdge,
  updateNodeCode,
  updateNodeLabel,
  setNodeOutput,
  setNodeError,
  setNodeExecuting,
  setExecuting,
  setExecutionPath,
  setCurrentNodeId,
  setSelectedNodeId,
  setDraggingNodeId,
  clearExecutionState,
} = flowSlice.actions;

export default flowSlice.reducer;
