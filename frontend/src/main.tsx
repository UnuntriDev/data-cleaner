import { LazyMotion } from "framer-motion";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// `strict` catches accidental motion.* imports that would re-bundle everything
const loadMotionFeatures = () =>
  import("./motionFeatures").then((mod) => mod.default);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LazyMotion features={loadMotionFeatures} strict>
      <App />
    </LazyMotion>
  </React.StrictMode>,
);
