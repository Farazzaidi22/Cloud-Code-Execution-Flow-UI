import type { CodeNode, Edge } from "../store/flowSlice";
import type { ExecutionContext } from "./codeExecutor";
import { CodeExecutor } from "./codeExecutor";

export interface FlowExecutionResult {
  success: boolean;
  executionPath: string[];
  finalOutput?: unknown;
  error?: string;
}

export class FlowExecutor {
  static async executeFlow(
    nodes: CodeNode[],
    edges: Edge[],
    startNodeId?: string
  ): Promise<FlowExecutionResult> {
    const executionPath: string[] = [];
    const visited = new Set<string>();
    let currentNodeId = startNodeId || this.findStartNode(nodes, edges);
    let currentOutput: unknown = null;

    if (!currentNodeId) {
      return {
        success: false,
        executionPath: [],
        error: "No start node found",
      };
    }

    try {
      while (currentNodeId && !visited.has(currentNodeId)) {
        visited.add(currentNodeId);
        executionPath.push(currentNodeId);

        const currentNode = nodes.find((n) => n.id === currentNodeId);
        if (!currentNode) {
          throw new Error(`Node ${currentNodeId} not found`);
        }

        // Execute the current node
        const context: ExecutionContext = {
          input: currentOutput,
          variables: {},
        };

        const result = await CodeExecutor.executeCode(
          currentNode.data.code,
          context
        );

        if (!result.success) {
          throw new Error(
            `Node ${currentNodeId} execution failed: ${result.error}`
          );
        }

        currentOutput = result.output;

        // Find the next node based on the output
        const nextNodeId = this.findNextNode(
          currentNodeId,
          edges,
          result.output
        );
        currentNodeId = nextNodeId;
      }

      return {
        success: true,
        executionPath,
        finalOutput: currentOutput,
      };
    } catch (error) {
      return {
        success: false,
        executionPath,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private static findStartNode(
    nodes: CodeNode[],
    edges: Edge[]
  ): string | null {
    // Find nodes that have no incoming edges
    const targetNodes = new Set(edges.map((e) => e.target));
    const startNodes = nodes.filter((n) => !targetNodes.has(n.id));

    return startNodes.length > 0 ? startNodes[0].id : null;
  }

  private static findNextNode(
    currentNodeId: string,
    edges: Edge[],
    output: unknown
  ): string | null {
    const outgoingEdges = edges.filter((e) => e.source === currentNodeId);

    if (outgoingEdges.length === 0) {
      return null; // No outgoing edges, end of flow
    }

    if (outgoingEdges.length === 1) {
      return outgoingEdges[0].target; // Single path
    }

    // Multiple paths - evaluate conditions
    const condition = CodeExecutor.evaluateCondition(output);

    // For now, use the first edge if condition is true, second if false
    // This can be enhanced with edge labels/conditions later
    if (condition && outgoingEdges[0]) {
      return outgoingEdges[0].target;
    } else if (!condition && outgoingEdges[1]) {
      return outgoingEdges[1].target;
    }

    return null;
  }
}
