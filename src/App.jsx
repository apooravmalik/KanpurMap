import { Routes, Route } from 'react-router-dom';
import KanpurMap from './MapComponents/kanpurMap'; // Adjust path if needed
import './App.css';
import 'leaflet/dist/leaflet.css';

function App() {
  return (
    <Routes>
      {/* This route handles URLs with layer parameters, e.g., /0,1,25 */}
      <Route path="/:layers" element={<KanpurMap />} />

      {/* This route handles the base URL and shows the default map */}
      <Route path="/" element={<KanpurMap />} />
    </Routes>
  );
}

export default App;