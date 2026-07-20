import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { RiskMonitoring } from "./pages/RiskMonitoring";
import { ErpImpact } from "./pages/ErpImpact";
import { DataManagement } from "./pages/DataManagement";
import { Briefing } from "./pages/Briefing";
import { Placeholder } from "./pages/Placeholder";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/risk-monitoring" element={<RiskMonitoring />} />
          <Route path="/erp-impact" element={<ErpImpact />} />
          <Route path="/data-management" element={<DataManagement />} />
          <Route path="/briefing" element={<Briefing />} />
          <Route path="*" element={<Placeholder />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
