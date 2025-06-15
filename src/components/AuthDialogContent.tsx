"use client";
import React, { useState } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/lib/axios";
import { useRouter } from "next/navigation"; // Thêm useRouter

import { jwtDecode } from "jwt-decode";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminUser, useAdminStore } from "@/stores/adminStore";
import {
  CustomerCareUser,
  useCustomerCareStore,
} from "@/stores/customerCareStore";

interface AuthDialogContentProps {
  onClose: () => void; // Prop để đóng dialog
}

const AuthDialogContent = ({ onClose }: AuthDialogContentProps) => {
  const router = useRouter(); // Khởi tạo router

  const [isLogin, setIsLogin] = useState(true); // State để switch giữa Login và Signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null); // State để hiển thị lỗi
  const [userType, setUserType] = useState<string>(""); // State để lưu giá trị từ Select
  const setAdminUser = useAdminStore((state) => state.setUser); // Từ admin store
  const setCustomerCareUser = useCustomerCareStore((state) => state.setUser); // Từ customer care store

  const handleLogin = async () => {
    setError(null);

    if (!email || !password) {
      setError("Email and Password cannot be empty");
      return;
    }
    if (!userType) {
      setError("Please select a user type");
      return;
    }

    let endpoint = "";
    switch (userType) {
      case "SUPER_ADMIN":
        endpoint = "/auth/login-super-admin";
        break;
      case "COMPANION_ADMIN":
        endpoint = "/auth/login-companion-admin";
        break;
      case "FINANCE_ADMIN":
        endpoint = "/auth/login-finance-admin";
        break;
      case "CUSTOMER_CARE":
        endpoint = "/auth/login-customer-care";
        break;
      default:
        setError("Invalid user type selected");
        return;
    }

    try {
      const response = await axiosInstance.post(
        endpoint,
        {
          email,
          password,
          type: userType,
        },
        {
          validateStatus: () => true,
        }
      );

      if (response.data.EC === 0) {
        console.log("Login successful:", response.data);

        const accessToken = response.data.data.access_token;
        localStorage.setItem("access_token", accessToken);

        // Decode JWT
        const decodedToken = jwtDecode(accessToken);

        // Kiểm tra vai trò và set vào store tương ứng
        if (decodedToken.logged_in_as === "CUSTOMER_CARE_REPRESENTATIVE") {
          const customerCareUser = decodedToken as CustomerCareUser;
          setCustomerCareUser({
            ...customerCareUser,
            accessToken: accessToken,
          });
        } else {
          const adminUser = decodedToken as AdminUser;
          setAdminUser({ ...adminUser, accessToken: accessToken });
        }

        router.push("/");
        onClose();
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An unexpected error occurred during login");
    }
  };

  const handleSignup = async () => {
    // Reset error trước khi gọi API
    setError(null);

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      setError("All fields are required for signup");
      return;
    }
    if (!userType) {
      setError("Please select a user type");
      return;
    }

    // Xác định endpoint dựa trên userType
    let endpoint = "";
    switch (userType) {
      case "SUPER_ADMIN":
        endpoint = "/auth/register-super-admin";
        break;
      case "COMPANION_ADMIN":
        endpoint = "/auth/register-companion-admin";
        break;
      case "FINANCE_ADMIN":
        endpoint = "/auth/register-finance-admin";
        break;
      case "CUSTOMER_CARE":
        endpoint = "/auth/register-customer-care";
        break;
      default:
        setError("Invalid user type selected");
        return;
    }

    try {
      const response = await axiosInstance.post(
        endpoint,
        {
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          type: userType,
        },
        {
          validateStatus: () => true,
        }
      );

      // Kiểm tra response từ API
      if (response.data.EC === 0) {
        console.log("Signup successful:", response.data);
        // Reset form và chuyển về login
        setIsLogin(true);
        setEmail("");
        setPassword("");
        setFirstName("");
        setLastName("");
        setUserType(""); // Reset userType
        // Đóng dialog
        onClose();
      } else {
        setError(response.data.message || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError("An unexpected error occurred during signup");
    }
  };

  return (
    <DialogContent className="w-[600px] max-w-[90vw] p-0 overflow-hidden rounded-lg">
      {/* Main container với grid 2 cột */}
      <div className="grid grid-cols-2">
        {/* Bên trái: Background gradient */}
        <div className="bg-gradient-to-r from-primary-200 to-primary-400 flex items-center justify-center h-full">
          <div className="text-white text-center">
            <h2 className="text-2xl font-bold">
              {isLogin ? "FlashFood" : "Create an Account"}
            </h2>
            <p className="mt-2">
              {isLogin
                ? "Sign in to continue your journey."
                : "Sign up to start exploring!"}
            </p>
          </div>
        </div>

        {/* Bên phải: Form */}
        <div className="bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isLogin ? "Sign In" : "Sign Up"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {isLogin
                ? "Enter your credentials to sign in."
                : "Fill in the details to create your account."}
            </DialogDescription>
          </DialogHeader>

          {/* Hiển thị lỗi nếu có */}
          {error && <p className="text-sm text-danger-500 mb-4">{error}</p>}

          {/* Form */}
          <div className="grid gap-4 py-4">
            {/* Nếu là Sign Up, thêm field Name */}
            {!isLogin && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="first_name" className="text-right">
                    First Name
                  </Label>
                  <Input
                    id="first_name"
                    placeholder="Tommy"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="col-span-3 border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="last_name" className="text-right">
                    Last Name
                  </Label>
                  <Input
                    id="last_name"
                    placeholder="Morn"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="col-span-3 border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3 border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3 border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <p className="text-sm text-gray-600 w-full self-end mb-4">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <span
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary-500 hover:text-primary-600 cursor-pointer underline"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </span>
          </p>

          {/* Footer: Select và Nút Submit */}
          <DialogFooter className="w-full flex flex-col gap-4">
            <Select onValueChange={(value) => setUserType(value)}>
              <SelectTrigger className="">
                <SelectValue placeholder="Login as" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>User type:</SelectLabel>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="COMPANION_ADMIN">
                    Companion Admin
                  </SelectItem>
                  <SelectItem value="FINANCE_ADMIN">Finance Admin</SelectItem>
                  <SelectItem value="CUSTOMER_CARE">Customer Care</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              onClick={isLogin ? handleLogin : handleSignup}
              type="submit"
              className="bg-primary-500 hover:bg-primary-600 text-white w-full"
            >
              {isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </DialogFooter>
        </div>
      </div>
    </DialogContent>
  );
};

export default AuthDialogContent;
