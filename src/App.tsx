import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./store/AppContext";
import BottomNav from "./components/BottomNav";
import CitizenHome from "./pages/CitizenHome";
import MapPage from "./pages/MapPage";
import ReportPage from "./pages/ReportPage";
import AuthorityDashboard from "./pages/AuthorityDashboard";
import ToiletProfile from "./pages/ToiletProfile";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WithNav><CitizenHome /></WithNav>} />
          <Route path="/map" element={<WithNav><MapPage /></WithNav>} />
          <Route path="/report" element={<WithNav><ReportPage /></WithNav>} />
          <Route path="/authority" element={<WithNav><AuthorityDashboard /></WithNav>} />
          <Route path="/toilet/:id" element={<WithNav><ToiletProfile /></WithNav>} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

function WithNav({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
