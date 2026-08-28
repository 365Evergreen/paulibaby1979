import {BrowserRouter, Route, Routes} from 'react-router-dom';
import AppShell from '../layouts/AppShell/AppShell';
import HomePage from '../pages/HomePage/HomePage';
import AdminPage from '../pages/AdminPage/AdminPage'
import BlogArchivePAge from '../pages/BlogArchivePage/BlogArchivePage'


export default function AppRouter() {   
    return (
        <BrowserRouter>
         
                <Routes>
                    <Route element={<AppShell />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/admin" element={<AdminPage/>}/>
                    <Route path="/archive" element={<BlogArchivePAge/>}/>
                
                    </Route>
                </Routes>
           
        </BrowserRouter>
    );
}
