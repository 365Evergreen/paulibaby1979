import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "../layouts/AppShell";
import Admin from "../pages/Admin";
import BlogList from "../pages/BlogList";
export default function AppRouter() {
  return (
     <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/blog" element={<BlogList />} />

          <Route path="/" element={<Admin />} />
 
        </Route>
      </Routes>
    </BrowserRouter>
  );
}