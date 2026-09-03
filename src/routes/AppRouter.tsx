import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "../layouts/AppShell/AppShell";
import ContentPageShell from "../layouts/ContentPageShell/ContentPageShell";
import EditorShell from "../layouts/EditorShell/EditorShell";
import HomePage from '../pages/HomePage/HomePage';
import AdminPage from "../pages/AdminPage/AdminPage";
import BlogArchivePage from "../pages/BlogArchivePage/BlogArchivePage";
import SinglePostPage from '../pages/SinglePostPage/SinglePostPage';
import PostEditorPage from '../pages/PostEditorPage/PostEditorPage';
import MediaLibraryPage from "../pages/MediaLibraryPage/MediaLibraryPage";
import MusicPage from "../pages/MusicPage/MusicPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main App Layout */}
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
        </Route>

        {/* Content Pages Layout */}
        <Route element={<ContentPageShell />}>
          <Route path="/blog" element={<BlogArchivePage />} />
          <Route path="/music" element={<MusicPage />} />
          <Route path="/blog/:slug" element={<SinglePostPage />} />
        </Route>

        {/* Editor & Admin Layout */}
        <Route element={<EditorShell />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/post-editor" element={<PostEditorPage />} />
          <Route path="/post-editor/:id" element={<PostEditorPage />} />
          <Route path="/media-library" element={<MediaLibraryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
