import React, { useState, useCallback } from "react";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import styles from "./styles.module.css";
import FloatingEdge from "./FloatingEdge";

import type {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from "@xyflow/react";

const edgeTypes = {
  floating: FloatingEdge,
};

const initialNodes: Node[] = [
  {
    id: "frontend",
    position: { x: 20, y: 60 },
    data: { label: "Frontend" },
    style: {
      backgroundColor: "#4CAF50",
      color: "white",
      fontWeight: "bold",
      width: 120,
    },
    sourcePosition: Position.Bottom,
  },
  {
    id: "account-api",
    position: { x: 20, y: 200 },
    data: { label: "Account API" },
    style: { backgroundColor: "#2196F3", color: "white", width: 120 },
    sourcePosition: Position.Right,
    targetPosition: Position.Top,
  },
  {
    id: "account-workers",
    position: { x: 20, y: 460 },
    data: { label: "Account Workers" },
    style: { backgroundColor: "#2196F3", color: "white", width: 120 },
    targetPosition: Position.Right,
    sourcePosition: Position.Bottom,
  },
  {
    id: "mq-backbone",
    position: { x: 300, y: 180 },
    data: { label: "Message Queue\nBackbone" },
    style: {
      backgroundColor: "#9C27B0",
      color: "white",
      fontWeight: "bold",
      width: 140,
      height: 250,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
    },
  },
  {
    id: "matchmaking",
    position: { x: 600, y: 280 },
    data: { label: "Matchmaking\nService" },
    style: {
      backgroundColor: "#FF5722",
      color: "white",
      width: 120,
      height: 140,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
    },
    targetPosition: Position.Left,
    sourcePosition: Position.Left,
  },
  {
    id: "game-runtime",
    position: { x: 600, y: 80 },
    data: { label: "Game Runtime\nPool" },
    style: {
      backgroundColor: "#FF5722",
      color: "white",
      width: 120,
      height: 140,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
    },
    targetPosition: Position.Left,
    sourcePosition: Position.Left,
  },
  {
    id: "game-interface",
    position: { x: 320, y: 30 },
    data: { label: "Game Interface\nService" },
    style: { backgroundColor: "#FF5722", color: "white", width: 120 },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
  },
  {
    id: "postgres",
    position: { x: 20, y: 320 },
    data: { label: "PostgresDB" },
    style: { backgroundColor: "#FF9800", color: "white", width: 120 },
  },
];

const initialEdges: Edge[] = [
  // Frontend to Account API
  {
    id: "frontend-account-api",
    source: "frontend",
    target: "account-api",
    animated: true,
    label: "User requests",
    style: { stroke: "#4CAF50" },
  },
  // Account API to MQ - Match messages
  {
    id: "account-api-mq",
    source: "account-api",
    target: "mq-backbone",
    type: "floating",
    animated: true,
    label: "Queue match\nmessages",
    style: { stroke: "#2196F3" },
  },
  // MQ to Matchmaking - Match queues
  {
    id: "mq-matchmaking",
    source: "mq-backbone",
    target: "matchmaking",
    type: "floating",
    animated: true,
    label: "Match queues",
    style: { stroke: "#9C27B0" },
  },
  // Matchmaking back to MQ - Match starting
  {
    id: "matchmaking-mq-start",
    source: "matchmaking",
    target: "mq-backbone",
    type: "floating",
    animated: true,
    label: "Match lobby update\nmessages",
    style: { stroke: "#FF5722" },
    data: { startOffset: -40, endOffset: -40 },
  },
  // Matchmaking to MQ - Account worker notifications
  {
    id: "matchmaking-mq-worker",
    source: "matchmaking",
    target: "mq-backbone",
    type: "floating",
    animated: true,
    label: "Game starting\nnotifications",
    style: { stroke: "#FF5722", strokeDasharray: "5 5" },
    data: { startOffset: 40, endOffset: 40 },
  },
  // MQ to Game Runtime - Game start messages
  {
    id: "mq-game-runtime",
    source: "mq-backbone",
    target: "game-runtime",
    type: "floating",
    animated: true,
    label: "Game start\nmessages",
    style: { stroke: "#9C27B0" },
    data: { startOffset: -20, endOffset: 30 },
  },
  // Game Runtime to Game Interface - Game state updates
  {
    id: "game-runtime-interface",
    source: "game-runtime",
    target: "game-interface",
    type: "floating",
    animated: true,
    label: "Game state\nchanges",
    style: { stroke: "#FF5722" },
    data: { startOffset: -20, endOffset: -20 },
  },
  // Frontend to Game Interface - WebSocket
  {
    id: "frontend-game-interface",
    target: "frontend",
    source: "game-interface",
    animated: true,
    label: "WebSocket\nactions/updates",
    type: "floating",
    style: { stroke: "#4CAF50", strokeDasharray: "10 5" },
  },
  // Game Runtime back to MQ - Update messages
  {
    id: "game-runtime-mq-updates",
    source: "game-runtime",
    target: "mq-backbone",
    type: "floating",
    animated: true,
    label: "Result/ranking\nupdates",
    style: { stroke: "#FF5722" },
    data: { startOffset: -30, endOffset: -70 },
  },
  // MQ to Account Workers - Update messages
  {
    id: "mq-account-workers",
    source: "mq-backbone",
    target: "account-workers",
    type: "floating",
    animated: true,
    label: "Account and Lobby\nupdates",
    style: { stroke: "#9C27B0" },
  },
  // Account API to DB
  {
    id: "account-api-db",
    source: "account-api",
    target: "postgres",
    type: "floating",
    animated: true,
    label: "Account and Match data",
    style: { stroke: "#2196F3" },
  },
  // Account Workers to DB
  {
    id: "account-workers-db",
    source: "account-workers",
    target: "postgres",
    type: "floating",
    animated: true,
    label: "Account and Match data",
    style: { stroke: "#2196F3" },
  },
];

export default function MicroserviceDiagram() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  return (
    <div className={styles.diagramContainer}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        edgeTypes={edgeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={"dots" as any} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
