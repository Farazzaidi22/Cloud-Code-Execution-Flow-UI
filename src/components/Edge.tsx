import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import type { Edge as EdgeType } from '../store/flowSlice';

interface EdgeProps {
    edge: EdgeType;
}

export const Edge: React.FC<EdgeProps> = ( { edge } ) => {
    const nodes = useSelector( ( state: RootState ) => state.flow.nodes );
    const executionPath = useSelector( ( state: RootState ) => state.flow.executionPath );

    const sourceNode = nodes.find( n => n.id === edge.source );
    const targetNode = nodes.find( n => n.id === edge.target );

    if ( !sourceNode || !targetNode ) {
        return null;
    }

    // Calculate connection points based on handles
    const getHandlePosition = ( node: typeof sourceNode, handle: string | undefined, isSource: boolean ) => {
        if ( !node ) return { x: 0, y: 0 };

        const nodeWidth = 200;
        const nodeHeight = 100; // This should match your node's actual height

        switch ( handle ) {
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
                // Default behavior: source from right, target from left
                if ( isSource ) {
                    return {
                        x: node.position.x + nodeWidth,
                        y: node.position.y + nodeHeight / 2
                    };
                } else {
                    return {
                        x: node.position.x,
                        y: node.position.y + nodeHeight / 2
                    };
                }
        }
    };

    const sourcePos = getHandlePosition( sourceNode, edge.sourceHandle, true );
    const targetPos = getHandlePosition( targetNode, edge.targetHandle, false );

    // Create a curved path
    const dx = targetPos.x - sourcePos.x;
    const dy = targetPos.y - sourcePos.y;

    // Determine curve direction based on handle positions
    let controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y;

    if ( edge.sourceHandle === 'right' || ( !edge.sourceHandle && dx > 0 ) ) {
        // Horizontal curve (right to left)
        controlPoint1X = sourcePos.x + Math.abs( dx ) * 0.5;
        controlPoint1Y = sourcePos.y;
        controlPoint2X = targetPos.x - Math.abs( dx ) * 0.5;
        controlPoint2Y = targetPos.y;
    } else if ( edge.sourceHandle === 'left' ) {
        // Reverse horizontal curve (left to right)
        controlPoint1X = sourcePos.x - Math.abs( dx ) * 0.5;
        controlPoint1Y = sourcePos.y;
        controlPoint2X = targetPos.x + Math.abs( dx ) * 0.5;
        controlPoint2Y = targetPos.y;
    } else if ( edge.sourceHandle === 'top' || edge.sourceHandle === 'bottom' ) {
        // Vertical curve
        controlPoint1X = sourcePos.x;
        controlPoint1Y = sourcePos.y + ( edge.sourceHandle === 'top' ? -Math.abs( dy ) * 0.5 : Math.abs( dy ) * 0.5 );
        controlPoint2X = targetPos.x;
        controlPoint2Y = targetPos.y + ( edge.targetHandle === 'bottom' ? Math.abs( dy ) * 0.5 : -Math.abs( dy ) * 0.5 );
    } else {
        // Default smooth curve
        controlPoint1X = sourcePos.x + dx * 0.5;
        controlPoint1Y = sourcePos.y;
        controlPoint2X = sourcePos.x + dx * 0.5;
        controlPoint2Y = targetPos.y;
    }

    const pathData = `M ${ sourcePos.x } ${ sourcePos.y } C ${ controlPoint1X } ${ controlPoint1Y } ${ controlPoint2X } ${ controlPoint2Y } ${ targetPos.x } ${ targetPos.y }`;

    const isInExecutionPath = executionPath.includes( edge.source ) && executionPath.includes( edge.target );
    const isActive = isInExecutionPath && executionPath.indexOf( edge.source ) + 1 === executionPath.indexOf( edge.target );

    return (
        <svg
            style={ {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1,
            } }
        >
            <defs>
                <marker
                    id={ `arrowhead-${ edge.id }` }
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                >
                    <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill={ isActive ? '#2196f3' : '#666' }
                    />
                </marker>
            </defs>

            <path
                d={ pathData }
                stroke={ isActive ? '#2196f3' : '#666' }
                strokeWidth={ isActive ? '3' : '2' }
                fill="none"
                markerEnd={ `url(#arrowhead-${ edge.id })` }
                style={ {
                    transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
                } }
            />
        </svg>
    );
};