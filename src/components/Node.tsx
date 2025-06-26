import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { type CodeNode, setSelectedNodeId, setDraggingNodeId, updateNode } from '../store/flowSlice';

interface NodeProps {
    node: CodeNode;
    onNodeClick: ( nodeId: string ) => void;
    onConnectionStart: ( nodeId: string, handleId: string, position: { x: number; y: number } ) => void;
    onConnectionEnd: ( nodeId: string, handleId: string ) => void;
    isConnecting: boolean;
    isInputNode: boolean;
}

export const Node: React.FC<NodeProps> = ( {
    node,
    onNodeClick,
    onConnectionStart,
    onConnectionEnd,
    isConnecting,
    isInputNode = false
} ) => {
    const dispatch = useDispatch();
    const selectedNodeId = useSelector( ( state: RootState ) => state.flow.selectedNodeId );
    const draggingNodeId = useSelector( ( state: RootState ) => state.flow.draggingNodeId );
    const [ isEditing, setIsEditing ] = useState( false );
    const [ editLabel, setEditLabel ] = useState( node.data.label );
    const [ isDraggingNode, setIsDraggingNode ] = useState( false );
    const [ dragStart, setDragStart ] = useState( { x: 0, y: 0 } );
    const nodeRef = useRef<HTMLDivElement>( null );

    const isSelected = selectedNodeId === node.id;
    const isDragging = draggingNodeId === node.id;
    const isExecuting = node.data.isExecuting;
    const hasError = node.data.hasError;

    const handleMouseDown = useCallback( ( e: React.MouseEvent ) => {
        e.stopPropagation();

        // Don't start dragging if we're connecting or clicking on handles or inputs
        const target = e.target as HTMLElement;
        if ( isConnecting ||
            target.classList.contains( 'connection-handle' ) ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'INPUT' ) {
            return;
        }

        onNodeClick( node.id );

        // Start dragging
        setDragStart( {
            x: e.clientX - node.position.x,
            y: e.clientY - node.position.y
        } );
        setIsDraggingNode( true );
        dispatch( setDraggingNodeId( node.id ) );
    }, [ isConnecting, onNodeClick, node.id, node.position, dispatch ] );

    useEffect( () => {
        const handleMouseMove = ( e: MouseEvent ) => {
            if ( isDragging && isDraggingNode ) {
                e.preventDefault();
                const newX = e.clientX - dragStart.x;
                const newY = e.clientY - dragStart.y;

                // Smooth position update
                requestAnimationFrame( () => {
                    dispatch( updateNode( {
                        id: node.id,
                        updates: {
                            position: { x: newX, y: newY }
                        }
                    } ) );
                } );
            }
        };

        const handleMouseUp = () => {
            if ( isDraggingNode ) {
                setIsDraggingNode( false );
                dispatch( setDraggingNodeId( null ) );
            }
        };

        if ( isDragging && isDraggingNode ) {
            document.addEventListener( 'mousemove', handleMouseMove );
            document.addEventListener( 'mouseup', handleMouseUp );
        }

        return () => {
            document.removeEventListener( 'mousemove', handleMouseMove );
            document.removeEventListener( 'mouseup', handleMouseUp );
        };
    }, [ isDragging, isDraggingNode, dragStart, node.id, dispatch ] );

    const handleDoubleClick = useCallback( () => {
        setIsEditing( true );
    }, [] );

    const handleLabelSubmit = useCallback( () => {
        if ( editLabel.trim() ) {
            dispatch( updateNode( {
                id: node.id,
                updates: {
                    data: { ...node.data, label: editLabel.trim() }
                }
            } ) );
        }
        setIsEditing( false );
    }, [ editLabel, dispatch, node.id, node.data ] );

    const handleKeyPress = useCallback( ( e: React.KeyboardEvent ) => {
        if ( e.key === 'Enter' ) {
            handleLabelSubmit();
        } else if ( e.key === 'Escape' ) {
            setEditLabel( node.data.label );
            setIsEditing( false );
        }
    }, [ handleLabelSubmit, node.data.label ] );

    // Get handle position relative to canvas
    const getHandlePosition = useCallback( ( handleId: string ) => {
        if ( !nodeRef.current ) return { x: 0, y: 0 };

        const nodeRect = nodeRef.current.getBoundingClientRect();
        const canvasRect = nodeRef.current.closest( '[style*="position: relative"]' )?.getBoundingClientRect();

        if ( !canvasRect ) return { x: 0, y: 0 };

        const nodeWidth = 200;
        const nodeHeight = 100;

        switch ( handleId ) {
            case 'right':
                return {
                    x: node.position.x + nodeWidth,
                    y: node.position.y + nodeHeight / 2
                };
            case 'left':
                return {
                    x: node.position.x,
                    y: node.position.y + nodeHeight / 2
                };
            case 'top':
                return {
                    x: node.position.x + nodeWidth / 2,
                    y: node.position.y
                };
            case 'bottom':
                return {
                    x: node.position.x + nodeWidth / 2,
                    y: node.position.y + nodeHeight
                };
            default:
                return { x: node.position.x, y: node.position.y };
        }
    }, [ node.position ] );

    // Handle connection start from handles
    const handleConnectionHandleMouseDown = useCallback( ( e: React.MouseEvent, handleId: string ) => {
        e.stopPropagation();
        e.preventDefault();

        const position = getHandlePosition( handleId );
        onConnectionStart( node.id, handleId, position );
    }, [ onConnectionStart, node.id, getHandlePosition ] );

    // Handle connection end on handles
    const handleConnectionHandleMouseEnter = useCallback( ( e: React.MouseEvent, handleId: string ) => {
        if ( isConnecting ) {
            e.stopPropagation();
            // Visual feedback that this is a valid drop target
            ( e.target as HTMLElement ).style.backgroundColor = '#4caf50';
        }
    }, [ isConnecting ] );

    const handleConnectionHandleMouseLeave = useCallback( ( e: React.MouseEvent ) => {
        // Reset visual feedback
        ( e.target as HTMLElement ).style.backgroundColor = '#2196f3';
    }, [] );

    const handleConnectionHandleMouseUp = useCallback( ( e: React.MouseEvent, handleId: string ) => {
        if ( isConnecting ) {
            e.stopPropagation();
            e.preventDefault();
            onConnectionEnd( node.id, handleId );
        }
    }, [ isConnecting, onConnectionEnd, node.id ] );

    const connectionHandleStyle = {
        position: 'absolute' as const,
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: '#2196f3',
        border: '2px solid white',
        cursor: 'crosshair',
        zIndex: 10,
        opacity: isConnecting ? 1 : 0.8,
        transition: 'all 0.2s ease',
        transform: 'scale(1)',
    };

    const connectionHandleHoverStyle = {
        ...connectionHandleStyle,
        transform: 'scale(1.2)',
        boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
    };

    return (
        <div
            ref={ nodeRef }
            className={ `node ${ isSelected ? 'selected' : '' } ${ isDragging ? 'dragging' : '' } ${ isExecuting ? 'executing' : '' } ${ hasError ? 'error' : '' } ${ isInputNode ? 'input-node' : '' }` }
            style={ {
                position: 'absolute',
                left: node.position.x,
                top: node.position.y,
                width: 200,
                minHeight: 100,
                backgroundColor: isInputNode ? '#e8f5e8' : ( isExecuting ? '#e3f2fd' : hasError ? '#ffebee' : '#f5f5f5' ),
                border: isInputNode ? '2px solid #4caf50' : ( isSelected ? '2px solid #2196f3' : '1px solid #ccc' ),
                borderRadius: '8px',
                padding: '12px',
                cursor: isConnecting ? 'crosshair' : ( isDragging ? 'grabbing' : 'grab' ),
                userSelect: 'none',
                boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.3)' : ( isInputNode ? '0 4px 8px rgba(76, 175, 80, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)' ),
                zIndex: isDragging ? 1000 : isSelected ? 100 : ( isInputNode ? 50 : 1 ),
                transition: isDragging ? 'none' : 'all 0.2s ease',
                transform: isDragging ? 'scale(1.02)' : 'scale(1)',
            } }
            onMouseDown={ handleMouseDown }
        >
            {/* Connection Handles - Only show for input node bottom and regular nodes top */ }
            { isInputNode && (
                <div
                    className="connection-handle"
                    style={ {
                        ...connectionHandleStyle,
                        bottom: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#4caf50',
                    } }
                />
            ) }

            { !isInputNode && (
                <div
                    className="connection-handle"
                    style={ {
                        ...connectionHandleStyle,
                        top: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                    } }
                />
            ) }

            <div className="node-header">
                { isEditing ? (
                    <input
                        type="text"
                        value={ editLabel }
                        onChange={ ( e ) => setEditLabel( e.target.value ) }
                        onBlur={ handleLabelSubmit }
                        onKeyDown={ handleKeyPress }
                        autoFocus
                        style={ {
                            width: '100%',
                            padding: '4px',
                            border: '1px solid #2196f3',
                            borderRadius: '4px',
                            fontSize: '14px',
                        } }
                    />
                ) : (
                    <div
                        className="node-label"
                        onDoubleClick={ handleDoubleClick }
                        style={ {
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            cursor: 'text',
                        } }
                    >
                        { node.data.label }
                    </div>
                ) }
            </div>

            <div className="node-content">
                <textarea
                    value={ node.data.code }
                    onChange={ ( e ) => {
                        dispatch( updateNode( {
                            id: node.id,
                            updates: {
                                data: { ...node.data, code: e.target.value }
                            }
                        } ) );
                    } }
                    placeholder="Enter your code here..."
                    style={ {
                        width: '100%',
                        minHeight: '60px',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        resize: 'vertical',
                    } }
                />
            </div>

            { node.data.output !== undefined && (
                <div className="node-output" style={ { marginTop: '8px', fontSize: '12px' } }>
                    <strong>Output:</strong> { JSON.stringify( node.data.output ) }
                </div>
            ) }

            { hasError && (
                <div className="node-error" style={ { marginTop: '8px', fontSize: '12px', color: '#d32f2f' } }>
                    <strong>Error:</strong> { node.data.errorMessage }
                </div>
            ) }

            { isExecuting && (
                <div className="node-executing" style={ { marginTop: '8px', fontSize: '12px', color: '#1976d2' } }>
                    <strong>Executing...</strong>
                </div>
            ) }
        </div>
    );
};