export interface ExecutionContext {
  input?: unknown;
  variables?: Record<string, unknown>;
}

export interface ExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  nextNodeId?: string;
}

export class CodeExecutor {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  private static createSafeFunction(code: string): Function {
    // Create a safe execution context with limited access
    const safeContext = {
      console: {
        log: (...args: unknown[]) => console.log("[Node Execution]:", ...args),
        error: (...args: unknown[]) =>
          console.error("[Node Execution]:", ...args),
        warn: (...args: unknown[]) =>
          console.warn("[Node Execution]:", ...args),
      },
      Math: Math,
      Date: Date,
      JSON: JSON,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      parseInt: parseInt,
      parseFloat: parseFloat,
      isNaN: isNaN,
      isFinite: isFinite,
    };

    try {
      // Create function with safe context
      const func = new Function(
        "input",
        "variables",
        "console",
        "Math",
        "Date",
        "JSON",
        "Array",
        "Object",
        "String",
        "Number",
        "Boolean",
        "parseInt",
        "parseFloat",
        "isNaN",
        "isFinite",
        `
        "use strict";
        ${code}
      `
      );

      return func.bind(null, ...Object.values(safeContext));
    } catch (error) {
      throw new Error(`Code compilation error: ${error}`);
    }
  }

  static async executeCode(
    code: string,
    context: ExecutionContext = {}
  ): Promise<ExecutionResult> {
    try {
      const func = this.createSafeFunction(code);
      const result = await func(context.input, context.variables);

      return {
        success: true,
        output: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  static evaluateCondition(output: unknown): boolean {
    if (typeof output === "boolean") {
      return output;
    }
    if (typeof output === "number") {
      return output !== 0;
    }
    if (typeof output === "string") {
      return output.length > 0;
    }
    if (Array.isArray(output)) {
      return output.length > 0;
    }
    if (output === null || output === undefined) {
      return false;
    }
    return true;
  }
}
