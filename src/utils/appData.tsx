export type sideBarItem = {
  title: string;
  link?: string;
  dropdownItem?: sideBarItem[];
};
// * AD = APP DATA
export const AD_ADMIN_SIDEBAR_ITEMS: sideBarItem[] = [
  {
    title: "Dashboard",
    link: "/",
  },
  {
    title: "Customers Statistics",
    link: "/customers",
  },
  {
    title: "Drivers Statistics",
    link: "/drivers",
  },
  {
    title: "Restaurant Owner Statistics",
    link: "/restaurant-owners",
  },
  {
    title: "Orders Statistics",
    link: "/orders",
  },
  {
    title: "Customer Care Team",
    dropdownItem: [
      {
        title: "Customer Care Statistics",
        link: "/cc",
      },
      {
        title: "Customer Care Reports",
        link: "/cc/inquiries",
      },
    ],
  },
  {
    title: "App Managers",
    dropdownItem: [
      {
        title: "Manage Service fee",
        link: "/manage/service-fee",
      },
      {
        title: "Manage Notifications",
        link: "/manage/notifications",
      },
      {
        title: "Manage FAQs",
        link: "/manage/faqs",
      },
    ],
  },
];

export const AD_SIDEBAR_ITEMS_CUSTOMER_CARE: sideBarItem[] = [
  {
    title: "Dashboard",
    link: "/",
  },
  {
    title: "F-Chats",
    link: "/chats",
  },
  {
    title: "Orders",
    link: "/orders",
  },
  {
    title: "Settings",
    link: "/settings",
  },
];
