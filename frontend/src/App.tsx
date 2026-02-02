import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ApiErrorAlert } from "./components/ApiErrorAlert";
import Home from "./pages/Home";

const Room = lazy(() => import("./pages/Room"));

function App() {
  return (
    <>
    <ApiErrorAlert />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/rooms/:id"
        element={
          <Suspense fallback={<div />}>
            <Room />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default App;
