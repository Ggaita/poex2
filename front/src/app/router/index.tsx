import { Routes, Route } from "react-router-dom";
import HomePage from "../../pages/Home/HomePage";
import SearchPage from "../../pages/SearPage/SearchPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
    </Routes>
  );
}