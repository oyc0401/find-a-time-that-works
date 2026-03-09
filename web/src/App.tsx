import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ApiErrorAlert } from "./components/ApiErrorAlert";
import Home from "./pages/page";

const Room = lazy(() => import("./pages/room/page"));
const RecentRooms = lazy(() => import("./pages/recent/page"));

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
      <Route
        path="/recent"
        element={
          <Suspense fallback={<div />}>
            <RecentRooms />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default App;
