import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "rxdb-hooks";
import { App } from "./App";
import { getDb, MyDatabase } from "./lib/db";
import "./styles.css";

function Root() {
  const [db, setDb] = useState<MyDatabase | null>(null);
  
  useEffect(() => {
    getDb().then(setDb);
  }, []);

  if (!db) {
    return <div style={{ padding: 20 }}>Initializing secure database...</div>;
  }

  return (
    <Provider db={db}>
      <App />
    </Provider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}service-worker.js`)
      .catch(() => undefined);
  });
}
