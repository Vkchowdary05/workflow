import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import BuilderPage from './pages/BuilderPage';
import WorkflowsPage from './pages/WorkflowsPage';
import NavStrip from './components/NavStrip';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <NavStrip />
        <div className="main-area">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/builder" element={<BuilderPage />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
            <Route path="/new" element={<UploadPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
