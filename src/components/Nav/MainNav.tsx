"use client";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "../ui/button";
import AuthDialogContent from "../AuthDialogContent";
import { useState } from "react";
import { IMAGE_LINKS } from "@/assets/imageLinks";
import { useAdminStore } from "@/stores/adminStore";
import { useCustomerCareStore } from "@/stores/customerCareStore";
import { Bell, Bolt, MessageCircle, Ticket } from "lucide-react";

const MainNav = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const logout = useAdminStore((state) => state.logout);

  const adminZ = useAdminStore((state) => state.user);
  const customerCareZ = useCustomerCareStore((state) => state.user);
  const userAvatar =
    adminZ?.avatar?.url ||
    customerCareZ?.avatar?.url ||
    IMAGE_LINKS.DEFAULT_AVATAR;
  const userFullName = adminZ
    ? `${adminZ.last_name} ${adminZ.first_name}`
    : `${customerCareZ?.last_name} ${customerCareZ?.first_name}`;
  if (!adminZ?.role || !customerCareZ) {
    return null;
  }
  return (
    <div className="flex items-center justify-between w-full p-4 gap-4 bg-white/80 backdrop-blur-sm rounded-lg">
      <Link href={"/"}>
        <Avatar>
          <AvatarImage src="https://res.cloudinary.com/dlavqnrlx/image/upload/v1746519176/xoxqia9t1ywka71pskrb.png" />
          <AvatarFallback></AvatarFallback>
        </Avatar>
      </Link>
      <Input
        type="email"
        placeholder="Search here..."
        className="bg-white flex-1"
      />
      <div className=" jb gap-8 ">
        <div className="jb gap-2 max-md:hidden">
          <div
            onClick={() => router.push("/manage/notifications")}
            className="w-10 aspect-square rounded-xl relative cc bg-info-100 shadow-md shadow-info-300 hover-sd"
          >
            <Bell className="text-info-500" />
            <Badge
              className="absolute -top-1 -right-1 border-2 border-white text-[0.5rem] px-[0.14rem] py-[0.1rem] bg-info-500"
              variant="default"
            ></Badge>
          </div>
          <div className="w-10 aspect-square rounded-xl relative cc bg-primary-100 shadow-md shadow-primary-300 hover-sd">
            <MessageCircle className="text-primary-500" />
            <Badge
              className="absolute -top-1 -right-1 border-2 border-white text-[0.5rem] px-[0.14rem] py-[0.1rem] bg-primary-500"
              variant="default"
            ></Badge>
          </div>
          <div
            onClick={() => router.push("/promotions")}
            className="w-10 aspect-square rounded-xl relative cc bg-amber-200 shadow-md shadow-orange-300 hover-sd cursor-pointer"
          >
            <Ticket className="text-yellow-500" />
            <Badge
              className="absolute -top-1 -right-1 border-2 border-white text-[0.5rem] px-[0.14rem] py-[0.1rem] bg-amber-200"
              variant="default"
            ></Badge>
          </div>
          <div
            onClick={() => router.push("/settings")}
            className="w-10 aspect-square rounded-xl relative cc bg-danger-100 shadow-md shadow-danger-300 hover-sd"
          >
            <Bolt className="text-danger-500" />
            <Badge
              className="absolute -top-1 -right-1 border-2 border-white text-[0.5rem] px-[0.14rem] py-[0.1rem] bg-danger-500"
              variant="default"
            ></Badge>
          </div>
        </div>
        <Separator
          orientation="vertical"
          className="bg-neutral-400 py-4 max-md:hidden"
        />
        <div className="jb gap-2">
          <h5 className="max-md:hidden">
            Hello, <span className="font-semibold">{userFullName}</span>
          </h5>
          <Popover>
            <PopoverTrigger asChild>
              <Avatar>
                <AvatarImage src={userAvatar} />
                <AvatarFallback>Admin</AvatarFallback>
              </Avatar>
            </PopoverTrigger>
            <PopoverContent className="">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => logout()}
                    variant={"ghost"}
                    className="text-red-500 hover:bg-red-100 w-full justify-start bg-grey"
                  >
                    Log Out
                  </Button>
                </DialogTrigger>
                <AuthDialogContent onClose={() => setOpen(false)} />
              </Dialog>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default MainNav;
