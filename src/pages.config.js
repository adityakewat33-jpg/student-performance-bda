import Layout from './Layout.jsx';
import Home from './pages/Home.jsx';
import StudentAnalysis from './pages/StudentAnalysis.jsx';
import PerformanceTrends from './pages/PerformanceTrends.jsx';
import StudentSearch from './pages/StudentSearch.jsx';
import AboutProject from './pages/AboutProject.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import StudentList from './pages/admin/students/List.jsx';
import StudentCreate from './pages/admin/students/Create.jsx';
import StudentEdit from './pages/admin/students/Edit.jsx';
import StudentDetail from './pages/admin/students/Detail.jsx';
import UploadDataset from './pages/UploadDataset.jsx';
import UsersList from './pages/admin/users/List.jsx';
import RolesList from './pages/admin/roles/List.jsx';
import PermissionsList from './pages/admin/permissions/List.jsx';
import AIFlowSettings from './pages/admin/AIFlowSettings.jsx';
export const PAGES = {
  Home,
  analysis: StudentAnalysis,
  trends: PerformanceTrends,
  search: StudentSearch,
  upload: UploadDataset,
  about: AboutProject,
};
export const ADMINS = {
  Dashboard,
  students: StudentList,
  'students/new': StudentCreate,
  'students/:id': StudentDetail,
  'students/:id/edit': StudentEdit,
  upload: UploadDataset,
  users: UsersList,
  roles: RolesList,
  permissions: PermissionsList,
  'ai-settings': AIFlowSettings,
};
export const PRIVATE_PAGES = {};
export const pagesConfig = {
  privatePages: PRIVATE_PAGES,
  mainPage: 'Home',
  Pages: PAGES,
  Layout: Layout,
  Admins: ADMINS,
  adminMainPage: 'Dashboard',
  AdminLayout: AdminLayout,
};