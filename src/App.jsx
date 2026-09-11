import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import AdminDashboard from "./pages/AdminDashboard";
import AdminCreateEvent from "./pages/AdminCreateEvent";
import AdminEventDetails from "./pages/AdminEventDetails";
import PublicEvent from "./pages/PublicEvent";
import ParticipantRegistration from "./pages/ParticipantRegistration";

import "./App.css";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={
            <Navigate
              to="/admin"
              replace
            />
          }
        />

        <Route
          path="/admin"
          element={
            <AdminDashboard />
          }
        />

        <Route
          path="/admin/create"
          element={
            <AdminCreateEvent />
          }
        />

        <Route
          path="/admin/event/:eventId"
          element={
            <AdminEventDetails />
          }
        />

        <Route
          path="/event/:eventId"
          element={
            <PublicEvent />
          }
        />

        <Route
          path="/event/:eventId/register"
          element={
            <ParticipantRegistration />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;