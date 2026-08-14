import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "../layouts/AppShell";
import HomePage from '../pages/HomePage/HomePage'
import Admin from "../pages/Admin";
import BlogList from "../pages/BlogList";

export default function AppRouter() {
  return (
     <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/blog" element={<BlogList />} />
          <Route path="/admin" element={<Admin/>}/>
          <Route path="/" element={<HomePage />} />
 
        </Route>
      </Routes>
    </BrowserRouter>
  );
}