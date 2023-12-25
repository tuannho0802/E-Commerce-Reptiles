import { BrowserRouter, Routes, Route } from "react-router-dom";
import Container from "react-bootstrap/Container";
import HomeScreen from "./screens/HomeScreen";
import ProductScreen from "./screens/ProductScreen";
import CartScreen from "./screens/CartScreen";
import SigninScreen from "./screens/SigninScreen";
import ShippingAddressScreen from "./screens/ShippingAddressScreen";
import SignupScreen from "./screens/SignupScreen";
import PaymentMethodScreen from "./screens/PaymentMethodScreen";
import PlaceOrderScreen from "./screens/PlaceOrderScreen";
import OrderScreen from "./screens/OrderScreen";
import OrderHistoryScreen from "./screens/OrderHistoryScreen";
import UserProfileScreen from "./screens/UserProfileScreen";
import SearchScreen from "./screens/SearchScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardScreen from "./screens/DashboardScreen";
import AdminRoute from "./components/AdminRoute";
import ProductListScreen from "./screens/ProductListScreen";
import ProductEditScreen from "./screens/ProductEditScreen";
import OrderListScreen from "./screens/OrderListScreen";
import UserListScreen from "./screens/UserListScreen";
import UserEditScreen from "./screens/UserEditScreen";
import MapScreen from "./screens/MapScreen";
import ForgetPasswordScreen from "./screens/ForgetPasswordScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import ReptileForum from "./screens/ReptileForum";
import ForumDetail from "./screens/ForumDetail";
import ForumEditScreen from "./screens/ReptileForumEdit";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Sidebar from "./components/Sidebar";
import ScrollToTopButton from "./components/ScrollTop";

function App() {
  return (
    <BrowserRouter>
      <div className="main-container">
        {/* Header */}
        <Header />

        {/* Sidebar*/}
        <div className="content-wrapper">
          <Sidebar />

          {/* Main Component */}
          <main className="page-content">
            <Container>
              {/* User Route */}
              <Routes>
                <Route path="/product/:slug" element={<ProductScreen />} />
                <Route path="/search" element={<SearchScreen />} />
                <Route path="/cart" element={<CartScreen />} />
                <Route path="/signin" element={<SigninScreen />} />
                <Route path="/signup" element={<SignupScreen />} />
                <Route path="/forum" element={<ReptileForum />} />
                <Route path="/forum/:postId" element={<ForumDetail />} />
                <Route
                  path="/forum/edit/:postId"
                  element={
                    <ProtectedRoute>
                      <ForumEditScreen />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/forget-password"
                  element={<ForgetPasswordScreen />}
                />
                <Route
                  path="/reset-password/:token"
                  element={<ResetPasswordScreen />}
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <UserProfileScreen />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/map"
                  element={
                    <ProtectedRoute>
                      <MapScreen />
                    </ProtectedRoute>
                  }
                />
                <Route path="/placeorder" element={<PlaceOrderScreen />} />
                <Route
                  path="/order/:id"
                  element={
                    <ProtectedRoute>
                      <OrderScreen />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mine/orders"
                  element={
                    <ProtectedRoute>
                      <OrderHistoryScreen />
                    </ProtectedRoute>
                  }
                />
                <Route path="/shipping" element={<ShippingAddressScreen />} />
                <Route path="/payment" element={<PaymentMethodScreen />} />

                {/* Admin Route */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <AdminRoute>
                      <DashboardScreen />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <UserListScreen />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <AdminRoute>
                      <ProductListScreen />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/product/:id"
                  element={
                    <AdminRoute>
                      <ProductEditScreen />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <AdminRoute>
                      <OrderListScreen />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/user/:id"
                  element={
                    <AdminRoute>
                      <UserEditScreen />
                    </AdminRoute>
                  }
                />

                <Route path="/" element={<HomeScreen />} />
              </Routes>
            </Container>
          </main>
        </div>
        <ScrollToTopButton />
        {/* Footer */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
