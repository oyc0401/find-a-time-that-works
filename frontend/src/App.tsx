import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import TestMain from "./pages/TestMain";
import TestRoom from "./pages/TestRoom";

function App() {
  return (
    <TDSMobileAITProvider>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/test" element={<TestMain />} />
      <Route path="/test/room" element={<TestRoom />} />
      <Route path="*" element={<Navigate to="/test" replace />} />
    </Routes>
    </TDSMobileAITProvider>
  );
}

export default App;
