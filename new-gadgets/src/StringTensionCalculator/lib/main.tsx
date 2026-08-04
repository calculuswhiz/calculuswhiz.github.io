import * as ReactDOM from "react-dom/client";
import "../../standard.css";

export interface MaterialRegressionEntry {
  /** The quadratic term */
  a: number;
  /** The linear term */
  b: number;
  /** R^2 value */
  rSq: number;
  /** Material description*/
  description: string;
}

import { AppInfo, AppRoot } from "./Components";

// HTTPS required for uuid generation
if (location.hostname !== 'localhost' && location.protocol !== "https:") {
  location.protocol = "https:";
}

document.addEventListener('DOMContentLoaded', () => {
  const app = ReactDOM.createRoot(document.getElementById('root')!);
  app.render(
    <>
      <AppInfo />
      <hr />
      <AppRoot />
    </>
  );
});