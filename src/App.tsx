import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { RequireAuth } from './components/ProtectedRoute';
import { Spinner } from './components/ui';
import Home from './pages/Home';
import Destinations from './pages/Destinations';
import DestinationDetail from './pages/DestinationDetail';
import Booking from './pages/Booking';
import Packages from './pages/Packages';
import { ForgotPassword, Login, ResetPassword, Signup } from './pages/Auth';
import { MyBookings, ProfilePage } from './pages/Account';
import { About, Contact } from './pages/Static';

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const S = {
  Destinations: lazy(() => import('./pages/admin/Sections').then((m) => ({ default: m.Destinations }))),
  Attractions: lazy(() => import('./pages/admin/Sections').then((m) => ({ default: m.Attractions }))),
  Products: lazy(() => import('./pages/admin/Sections').then((m) => ({ default: m.Products }))),
  Bookings: lazy(() => import('./pages/admin/Sections').then((m) => ({ default: m.Bookings }))),
  Users: lazy(() => import('./pages/admin/Sections').then((m) => ({ default: m.UsersAdmin }))),
  Gallery: lazy(() => import('./pages/admin/Sections').then((m) => ({ default: m.Gallery }))),
  Videos: lazy(() => import('./pages/admin/Sections').then((m) => ({ default: m.Videos }))),
  Reviews: lazy(() => import('./pages/admin/Sections').then((m) => ({ default: m.Reviews }))),
  Packages: lazy(() => import('./pages/admin/Sections').then((m) => ({ default: m.Packages }))),
  Messages: lazy(() => import('./pages/admin/Sections').then((m) => ({ default: m.Messages }))),
  Reports: lazy(() => import('./pages/admin/Sections').then((m) => ({ default: m.Reports }))),
  Content: lazy(() => import('./pages/admin/Sections').then((m) => ({ default: m.WebsiteContent }))),
  Settings: lazy(() => import('./pages/admin/Sections').then((m) => ({ default: m.SettingsPage }))),
  Security: lazy(() => import('./pages/admin/Sections').then((m) => ({ default: m.Security }))),
};
import { Guard, NAV } from './pages/admin/AdminLayout';
const rolesFor = (to: string) => NAV.find((n) => n.to === to)!.roles;
const G = ({ to, children }: { to: string; children: React.ReactNode }) => <Guard roles={rolesFor(to)}>{children}</Guard>;

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-40"><Spinner /></div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="destinations" element={<Destinations />} />
          <Route path="destinations/:slug" element={<DestinationDetail />} />
          <Route path="packages" element={<Packages />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="book/:slug" element={<Booking />} />
          <Route path="my-bookings" element={<RequireAuth><MyBookings /></RequireAuth>} />
          <Route path="profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="*" element={<div className="section pt-40 text-center"><h1 className="h2">Page not found</h1></div>} />
        </Route>
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="destinations" element={<G to="/admin/destinations"><S.Destinations /></G>} />
          <Route path="attractions" element={<G to="/admin/attractions"><S.Attractions /></G>} />
          <Route path="products" element={<G to="/admin/products"><S.Products /></G>} />
          <Route path="bookings" element={<G to="/admin/bookings"><S.Bookings /></G>} />
          <Route path="users" element={<G to="/admin/users"><S.Users /></G>} />
          <Route path="gallery" element={<G to="/admin/gallery"><S.Gallery /></G>} />
          <Route path="videos" element={<G to="/admin/videos"><S.Videos /></G>} />
          <Route path="reviews" element={<G to="/admin/reviews"><S.Reviews /></G>} />
          <Route path="packages" element={<G to="/admin/packages"><S.Packages /></G>} />
          <Route path="messages" element={<G to="/admin/messages"><S.Messages /></G>} />
          <Route path="reports" element={<G to="/admin/reports"><S.Reports /></G>} />
          <Route path="content" element={<G to="/admin/content"><S.Content /></G>} />
          <Route path="settings" element={<G to="/admin/settings"><S.Settings /></G>} />
          <Route path="security" element={<G to="/admin/security"><S.Security /></G>} />
        </Route>
      </Routes>
    </Suspense>
  );
}
