import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BlogList from "./pages/BlogList.tsx";
import BlogPost from "./pages/BlogPost.tsx";
import Admin from "./pages/Admin.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BlogList />} />
        <Route path="/post/:slug" element={<BlogPost />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<BlogList />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
