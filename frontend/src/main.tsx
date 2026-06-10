import { LazyMotion } from "framer-motion";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Animation features load in parallel with the first paint; `strict` guards
// against accidental `motion.*` imports that would re-bundle the full engine.
const loadMotionFeatures = () =>
  import("./motionFeatures").then((mod) => mod.default);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LazyMotion features={loadMotionFeatures} strict>
      <App />
    </LazyMotion>
  </React.StrictMode>,
);
