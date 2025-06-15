"use client";
import React, { useState } from "react";
import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
import { DialogTrigger } from "@radix-ui/react-dialog";
import AuthDialogContent from "./AuthDialogContent";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/stores/adminStore";
import { IMAGE_LINKS } from "@/assets/imageLinks";
import { useCustomerCareStore } from "@/stores/customerCareStore";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Heart,
  Leaf,
  ShieldCheck,
  Timer,
  Users,
} from "lucide-react";

const AboutUsPage = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const adminZ = useAdminStore((state) => state.user);
  const customerCareZ = useCustomerCareStore((state) => state.user);
  const logout = useAdminStore((state) => state.logout);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-2xl md:text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-primary">FlashFood, Admin</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Whatever you want, wherever you want it.
          </p>
          <div className="flex justify-center gap-4">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Get Started <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </DialogTrigger>
              <AuthDialogContent onClose={() => setOpen(false)} />
            </Dialog>
          </div>
        </motion.div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-gray-600 mb-4">
                Founded in late 2024, FlashFood has quickly grown into a
                movement dedicated to reducing food waste while making quality
                meals accessible to everyone.
              </p>
              <p className="text-gray-600 mb-6">
                We've partnered with hundreds of local restaurants and grocery
                stores to rescue surplus food, creating a win-win situation for
                businesses, consumers, and the environment.
              </p>
              <Button variant="outline" size="lg">
                Join Our Mission <Users className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                  alt="Food delivery"
                  className="object-cover w-full h-full"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUsPage;
