import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import Services from "./pages/Services";
import Appointments from "./pages/Appointments";
import AppointmentBooking from "./pages/AppointmentBooking";
import Contact from "./pages/Contact";
import Doctors from "./pages/Doctors";
import PatientPortal from "./pages/PatientPortal";
import DoctorPortal from "./pages/DoctorPortal";
import SignIn from "./pages/SignIn";
import PatientSignUp from "./pages/PatientSignUp";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminLogin from "./pages/admin/Login";
import NotFound from "./pages/NotFound";
import ServicesManagement from "./pages/admin/ServicesManagement";
import PatientsManagement from "./pages/admin/PatientsManagement";
import ScrollToTop from "./components/atoms/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<Services />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/appointment-booking" element={<AppointmentBooking />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/patient-portal" element={<PatientPortal />} />
            <Route path="/doctor-portal" element={<DoctorPortal />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/patient-signup" element={<PatientSignUp />} />
            <Route path="/signup" element={<PatientSignUp />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/services" element={<ServicesManagement />} />
            <Route path="/admin/patients" element={<PatientsManagement />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
