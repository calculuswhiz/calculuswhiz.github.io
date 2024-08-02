import * as ReactDOM from "react-dom/client";

import './styles.scss';
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