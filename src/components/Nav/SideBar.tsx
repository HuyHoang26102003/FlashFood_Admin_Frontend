"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AD_ADMIN_SIDEBAR_ITEMS,
  type sideBarItem,
  AD_SIDEBAR_ITEMS_CUSTOMER_CARE,
} from "@/utils/appData";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAdminStore } from "@/stores/adminStore";
import { useCustomerCareStore } from "@/stores/customerCareStore";

const styleSelectedItem =
  "bg-primary-200 relative after:absolute after:left-0 after:w-1 px-3 py-1 rounded-l-sm overflow-hidden after:top-0 after:h-full after:bg-primary-500 pl-4";
const styleHoverItem =
  "p-2 text-sm font-semibold hover:duration-200 hover:text-info-600 cursor-pointer hover:bg-info-100";

const SideBar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [selectedDropdownMenuTitle, setSelectedDropdownMenuTitle] =
    useState("");
  const adminLoggedInAs = useAdminStore((state) => state.user?.logged_in_as);
  const customerCareLoggedInAs = useCustomerCareStore(
    (state) => state.user?.logged_in_as
  );
  const loggedInAs = adminLoggedInAs || customerCareLoggedInAs; // Lấy từ store nào có giá trị

  // Hàm lọc sidebar items dựa trên vai trò
  const getFilteredSideBarItems = (): sideBarItem[] => {
    if (!loggedInAs) return [];

    switch (loggedInAs) {
      case "SUPER_ADMIN":
        return [
          ...AD_ADMIN_SIDEBAR_ITEMS,
          { title: "Admin Management", link: "/admin" },
        ];
      case "COMPANION_ADMIN":
        return AD_ADMIN_SIDEBAR_ITEMS.filter(
          (item) =>
            item.title !== "App Managers" &&
            item.title !== "Customers Statistics"
        );
      case "FINANCE_ADMIN": {
        const filteredItems = AD_ADMIN_SIDEBAR_ITEMS.filter(
          (item) =>
            item.title !== "Drivers Statistics" &&
            item.title !== "Restaurant Owner Statistics" &&
            item.title !== "Customers Statistics" &&
            item.title !== "Customer Care Team"
        );
        const appManagerItems =
          AD_ADMIN_SIDEBAR_ITEMS.find(
            (item) => item.title === "App Managers"
          )?.dropdownItem?.map((subItem) => ({
            title: subItem.title,
            link: subItem.link,
          })) || [];
        return [
          ...filteredItems.filter((item) => item.title !== "App Managers"),
          ...appManagerItems,
        ];
      }
      case "CUSTOMER_CARE_REPRESENTATIVE":
        return AD_SIDEBAR_ITEMS_CUSTOMER_CARE;
      default:
        return [];
    }
  };

  const filteredSideBarItems = getFilteredSideBarItems();

  // Hàm lấy tất cả các route hợp lệ
  const getValidRoutes = (): string[] => {
    const routes: string[] = [];
    filteredSideBarItems.forEach((item) => {
      if (item.link) routes.push(item.link);
      if (item.dropdownItem) {
        item.dropdownItem.forEach((subItem) => {
          if (subItem.link) routes.push(subItem.link);
        });
      }
    });
    return routes;
  };

  const validRoutes = getValidRoutes();

  // Gộp logic kiểm tra quyền và chuyển hướng
  useEffect(() => {
    if (!loggedInAs) {
      // Nếu chưa đăng nhập, chuyển về login thay vì not-found
      // if (pathname !== "/login") {
      //   router.push("/");
      // }
      return;
    }

    // Nếu đã đăng nhập nhưng truy cập route không hợp lệ
    // if (!validRoutes.includes(pathname)) {
    //   router.push("/not-found");
    //   return;
    // }

    // Nếu đang ở /not-found nhưng có quyền truy cập trang khác, chuyển về Dashboard
    if (pathname === "/not-found" && validRoutes.length > 0) {
      router.push(validRoutes[0] || "/"); // Chuyển về route hợp lệ đầu tiên (thường là Dashboard)
    }
  }, [pathname, loggedInAs, validRoutes, router]);

  return (
    <div className="h-full bg-white fc py-4 pl-4 col-span-2">
      {filteredSideBarItems.map((item, i) => {
        if (!item.dropdownItem) {
          return (
            <Link
              href={item.link as string}
              key={i}
              className={
                pathname === item.link ? styleSelectedItem : styleHoverItem
              }
            >
              {item.title}
            </Link>
          );
        }

        return (
          <div
            key={i}
            className={
              item.dropdownItem &&
              item.dropdownItem.some((subItem) => subItem.link === pathname)
                ? styleSelectedItem
                : styleHoverItem
            }
          >
            <DropdownMenu>
              <DropdownMenuTrigger className="p-0 ring-0 outline-none text-start">
                {item.title}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuSeparator />
                {item.dropdownItem?.map((subItem, j) => (
                  <DropdownMenuItem key={j}>
                    <Link
                      onClick={() =>
                        setSelectedDropdownMenuTitle(subItem.title as string)
                      }
                      href={subItem.link as string}
                    >
                      {subItem.title}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}
    </div>
  );
};

export default SideBar;
