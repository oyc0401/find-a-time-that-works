import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
// import TestMain from "./pages/TestMain";
// import TestRoom from "./pages/TestRoom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="*" element={<Navigate to="/test" replace />} />
    </Routes>
  );
}

export default App;
