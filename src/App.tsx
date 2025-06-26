import { Provider } from 'react-redux';
import { store } from './store';
import { FlowCanvas } from './components/FlowCanvas';
import { ExecutionControls } from './components/ExecutionControls';
import './App.css';

function App () {
  return (
    <Provider store={ store }>
      <div className="App">
        <header className="App-header">
          <h1>Flow Executor</h1>
          <p>Build and execute customizable code flows</p>
        </header>
        <main>
          <FlowCanvas />
          <ExecutionControls />
        </main>
      </div>
    </Provider>
  );
}

export default App;
