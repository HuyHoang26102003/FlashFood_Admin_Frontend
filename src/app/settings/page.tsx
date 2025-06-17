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
import { useToast } from "@/hooks/use-toast";
import { useCustomerCareStore, CustomerCareUser } from "@/stores/customerCareStore";
import { useAdminStore, AdminUser } from "@/stores/adminStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react";
import axiosInstance from "@/lib/axios";

enum Enum_Tabs {
  SEEDING = "Seeding",
  PROFILE = "Profile",
  SECURITY = "Security",
}

const tabs: Enum_Tabs[] = [
  Enum_Tabs.SEEDING,
  Enum_Tabs.PROFILE,
  Enum_Tabs.SECURITY,
];

type TypeSeedingAccordionItem = {
  id: number;
  titleTrigger: string;
  content: {
    onClick: (router: AppRouterInstance, toast?: ReturnType<typeof useToast>["toast"]) => void;
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
    first_name: adminUser?.first_name || customerCareUser?.first_name || '',
    last_name: adminUser?.last_name || customerCareUser?.last_name || '',
  });

  useEffect(() => {
    if (selectedTab === Enum_Tabs.PROFILE) {
      const user = adminUser || customerCareUser;
      if (user) {
        setProfileData({
          first_name: user.first_name,
          last_name: user.last_name,
          email: isCustomerCareUser(user) ? user.contact_email[0]?.email : user.email,
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
      first_name: adminUser?.first_name || customerCareUser?.first_name || '',
      last_name: adminUser?.last_name || customerCareUser?.last_name || '',
    });
  }, [adminUser, customerCareUser]);

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
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
        formData.append("userType", isCustomerCareUser(user) ? "CUSTOMER_CARE_REPRESENTATIVE" : "ADMIN");
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
      console.error('Error updating profile:', error);
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
      return (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={previewUrl || ''} />
                  <AvatarFallback>
                    {profileData.first_name?.[0]}{profileData.last_name?.[0]}
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
                  onChange={handleInputChange('first_name')}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange('last_name')}
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
  }
};

const Page = () => {
  const customerCareZ = useCustomerCareStore((state) => state.user);
  const [selectedTab, setSelectedTab] = useState<Enum_Tabs>(tabs[0]);


  return (
    <div className="w-full  flex gap-4 justify-between">
      <div className=" w-4/12 flex flex-col ">
        {tabs
          ?.map((item) => (
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
      <div className="w-8/12  h-screen">
        <ConditionalTabContentRender selectedTab={selectedTab} />
      </div>
    </div>
  );
};

function isCustomerCareUser(user: AdminUser | CustomerCareUser): user is CustomerCareUser {
  return Array.isArray((user as CustomerCareUser).contact_email);
}

export default Page;
