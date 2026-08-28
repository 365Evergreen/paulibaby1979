<<<<<<< HEAD
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import AppShell from '../layouts/AppShell/AppShell';
import HomePage from '../pages/HomePage/HomePage';


export default function AppRouter() {   
    return (
        <BrowserRouter>
         
                <Routes>
                    <Route element={<AppShell />}>
                    <Route path="/" element={<HomePage />} />
                
                    </Route>
                </Routes>
           
        </BrowserRouter>
    );
=======
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "../layouts/AppShell";
import HomePage from '../pages/HomePage/HomePage'
import AdminPage from "../pages/AdminPage/AdminPage";
import BlogArchivePage from "../pages/BlogArchivePage/BlogArchivePage";
import SinglePostPage from '../pages/SinglePostPage/SinglePostPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogArchivePage />} />
          <Route path="/blog/:slug" element={<SinglePostPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
>>>>>>> 59aabae71b4359f0bf4cefe3869c50fefbbb9dab
}
