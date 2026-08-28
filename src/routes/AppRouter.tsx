import {BrowserRouter, Route, Routes} from 'react-router-dom';
import AppShell from '../layouts/AppShell/AppShell';
import HomePage from '../pages/HomePage/HomePage';
import AdminPage from '../pages/AdminPage/AdminPage'
import BlogArchivePage from '../pages/BlogArchivePage/BlogArchivePage'
import PostEditorPage from '../pages/PostEditorPage/PostEditorPage'
import SinglePostPage from '../pages/SinglePostPage/SinglePostPage'


export default function AppRouter() {   
    return (
        <BrowserRouter>
         
                <Routes>
                    <Route element={<AppShell />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/admin" element={<AdminPage/>}/>
                    <Route path="/archive" element={<BlogArchivePage/>}/>
                    <Route path="/editor" element={<PostEditorPage/>}/>
                    <Route path="/post"element={<SinglePostPage/>}/>
                
                    </Route>
                </Routes>
           
        </BrowserRouter>
    );
}
