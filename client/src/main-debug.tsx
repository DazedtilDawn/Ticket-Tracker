console.log("[DEBUG] Starting main-debug.tsx");

export {}; // Make this file a module

try {
  console.log("[DEBUG] Importing React DOM");
  const { createRoot } = await import("react-dom/client");
  
  console.log("[DEBUG] Creating simple component");
  const SimpleApp = () => {
    console.log("[DEBUG] SimpleApp rendering");
    return (
      <div style={{ padding: "20px" }}>
        <h1>Debug Mode</h1>
        <p>React is working!</p>
        <p>Time: {new Date().toLocaleTimeString()}</p>
      </div>
    );
  };

  console.log("[DEBUG] Getting root element");
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("[DEBUG] Root element not found!");
    document.body.innerHTML = "<h1>Root element not found!</h1>";
  } else {
    console.log("[DEBUG] Creating React root");
    const root = createRoot(rootElement);
    console.log("[DEBUG] Rendering app");
    root.render(<SimpleApp />);
    console.log("[DEBUG] App rendered successfully");
  }
} catch (error) {
  console.error("[DEBUG] Error in main-debug:", error);
  document.body.innerHTML = `<h1>Error: ${(error as Error).message}</h1>`;
}