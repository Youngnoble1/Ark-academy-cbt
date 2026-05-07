import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { doc, getDocFromServer } from "firebase/firestore";
import App from "./App.tsx";
import "./index.css";
import { db } from "./lib/firebase";

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
