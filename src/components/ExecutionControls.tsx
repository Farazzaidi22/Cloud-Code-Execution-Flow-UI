import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    setExecuting,
    setExecutionPath,
    setCurrentNodeId,
    setNodeExecuting,
    setNodeOutput,
    setNodeError,
    clearExecutionState
} from '../store/flowSlice';
import type { RootState } from '../store';
import { QueueFlowExecutor, type ExecutionLog, type NodeExecutionResult } from '../services/QueueFlowExecutor';

export const ExecutionControls: React.FC = () => {
    const dispatch = useDispatch();
    const nodes = useSelector( ( state: RootState ) => state.flow.nodes );
    const edges = useSelector( ( state: RootState ) => state.flow.edges );
    const isExecuting = useSelector( ( state: RootState ) => state.flow.isExecuting );
    const executionPath = useSelector( ( state: RootState ) => state.flow.executionPath );

    const [ logs, setLogs ] = useState<ExecutionLog[]>( [] );
    const [ showLogs, setShowLogs ] = useState( false );
    const [ currentStep, setCurrentStep ] = useState( 0 );

    const addLog = useCallback( ( log: ExecutionLog ) => {
        setLogs( prev => [ ...prev, log ] );
    }, [] );

    const clearLogs = useCallback( () => {
        setLogs( [] );
    }, [] );

    const handleNodeStart = useCallback( ( nodeId: string ) => {
        dispatch( setCurrentNodeId( nodeId ) );
        dispatch( setNodeExecuting( { id: nodeId, isExecuting: true } ) );
    }, [ dispatch ] );

    const handleNodeComplete = useCallback( ( nodeId: string, result: NodeExecutionResult ) => {
        dispatch( setNodeExecuting( { id: nodeId, isExecuting: false } ) );

        if ( result.success ) {
            dispatch( setNodeOutput( { id: nodeId, output: result.output } ) );
        } else {
            dispatch( setNodeError( { id: nodeId, error: result.error || 'Execution failed' } ) );
        }

        // Update execution path
        dispatch( setExecutionPath( [ ...executionPath, nodeId ] ) );
    }, [ dispatch, executionPath ] );

    const handleExecuteFlow = useCallback( async () => {
        if ( nodes.length === 0 ) {
            alert( 'No nodes to execute' );
            return;
        }

        // Clear previous execution state
        dispatch( clearExecutionState() );
        clearLogs();
        setCurrentStep( 0 );

        // Start execution
        dispatch( setExecuting( true ) );

        try {
            const result = await QueueFlowExecutor.executeFlow(
                nodes,
                edges,
                handleNodeStart,
                handleNodeComplete,
                addLog
            );

            if ( result.success ) {
                dispatch( setCurrentNodeId( null ) );
            }
        } catch ( error ) {
            console.error( 'Flow execution error:', error );
            addLog( {
                nodeId: 'system',
                nodeName: 'System',
                timestamp: new Date().toISOString(),
                type: 'error',
                message: `Flow execution failed: ${ error instanceof Error ? error.message : String( error ) }`
            } );
        } finally {
            dispatch( setExecuting( false ) );
        }
    }, [ nodes, edges, dispatch, clearLogs, handleNodeStart, handleNodeComplete, addLog ] );

    const handleStepExecution = useCallback( async () => {
        if ( nodes.length === 0 ) {
            alert( 'No nodes to execute' );
            return;
        }

        if ( !isExecuting ) {
            // Start step execution
            dispatch( clearExecutionState() );
            clearLogs();
            setCurrentStep( 0 );
            dispatch( setExecuting( true ) );
        }

        try {
            const { result, hasNext } = await QueueFlowExecutor.executeNodeStepByStep( nodes, currentStep );

            const executionQueue = QueueFlowExecutor.createExecutionQueue( nodes );
            const currentNodeId = executionQueue[ currentStep ];

            if ( currentNodeId ) {
                handleNodeStart( currentNodeId );
                handleNodeComplete( currentNodeId, result );
            }

            if ( hasNext ) {
                setCurrentStep( prev => prev + 1 );
            } else {
                dispatch( setExecuting( false ) );
                dispatch( setCurrentNodeId( null ) );
                setCurrentStep( 0 );
            }
        } catch ( error ) {
            console.error( 'Step execution error:', error );
            addLog( {
                nodeId: 'system',
                nodeName: 'System',
                timestamp: new Date().toISOString(),
                type: 'error',
                message: `Step execution failed: ${ error instanceof Error ? error.message : String( error ) }`
            } );
            dispatch( setExecuting( false ) );
        }
    }, [ nodes, isExecuting, currentStep, dispatch, clearLogs, handleNodeStart, handleNodeComplete, addLog ] );

    const handleReset = useCallback( () => {
        dispatch( clearExecutionState() );
        clearLogs();
        setCurrentStep( 0 );
    }, [ dispatch, clearLogs ] );

    const getLogTypeColor = ( type: ExecutionLog[ 'type' ] ) => {
        switch ( type ) {
            case 'success': return '#4caf50';
            case 'error': return '#f44336';
            case 'warning': return '#ff9800';
            case 'info':
            default: return '#2196f3';
        }
    };

    const executionQueue = QueueFlowExecutor.createExecutionQueue( nodes );

    return (
        <div
            style={ {
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                right: '20px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                zIndex: 1000,
            } }
        >
            {/* Control Panel */ }
            <div style={ { padding: '20px', borderBottom: showLogs ? '1px solid #eee' : 'none' } }>
                <div style={ { display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' } }>
                    <button
                        onClick={ handleExecuteFlow }
                        disabled={ isExecuting || nodes.length === 0 }
                        style={ {
                            padding: '10px 20px',
                            backgroundColor: '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isExecuting || nodes.length === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            opacity: isExecuting || nodes.length === 0 ? 0.6 : 1,
                        } }
                    >
                        Execute Flow
                    </button>

                    <button
                        onClick={ handleStepExecution }
                        disabled={ nodes.length === 0 }
                        style={ {
                            padding: '10px 20px',
                            backgroundColor: '#ff9800',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: nodes.length === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            opacity: nodes.length === 0 ? 0.6 : 1,
                        } }
                    >
                        Step Execute
                    </button>

                    <button
                        onClick={ handleReset }
                        style={ {
                            padding: '10px 20px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                        } }
                    >
                        Reset
                    </button>

                    <button
                        onClick={ () => setShowLogs( !showLogs ) }
                        style={ {
                            padding: '10px 20px',
                            backgroundColor: '#9c27b0',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                        } }
                    >
                        { showLogs ? 'Hide Logs' : `Show Logs (${ logs.length })` }
                    </button>

                    <div style={ { marginLeft: 'auto', fontSize: '14px', color: '#666' } }>
                        Status: { isExecuting ? `Executing (${ currentStep + 1 }/${ executionQueue.length })` : 'Ready' }
                    </div>
                </div>

                <div style={ { display: 'flex', gap: '20px' } }>
                    <div style={ { flex: 1 } }>
                        <h4 style={ { margin: '0 0 10px 0', fontSize: '14px' } }>Execution Queue:</h4>
                        <div style={ { fontSize: '12px', color: '#666' } }>
                            { executionQueue.length > 0 ? (
                                executionQueue.map( ( nodeId, index ) => {
                                    const node = nodes.find( n => n.id === nodeId );
                                    const isCurrent = index === currentStep && isExecuting;
                                    const isCompleted = index < currentStep;

                                    return (
                                        <span
                                            key={ nodeId }
                                            style={ {
                                                color: isCurrent ? '#ff9800' : isCompleted ? '#4caf50' : '#666',
                                                fontWeight: isCurrent ? 'bold' : 'normal'
                                            } }
                                        >
                                            { index > 0 && ' → ' }
                                            { node?.data.label || nodeId }
                                        </span>
                                    );
                                } )
                            ) : (
                                'No execution queue'
                            ) }
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs Panel */ }
            { showLogs && (
                <div style={ {
                    maxHeight: '300px',
                    overflow: 'auto',
                    padding: '10px 20px',
                    backgroundColor: '#f9f9f9'
                } }>
                    <div style={ { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' } }>
                        <h4 style={ { margin: 0, fontSize: '14px' } }>Execution Logs</h4>
                        <button
                            onClick={ clearLogs }
                            style={ {
                                padding: '4px 8px',
                                backgroundColor: '#666',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                            } }
                        >
                            Clear Logs
                        </button>
                    </div>

                    <div style={ { fontSize: '12px', fontFamily: 'monospace' } }>
                        { logs.length === 0 ? (
                            <div style={ { color: '#666', fontStyle: 'italic' } }>No logs yet</div>
                        ) : (
                            logs.map( log => (
                                <div
                                    key={ log.nodeId + log.timestamp }
                                    style={ {
                                        marginBottom: '8px',
                                        padding: '6px',
                                        backgroundColor: 'white',
                                        borderLeft: `3px solid ${ getLogTypeColor( log.type ) }`,
                                        borderRadius: '4px'
                                    } }
                                >
                                    <div style={ { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' } }>
                                        <span style={ { fontWeight: 'bold', color: getLogTypeColor( log.type ) } }>
                                            [{ log.type.toUpperCase() }] { log.nodeName }
                                        </span>
                                        <span style={ { color: '#666', fontSize: '10px' } }>
                                            { new Date( log.timestamp ).toLocaleTimeString() }
                                        </span>
                                    </div>
                                    <div style={ { color: '#333' } }>{ log.message }</div>
                                    { log.data && (
                                        <pre style={ {
                                            margin: '4px 0 0 0',
                                            padding: '4px',
                                            backgroundColor: '#f0f0f0',
                                            borderRadius: '2px',
                                            fontSize: '10px',
                                            whiteSpace: 'pre-wrap',
                                            maxHeight: '100px',
                                            overflow: 'auto'
                                        } }>
                                            { JSON.stringify( log.data, null, 2 ) }
                                        </pre>
                                    ) }
                                </div>
                            ) )
                        ) }
                    </div>
                </div>
            ) }
        </div>
    );
};