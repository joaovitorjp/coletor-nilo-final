import { Route, Routes } from "react-router-dom";

import Coleta from "./pages/Coleta";
import Dados from "./pages/Dados";
import Historico from "./pages/Historico";
import Home from "./pages/Home";
import Lista from "./pages/Lista";
import NotFound from "./pages/NotFound";
import Resumo from "./pages/Resumo";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/coleta/:id" element={<Coleta />} />
      <Route path="/coleta/:id/resumo" element={<Resumo />} />
      <Route path="/historico" element={<Historico />} />
      <Route path="/lista" element={<Lista />} />
      <Route path="/dados" element={<Dados />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
