"use client";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { driverService } from "@/services/companion-admin/driverService";
import { customerCareService } from "@/services/companion-admin/customerCareService";
import { customerService } from "@/services/companion-admin/customerService";
import { restaurantService } from "@/services/companion-admin/restaurantService";
import { useToast } from "@/hooks/use-toast";
import {
  useCustomerCareStore,
  CustomerCareUser,
} from "@/stores/customerCareStore";
import { useAdminStore, AdminUser } from "@/stores/adminStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, Bell, BellOff } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { Switch } from "@/components/ui/switch";
import { useNotificationStore } from "@/stores/notificationStore";

enum Enum_Tabs {
  SEEDING = "Seeding",
  PROFILE = "Profile",
  NOTIFICATIONS_MANAGEMENT = "Notifications Management",
}

const tabs: Enum_Tabs[] = [
  Enum_Tabs.SEEDING,
  Enum_Tabs.PROFILE,
  Enum_Tabs.NOTIFICATIONS_MANAGEMENT,
];

type TypeSeedingAccordionItem = {
  id: number;
  titleTrigger: string;
  content: {
    onClick: (
      router: AppRouterInstance,
      toast?: ReturnType<typeof useToast>["toast"]
    ) => void;
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
    id: 2,
    titleTrigger: "Driver",
    content: [
      {
        id: 1,
        onClick: (router, toast) => {
          if (!toast) return;
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
    id: 1,
    titleTrigger: "Customer",
    content: [
      {
        id: 1,
        onClick: (router, toast) => {
          if (!toast) return;
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
    id: 3,
    titleTrigger: "Retaurant Owner",
    content: [
      {
        id: 1,
        onClick: (router, toast) => {
          if (!toast) return;
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
          if (!toast) return;
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

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  avatar?: {
    url: string;
    key: string;
  } | null;
}

interface ProfileUpdateData {
  first_name: string;
  last_name: string;
}

interface UploadResponse {
  EC: number;
  data?: {
    avatar?: {
      url: string;
      key: string;
    };
  };
}

const ConditionalTabContentRender = ({
  selectedTab,
}: PropsConditionalTabContentRender) => {
  const router = useRouter();
  const { toast } = useToast();
  const adminUser = useAdminStore((state) => state.user);
  const customerCareUser = useCustomerCareStore((state) => state.user);
  const setAdminUser = useAdminStore((state) => state.setUser);
  const setCustomerCareUser = useCustomerCareStore((state) => state.setUser);

  // Global notification preferences from store
  const notificationPreferences = useNotificationStore(
    (state) => state.preferences
  );
  const updateNotificationPreference = useNotificationStore(
    (state) => state.updatePreference
  );

  const [profileData, setProfileData] = useState<ProfileFormData>({
    first_name: "",
    last_name: "",
    email: "",
    avatar: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: adminUser?.first_name || customerCareUser?.first_name || "",
    last_name: adminUser?.last_name || customerCareUser?.last_name || "",
  });

  useEffect(() => {
    if (selectedTab === Enum_Tabs.PROFILE) {
      const user = adminUser || customerCareUser;
      if (user) {
        setProfileData({
          first_name: user.first_name,
          last_name: user.last_name,
          email: isCustomerCareUser(user)
            ? user.contact_email[0]?.email
            : user.email,
          avatar: user.avatar,
        });
        if (user.avatar?.url) {
          setPreviewUrl(user.avatar.url);
        }
      }
    }
  }, [selectedTab, adminUser, customerCareUser]);

  // Update form data when user data changes
  useEffect(() => {
    setFormData({
      first_name: adminUser?.first_name || customerCareUser?.first_name || "",
      last_name: adminUser?.last_name || customerCareUser?.last_name || "",
    });
  }, [adminUser, customerCareUser]);

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleNotificationToggle = (
    notificationType: keyof typeof notificationPreferences
  ) => {
    updateNotificationPreference(
      notificationType,
      !notificationPreferences[notificationType]
    );
  };

  const handleProfileUpdate = async () => {
    try {
      setIsLoading(true);
      const user = adminUser || customerCareUser;
      if (!user) return;

      let uploadResponse: UploadResponse | null = null;

      // Step 1: Upload avatar if there's a new image
      if (selectedImage) {
        const formData = new FormData();
        formData.append("file", selectedImage);
        formData.append(
          "userType",
          isCustomerCareUser(user) ? "CUSTOMER_CARE_REPRESENTATIVE" : "ADMIN"
        );
        formData.append("entityId", user.id);

        const response = await axiosInstance.post("upload/avatar", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        uploadResponse = response.data;

        if (uploadResponse?.EC !== 0) {
          toast({
            title: "Error",
            description: "Failed to upload avatar",
            variant: "destructive",
          });
          return;
        }
      }

      // Step 2: Update profile information
      const updateData: ProfileUpdateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
      };

      const endpoint = isCustomerCareUser(user)
        ? `customer-cares/${user.id}`
        : `admin/${user.id}`;

      const updateResponse = await axiosInstance.patch(endpoint, updateData);

      if (updateResponse.data.EC === 0) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });

        const currentAvatar = adminUser?.avatar || customerCareUser?.avatar;
        const newAvatar = uploadResponse?.data?.avatar || currentAvatar;

        // Update the store with new data
        if (adminUser) {
          setAdminUser({
            ...adminUser,
            ...updateResponse.data.data,
            avatar: newAvatar,
          });
        } else if (customerCareUser) {
          setCustomerCareUser({
            ...customerCareUser,
            ...updateResponse.data.data,
            avatar: newAvatar,
          });
        }

        // Reset image selection
        setSelectedImage(null);
        if (updateResponse.data.data.avatar?.url) {
          setPreviewUrl(updateResponse.data.data.avatar.url);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  switch (selectedTab) {
    case Enum_Tabs.SEEDING:
      return (
        <div className="space-y-6">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
              Data Seeding Hub
            </h2>
            <p className="text-gray-600">
              Generate and manage test data for your application
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {seedingAccordionItems?.map((item) => (
              <Card
                key={item.id}
                className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary-500"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                      {item.id === 1 && (
                        <span className="text-primary-600 font-semibold">
                          👤
                        </span>
                      )}
                      {item.id === 2 && (
                        <span className="text-primary-600 font-semibold">
                          🚗
                        </span>
                      )}
                      {item.id === 3 && (
                        <span className="text-primary-600 font-semibold">
                          🏪
                        </span>
                      )}
                      {item.id === 4 && (
                        <span className="text-primary-600 font-semibold">
                          📞
                        </span>
                      )}
                    </div>
                    <div className="w-8/12">
                      <CardTitle className="text-lg font-semibold text-gray-800">
                        {item.titleTrigger}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.id === 1 &&
                          "Generate and manage customer accounts"}
                        {item.id === 2 &&
                          "Create driver profiles and assignments"}
                        {item.id === 3 && "Set up restaurant owners and menus"}
                        {item.id === 4 &&
                          "Configure customer support representatives"}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 gap-3">
                    {item.content?.map((action) => (
                      <Button
                        onClick={() => action.onClick(router, toast)}
                        key={action.id}
                        variant={action.variant}
                        className={`w-full justify-start h-12 ${
                          action.variant === "default"
                            ? "bg-primary-600 w-42 hover:bg-primary-700 text-white shadow-md hover:shadow-lg transition-all"
                            : "border-2 w-42 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all"
                        }`}
                      >
                        <div className="flex items-center  ">
                          {/* <span className="text-lg">
                            {action.title.includes("Generate") ? "⚡" : "⚙️"}
                          </span> */}
                          <div className="text-left flex-1">
                            <div className="font-medium">{action.title}</div>
                            <div className="text-xs opacity-75 flex flex-wrap">
                              {action.title.includes("Generate")
                                ? "Create new test data"
                                : "View and manage"}
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Last updated: Just now</span>
                      <span className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span>Active</span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-2xl">💡</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">Pro Tips</h3>
                  <p className="text-sm text-gray-600">
                    Use the &quot;Generate&quot; buttons to create realistic
                    test data. Always test in a safe environment before using in
                    production.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-300 hover:bg-blue-100"
                >
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    case Enum_Tabs.PROFILE:
      return (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={previewUrl || ""} />
                  <AvatarFallback>
                    {profileData.first_name?.[0]}
                    {profileData.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <Label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange("first_name")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange("last_name")}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profileData.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleProfileUpdate}
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    case Enum_Tabs.NOTIFICATIONS_MANAGEMENT:
      return (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">
                    Order Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about new orders, order updates, and
                    status changes
                  </p>
                </div>
                <Switch
                  checked={notificationPreferences.orders}
                  onCheckedChange={() => handleNotificationToggle("orders")}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">
                    Restaurant Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about restaurant registrations, updates, and
                    status changes
                  </p>
                </div>
                <Switch
                  checked={notificationPreferences.restaurants}
                  onCheckedChange={() =>
                    handleNotificationToggle("restaurants")
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">
                    Customer Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts about customer registrations, activities, and
                    issues
                  </p>
                </div>
                <Switch
                  checked={notificationPreferences.customers}
                  onCheckedChange={() => handleNotificationToggle("customers")}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">
                    Driver Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about driver registrations, availability, and
                    delivery updates
                  </p>
                </div>
                <Switch
                  checked={notificationPreferences.drivers}
                  onCheckedChange={() => handleNotificationToggle("drivers")}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">
                    Customer Care Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about customer care representative
                    activities
                  </p>
                </div>
                <Switch
                  checked={notificationPreferences.customerCare}
                  onCheckedChange={() =>
                    handleNotificationToggle("customerCare")
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">
                    Customer Care Inquiries
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get alerted about new customer inquiries and support
                    requests
                  </p>
                </div>
                <Switch
                  checked={notificationPreferences.customerCareInquiries}
                  onCheckedChange={() =>
                    handleNotificationToggle("customerCareInquiries")
                  }
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {Object.values(notificationPreferences).every(Boolean) ? (
                    <>
                      <Bell className="w-4 h-4" />
                      All notifications enabled
                    </>
                  ) : Object.values(notificationPreferences).some(Boolean) ? (
                    <>
                      <Bell className="w-4 h-4" />
                      Some notifications enabled
                    </>
                  ) : (
                    <>
                      <BellOff className="w-4 h-4" />
                      All notifications disabled
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allEnabled = Object.values(
                      notificationPreferences
                    ).every(Boolean);
                    const newState = !allEnabled;
                    updateNotificationPreference("orders", newState);
                    updateNotificationPreference("restaurants", newState);
                    updateNotificationPreference("customers", newState);
                    updateNotificationPreference("drivers", newState);
                    updateNotificationPreference("customerCare", newState);
                    updateNotificationPreference(
                      "customerCareInquiries",
                      newState
                    );
                  }}
                >
                  {Object.values(notificationPreferences).every(Boolean)
                    ? "Disable All"
                    : "Enable All"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
  }
};

const Page = () => {
  const adminZ = useAdminStore((state) => state.user);
  const checkLoggedin = () => {
    if (adminZ) return tabs[0];
    return tabs[1];
  };
  const [selectedTab, setSelectedTab] = useState<Enum_Tabs>(checkLoggedin);
  useEffect(() => {}, []);

  const customerCareZ = useCustomerCareStore((state) => state.user);

  return (
    <div className="w-full mt-4 flex gap-4 justify-between">
      <div className={` ${adminZ ? "w-4/12" : "hidden"} flex flex-col `}>
        {tabs?.map((item) => (
          <Button
            onClick={() => {
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
      <div className={`${adminZ ? "w-8/12" : "w-full"}  h-screen`}>
        <ConditionalTabContentRender selectedTab={selectedTab} />
      </div>
    </div>
  );
};

function isCustomerCareUser(
  user: AdminUser | CustomerCareUser
): user is CustomerCareUser {
  return Array.isArray((user as CustomerCareUser).contact_email);
}

export default Page;
