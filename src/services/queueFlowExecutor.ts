import type { CodeNode, Edge } from '../store/flowSlice';

export interface QueueExecutionResult {
  success: boolean;
  executionQueue: string[];
  completedNodes: string[];
  finalOutput?: unknown;
  error?: string;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  nodeId: string;
  nodeName: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

export interface NodeExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  logs: string[];
}

export class QueueFlowExecutor {
  private static readonly API_BASE_URL =
    'https://python-executor-487010489347.us-central1.run.app';

  private static readonly API_ENDPOINTS = [
    {
      name: 'Health Check',
      path: '/health',
      method: 'GET',
    },
    {
      name: 'Basic Function Test',
      path: '/execute',
      method: 'POST',
      payload: {
        script:
          'def main():\n    return {"message": "Hello from Cloud Run!", "status": "success"}',
      },
    },
    {
      name: 'Library Test',
      path: '/execute',
      method: 'POST',
      payload: {
        script:
          'import pandas as pd\nimport numpy as np\n\ndef main():\n    arr = np.array([1, 2, 3, 4, 5])\n    df = pd.DataFrame({"numbers": arr})\n    return {"mean": float(np.mean(arr)), "sum": int(np.sum(arr)), "dataframe_shape": df.shape}',
      },
    },
    {
      name: 'Stdout Capture Test',
      path: '/execute',
      method: 'POST',
      payload: {
        script:
          'def main():\n    print("Processing data...")\n    print("Calculation complete!")\n    return {"result": "success", "value": 42}',
      },
    },
  ];

  static async executeFlow(
    nodes: CodeNode[],
    edges: Edge[],
    onNodeStart?: (nodeId: string) => void,
    onNodeComplete?: (nodeId: string, result: NodeExecutionResult) => void,
    onLog?: (log: ExecutionLog) => void
  ): Promise<QueueExecutionResult> {
    const executionQueue = this.createExecutionQueue(nodes);
    const completedNodes: string[] = [];
    const logs: ExecutionLog[] = [];
    let finalOutput: unknown = null;

    const addLog = (
      nodeId: string,
      nodeName: string,
      type: ExecutionLog['type'],
      message: string,
      data?: any
    ) => {
      const log: ExecutionLog = {
        nodeId,
        nodeName,
        timestamp: new Date().toISOString(),
        type,
        message,
        data,
      };
      logs.push(log);
      if (onLog) onLog(log);
    };

    addLog(
      'system',
      'System',
      'info',
      `Starting workflow execution with ${executionQueue.length} nodes`
    );

    try {
      for (let i = 0; i < executionQueue.length; i++) {
        const nodeId = executionQueue[i];
        const node = nodes.find((n) => n.id === nodeId);

        if (!node) {
          addLog(nodeId, 'Unknown', 'error', 'Node not found in workflow');
          continue;
        }

        addLog(
          nodeId,
          node.data.label,
          'info',
          `Executing node: ${node.data.label}`
        );

        if (onNodeStart) onNodeStart(nodeId);

        try {
          const result = await this.executeNode(node, i, addLog);

          if (result.success) {
            finalOutput = result.output;
            completedNodes.push(nodeId);
            addLog(
              nodeId,
              node.data.label,
              'success',
              'Node executed successfully',
              result.output
            );
          } else {
            addLog(
              nodeId,
              node.data.label,
              'error',
              result.error || 'Execution failed'
            );
          }

          if (onNodeComplete) onNodeComplete(nodeId, result);

          // Add delay between nodes for better UX
          if (i < executionQueue.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          addLog(
            nodeId,
            node.data.label,
            'error',
            `Execution error: ${errorMessage}`
          );

          if (onNodeComplete) {
            onNodeComplete(nodeId, {
              success: false,
              error: errorMessage,
              logs: [],
            });
          }
        }
      }

      addLog(
        'system',
        'System',
        'success',
        'Workflow execution completed successfully'
      );

      return {
        success: true,
        executionQueue,
        completedNodes,
        finalOutput,
        logs,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addLog(
        'system',
        'System',
        'error',
        `Workflow execution failed: ${errorMessage}`
      );

      return {
        success: false,
        executionQueue,
        completedNodes,
        error: errorMessage,
        logs,
      };
    }
  }

  // Made this method public static so it can be used by ExecutionControls
  static createExecutionQueue(nodes: CodeNode[]): string[] {
    // Create execution order: Input node first, then all connected nodes in creation order
    const inputNode = nodes.find((node) => node.id === 'input-node');
    if (!inputNode) return [];

    const connectedNodes = nodes.filter((node) => node.id !== 'input-node');

    // Sort by creation time (node ID contains timestamp)
    connectedNodes.sort((a, b) => {
      const timeA = parseInt(a.id.split('-')[1] || '0');
      const timeB = parseInt(b.id.split('-')[1] || '0');
      return timeA - timeB;
    });

    return [inputNode.id, ...connectedNodes.map((node) => node.id)];
  }

  private static async executeNode(
    node: CodeNode,
    nodeIndex: number,
    addLog: (
      nodeId: string,
      nodeName: string,
      type: ExecutionLog['type'],
      message: string,
      data?: any
    ) => void
  ): Promise<NodeExecutionResult> {
    if (node.id === 'input-node') {
      // Input node just returns initialization data
      addLog(node.id, node.data.label, 'info', 'Input node initialized');
      return {
        success: true,
        output: { status: 'initialized', timestamp: new Date().toISOString() },
        logs: ['Input node initialized'],
      };
    }

    // For API nodes, determine which endpoint to use based on position
    const apiIndex = (nodeIndex - 1) % this.API_ENDPOINTS.length; // Skip input node
    const endpoint = this.API_ENDPOINTS[apiIndex];

    addLog(
      node.id,
      node.data.label,
      'info',
      `Using API endpoint: ${endpoint.name}`
    );

    try {
      const url = `${this.API_BASE_URL}${endpoint.path}`;
      const options: RequestInit = {
        method: endpoint.method,
        headers:
          endpoint.method === 'POST'
            ? { 'Content-Type': 'application/json' }
            : undefined,
        body:
          endpoint.method === 'POST' && endpoint.payload
            ? JSON.stringify(endpoint.payload)
            : undefined,
      };

      addLog(
        node.id,
        node.data.label,
        'info',
        `Making ${endpoint.method} request to ${url}`
      );

      console.log(`[${node.data.label}] Making API call to:`, url);
      console.log(`[${node.data.label}] Request options:`, options);

      const response = await fetch(url, options);
      const data = await response.json();

      console.log(`[${node.data.label}] Response status:`, response.status);
      console.log(`[${node.data.label}] Response data:`, data);

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      addLog(node.id, node.data.label, 'success', `API call successful`, data);

      return {
        success: true,
        output: data,
        logs: [`API call to ${endpoint.name} successful`],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.error(`[${node.data.label}] API call failed:`, error);

      addLog(
        node.id,
        node.data.label,
        'error',
        `API call failed: ${errorMessage}`
      );

      return {
        success: false,
        error: errorMessage,
        logs: [`API call to ${endpoint.name} failed: ${errorMessage}`],
      };
    }
  }

  static async executeNodeStepByStep(
    nodes: CodeNode[],
    currentStep: number
  ): Promise<{ result: NodeExecutionResult; hasNext: boolean }> {
    const executionQueue = this.createExecutionQueue(nodes);

    if (currentStep >= executionQueue.length) {
      return {
        result: { success: false, error: 'No more nodes to execute', logs: [] },
        hasNext: false,
      };
    }

    const nodeId = executionQueue[currentStep];
    const node = nodes.find((n) => n.id === nodeId);

    if (!node) {
      return {
        result: { success: false, error: 'Node not found', logs: [] },
        hasNext: currentStep + 1 < executionQueue.length,
      };
    }

    const result = await this.executeNode(node, currentStep, () => {});

    return {
      result,
      hasNext: currentStep + 1 < executionQueue.length,
    };
  }
}
