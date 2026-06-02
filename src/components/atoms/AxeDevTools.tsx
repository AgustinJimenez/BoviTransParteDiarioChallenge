"use client";

import { useEffect } from "react";

const AxeDevTools = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      Promise.all([
        import("@axe-core/react"),
        import("react"),
        import("react-dom"),
      ]).then(([axe, React, ReactDOM]) => {
        axe.default(React.default, ReactDOM.default, 1000);
      });
    }
  }, []);

  return null;
}

export default AxeDevTools;
