# Flow Executor

A modern React-based visual workflow builder and executor that allows you to create, visualize, and execute custom code flows with real-time execution tracking and Python backend integration.

## 🚀 Features

### Visual Flow Builder

- **Drag-and-Drop Interface**: Intuitive canvas-based workflow creation
- **Node-Based Architecture**: Create custom code nodes with JavaScript/TypeScript
- **Automatic Connections**: Smart edge management between nodes
- **Real-Time Visualization**: See your workflow structure at a glance

### Code Execution Engine

- **Multi-Language Support**: Execute JavaScript/TypeScript code in nodes
- **Python Backend Integration**: Connect to external Python execution services
- **Safe Execution Environment**: Sandboxed code execution with limited access
- **Error Handling**: Comprehensive error tracking and reporting

### Execution Controls

- **Full Flow Execution**: Run entire workflows from start to finish
- **Step-by-Step Execution**: Execute nodes one at a time for debugging
- **Single Node Execution**: Test individual nodes in isolation
- **Real-Time Logging**: Detailed execution logs with timestamps

### State Management

- **Redux Integration**: Centralized state management with Redux Toolkit
- **Execution State Tracking**: Monitor node execution status in real-time
- **Output Visualization**: View node outputs and error messages
- **Persistent State**: Maintain workflow state across sessions

## 🏗️ Architecture

### Frontend Stack

- **React 19**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development experience
- **Redux Toolkit**: State management with RTK
- **ReactFlow**: Canvas-based flow visualization
- **Vite**: Fast development and build tooling

### Backend Integration

- **Python Executor Service**: Cloud Run-based Python execution
- **RESTful API**: HTTP-based communication with backend services
- **Multiple Endpoints**: Health checks, basic functions, library tests, stdout capture

### Core Components

#### FlowCanvas

The main workspace where users build their workflows:

- Node placement and management
- Edge creation and visualization
- Canvas interaction handling
- Auto-connection logic

#### ExecutionControls

Controls for workflow execution:

- Start/stop execution
- Step-by-step debugging
- Single node execution
- Real-time log display

#### Node Component

Individual workflow nodes:

- Code editor integration
- Execution status display
- Output visualization
- Error handling

#### Services Layer

- **CodeExecutor**: Safe JavaScript code execution
- **FlowExecutor**: Workflow orchestration and execution
- **QueueFlowExecutor**: Sequential node execution with API integration

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd flow-executor
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173` to access the application

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🎯 Usage

### Creating a Workflow

1. **Start with Input Node**: The application automatically creates an input node
2. **Add Execution Nodes**: Click "Add Node" to add new execution nodes
3. **Configure Node Code**: Each node contains executable JavaScript/TypeScript code
4. **Automatic Connections**: Nodes are automatically connected to the input node

### Node Types

The application includes several pre-configured node types:

#### Health Check Node

```javascript
// Health Check Endpoint
fetch("https://python-executor-487010489347.us-central1.run.app/health")
  .then((response) => response.json())
  .then((data) => console.log("Health Check:", data))
  .catch((error) => console.error("Error:", error));
return "Health check initiated";
```

#### Basic Function Test Node

```javascript
// Basic Function Test
const payload = {
  script:
    'def main():\n    return {"message": "Hello from Cloud Run!", "status": "success"}',
};

fetch("https://python-executor-487010489347.us-central1.run.app/execute", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
})
  .then((response) => response.json())
  .then((data) => console.log("Basic Function:", data))
  .catch((error) => console.error("Error:", error));
return "Basic function test initiated";
```

#### Library Test Node

```javascript
// Library Test (pandas/numpy)
const payload = {
  script:
    'import pandas as pd\nimport numpy as np\n\ndef main():\n    arr = np.array([1, 2, 3, 4, 5])\n    df = pd.DataFrame({"numbers": arr})\n    return {"mean": float(np.mean(arr)), "sum": int(np.sum(arr)), "dataframe_shape": df.shape}',
};

fetch("https://python-executor-487010489347.us-central1.run.app/execute", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
})
  .then((response) => response.json())
  .then((data) => console.log("Library Test:", data))
  .catch((error) => console.error("Error:", error));
return "Library test initiated";
```

#### Stdout Capture Test Node

```javascript
// Stdout Capture Test
const payload = {
  script:
    'def main():\n    print("Processing data...")\n    print("Calculation complete!")\n    return {"result": "success", "value": 42}',
};

fetch("https://python-executor-487010489347.us-central1.run.app/execute", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
})
  .then((response) => response.json())
  .then((data) => console.log("Stdout Test:", data))
  .catch((error) => console.error("Error:", error));
return "Stdout capture test initiated";
```

### Execution Modes

#### Full Flow Execution

- Executes all nodes in the workflow sequentially
- Shows real-time progress and logs
- Displays final output from the last node

#### Step-by-Step Execution

- Execute nodes one at a time
- Useful for debugging and understanding flow behavior
- Control execution pace manually

#### Single Node Execution

- Execute only the selected node
- Test individual node functionality
- Isolate issues in specific nodes

### Execution Logs

The application provides detailed execution logs including:

- **Node Start/Complete Events**: Track when nodes begin and finish execution
- **Success/Error Messages**: Clear feedback on execution results
- **Timestamps**: Precise timing information for each operation
- **Output Data**: View actual data returned from nodes

## 🔧 Configuration

### Environment Variables

The application can be configured using environment variables:

```bash
# Python Executor API URL
VITE_PYTHON_EXECUTOR_URL=https://python-executor-487010489347.us-central1.run.app

# Development mode
NODE_ENV=development
```

### Custom Node Templates

You can extend the application by adding custom node templates in `src/components/FlowCanvas.tsx`:

```typescript
const CUSTOM_API_ENDPOINTS = [
  {
    name: "Custom Node",
    code: `// Your custom code here
console.log("Custom node execution");
return { custom: "data" };`,
  },
];
```

## 🛡️ Security

### Code Execution Safety

- **Sandboxed Environment**: Limited access to global objects
- **Function Constructor**: Safe code compilation
- **Error Boundaries**: Comprehensive error handling
- **Input Validation**: Sanitized inputs and outputs

### API Security

- **HTTPS Only**: All external API calls use secure connections
- **Content-Type Validation**: Proper headers for API requests
- **Error Handling**: Graceful handling of API failures

## 🧪 Testing

### Manual Testing

1. Create a simple workflow with 2-3 nodes
2. Test each execution mode (full, step-by-step, single node)
3. Verify error handling with invalid code
4. Check log output and node state updates

### Automated Testing

```bash
# Run linting
npm run lint

# Build verification
npm run build
```

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Static Hosting

The built application can be deployed to any static hosting service:

- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### Environment Configuration

Ensure the Python executor API URL is correctly configured for your deployment environment.

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Maintain consistent code formatting
- Add JSDoc comments for complex functions

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues

#### Node Execution Fails

- Check browser console for JavaScript errors
- Verify Python executor API is accessible
- Ensure node code is valid JavaScript/TypeScript

#### Workflow Not Executing

- Verify all nodes are properly connected
- Check for circular dependencies
- Ensure input node exists

#### API Connection Issues

- Verify network connectivity
- Check Python executor service status
- Review API endpoint configuration

### Getting Help

- Check the browser console for detailed error messages
- Review execution logs for specific failure points
- Verify all dependencies are properly installed

## 🔮 Future Enhancements

### Planned Features

- **Conditional Branching**: Add conditional logic to workflow edges
- **Data Flow Visualization**: Show data passing between nodes
- **Node Templates**: Pre-built node templates for common tasks
- **Workflow Import/Export**: Save and load workflow configurations
- **Collaborative Editing**: Multi-user workflow editing
- **Advanced Logging**: Structured logging with filtering and search

### Technical Improvements

- **Performance Optimization**: Virtual scrolling for large workflows
- **Offline Support**: Local execution without external dependencies
- **Plugin System**: Extensible node types and execution engines
- **Real-time Collaboration**: WebSocket-based real-time updates

---

**Flow Executor** - Build, visualize, and execute custom workflows with ease! 🚀
