"use client";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useRouter } from "next/navigation";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { driverService } from "@/services/companion-admin/driverService";
import { customerCareService } from "@/services/companion-admin/customerCareService";
import { customerService } from "@/services/companion-admin/customerService";
import { restaurantService } from "@/services/companion-admin/restaurantService";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { useCustomerCareStore } from "@/stores/customerCareStore";

enum Enum_Tabs {
  SEEDING = "Seeding",
  PROFILE = "Profile",
  SECURITY = "Security",
  LOGOUT = "Logout",
}

const tabs: Enum_Tabs[] = [
  Enum_Tabs.SEEDING,
  Enum_Tabs.PROFILE,
  Enum_Tabs.SECURITY,
  Enum_Tabs.LOGOUT,
];

type TypeSeedingAccordionItem = {
  id: number;
  titleTrigger: string;
  content: {
    onClick: (router: AppRouterInstance, toast?: any) => void;
    id: number;
    title: string;
    variant:
      | "default"
      | "outline"
      | "link"
      | "destructive"
      | "secondary"
      | "ghost"
      | null
      | undefined;
  }[];
};

const seedingAccordionItems: TypeSeedingAccordionItem[] = [
  {
    id: 1,
    titleTrigger: "Customer",
    content: [
      {
        id: 1,
        onClick: (router, toast) => {
          const generateCustomer = async () => {
            const result = await customerService.createCustomer();
            if (result.EC === 0) {
              toast({
                title: "Success",
                description: result.EM,
              });
            }
          };
          generateCustomer();
        },
        title: "Generate Customer",
        variant: "default",
      },
      {
        id: 2,
        onClick: (router: AppRouterInstance) => {
          router.push("/customers");
        },
        title: "Manage Customer",
        variant: "outline",
      },
    ],
  },
  {
    id: 2,
    titleTrigger: "Driver",
    content: [
      {
        id: 1,
        onClick: (router, toast) => {
          const generateDriver = async () => {
            const result = await driverService.createDriver();
            if (result.EC === 0) {
              toast({
                title: "Success",
                description: result.EM,
              });
            }
          };
          generateDriver();
        },
        title: "Generate Driver",
        variant: "default",
      },
      {
        id: 2,
        onClick: (router: AppRouterInstance) => router.push("/drivers"),
        title: "Manage Driver",
        variant: "outline",
      },
    ],
  },
  {
    id: 3,
    titleTrigger: "Retaurant Owner",
    content: [
      {
        id: 1,
        onClick: (router, toast) => {
          const generateRestaurantOwner = async () => {
            const result = await restaurantService.createRestaurant();
            if (result.EC === 0) {
              toast({
                title: "Success",
                description: result.EM,
              });
            }
          };
          generateRestaurantOwner();
        },
        title: "Generate Retaurant Owner",
        variant: "default",
      },
      {
        id: 2,
        onClick: (router: AppRouterInstance) =>
          router.push("/restaurant-owners"),
        title: "Manage Restaurant Owner",
        variant: "outline",
      },
    ],
  },
  {
    id: 4,
    titleTrigger: "Customer Care Representative",
    content: [
      {
        id: 1,
        onClick: (router, toast) => {
          const generateCustomerCare = async () => {
            const result =
              await customerCareService.createCustomerCareRepresentative();
            if (result.EC === 0) {
              toast({
                title: "Success",
                description: result.EM,
              });
            }
          };
          generateCustomerCare();
        },
        title: "Generate Customer Care",
        variant: "default",
      },
      {
        id: 2,
        onClick: (router: AppRouterInstance) => router.push("/cc"),

        title: "Manage Customer Care",
        variant: "outline",
      },
    ],
  },
];

type PropsConditionalTabContentRender = {
  selectedTab: Enum_Tabs;
};

const ConditionalTabContentRender = ({
  selectedTab,
}: PropsConditionalTabContentRender) => {
  const router = useRouter();
  const { toast } = useToast();

  switch (selectedTab) {
    case Enum_Tabs.SEEDING:
      return (
        <Accordion type="single" collapsible>
          {seedingAccordionItems?.map((item) => (
            <AccordionItem key={item.id} value={`${item.id}`}>
              <AccordionTrigger>{item.titleTrigger}</AccordionTrigger>
              <AccordionContent className="flex gap-4 ">
                {item.content?.map((item) => (
                  <Button
                    onClick={() => item.onClick(router, toast)}
                    key={item.id}
                    variant={item.variant}
                  >
                    {item.title}
                  </Button>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      );
    case Enum_Tabs.PROFILE:
      return <div>profile</div>;
  }
};

const page = () => {
  const customerCareZ = useCustomerCareStore((state) => state.user);
  const [selectedTab, setSelectedTab] = useState<Enum_Tabs>(tabs[0]);
  const router = useRouter();

  useEffect(() => {
    if (customerCareZ?.logged_in_as === "CUSTOMER_CARE_REPRESENTATIVE") {
      setSelectedTab(Enum_Tabs.LOGOUT);
    }
  }, [customerCareZ]);

  const logout = useCustomerCareStore((state) => state.logout);

  return (
    <div className="w-full  flex gap-4 justify-between">
      <div className=" w-4/12 flex flex-col ">
        {tabs
          ?.filter((item) => item === Enum_Tabs.LOGOUT)
          ?.map((item) => (
            <Button
              onClick={() => {
                if (item === Enum_Tabs.LOGOUT) {
                  logout();
                  router.push("/");
                }
                setSelectedTab(item);
              }}
              key={item}
              className={`text-primary ${
                selectedTab === item ? "bg-primary-500 text-white" : null
              }`}
              variant="outline"
            >
              {item}
            </Button>
          ))}
      </div>
      <div className="w-8/12  h-screen">
        <ConditionalTabContentRender selectedTab={selectedTab} />
      </div>
    </div>
  );
};

export default page;
