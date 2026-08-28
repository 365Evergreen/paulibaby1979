import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "../layouts/AppShell/AppShell";
import HomePage from '../pages/HomePage/HomePage'
import AdminPage from "../pages/AdminPage/AdminPage";
import BlogArchivePage from "../pages/BlogArchivePage/BlogArchivePage";
import SinglePostPage from '../pages/SinglePostPage/SinglePostPage'
import PostEditorPage from '../pages/PostEditorPage/PostEditorPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogArchivePage />} />
          <Route path="/blog/:slug" element={<SinglePostPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/post-editor" element={<PostEditorPage />} />
          <Route path="/post-editor/:id" element={<PostEditorPage/>} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}