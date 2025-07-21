import React from 'react';
import {
  getBezierPath,
  useInternalNode,
  EdgeProps,
  EdgeLabelRenderer,
  BaseEdge,
} from '@xyflow/react';
import { getEdgeParams } from './edgeUtils';

interface FloatingEdgeProps extends EdgeProps {
  id: string;
  source: string;
  target: string;
  markerEnd?: string;
  style?: React.CSSProperties;
  label?: string;
  animated?: boolean;
  startOffset?: number;
  endOffset?: number;
}

function FloatingEdge({
  id,
  source,
  target,
  markerEnd,
  style,
  label,
  animated,
  data,
}: FloatingEdgeProps) {
  const startOffset = (data?.startOffset as number) || 0;
  const endOffset = (data?.endOffset as number) || 0;
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

  // Apply offsets to create parallel edges
  const offsetSx = sx;
  const offsetSy = sy + startOffset;
  const offsetTx = tx;
  const offsetTy = ty + endOffset;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: offsetSx,
    sourceY: offsetSy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: offsetTx,
    targetY: offsetTy,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={style}
        className={animated ? 'react-flow__edge-path animated' : 'react-flow__edge-path'}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: '12px',
              pointerEvents: 'all',
              whiteSpace: 'pre-line',
              textAlign: 'center',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default FloatingEdge;
