import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Room from "./pages/Room";
import TestHome from "./pages/test/TestHome";
import TestRoom from "./pages/test/TestRoom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/rooms/:id" element={<Room />} />
      <Route path="/test" element={<TestHome />} />
      <Route path="/test/room" element={<TestRoom />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
