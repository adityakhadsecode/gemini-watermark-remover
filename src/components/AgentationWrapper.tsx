"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const AgentationComponent = dynamic(
  () => import("agentation").then((mod) => mod.Agentation),
  { ssr: false }
);

export function AgentationWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || process.env.NODE_ENV === "production") {
    return null;
  }

  // Connect to the local Agentation MCP server on port 4747
  return <AgentationComponent endpoint="http://localhost:4747" />;
}
