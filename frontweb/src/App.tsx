import { Navigate, Route, Routes } from "react-router-dom";
import TestHome from "./pages/TestHome";
import TestRoom from "./pages/TestRoom";

export default function App() {
  return (
    <Routes>
      <Route path="/test" element={<TestHome />} />
      <Route path="/test/room" element={<TestRoom />} />
      <Route path="*" element={<Navigate to="/test" replace />} />
    </Routes>
  );
}
