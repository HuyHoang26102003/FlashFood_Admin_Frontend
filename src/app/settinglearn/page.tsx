"use client";
// import { Button } from '@/components/ui/button'
// import React, { useState } from 'react'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { Spinner } from '@/components/Spinner'
// import { customerService } from '@/services/companion-admin/customerService'
// import { customerCareService } from '@/services/companion-admin/customerCareService'
// import { driverService } from '@/services/companion-admin/driverService'
// import { restaurantOwnerService } from '@/services/companion-admin/restaurantOwnerService'
// import { toast } from 'sonner'

// const tabs = [
//   { title: "Seeding", icon: "🌱" },
//   { title: "Profile", icon: "👤" }
// ]

// type PropsConditionalTabContentRender = {
//   selectedTab: string
// }

// const SeedingContent = () => {
//   const [isLoading, setIsLoading] = useState(false)

//   const handleGenerateCustomer = async () => {
//     setIsLoading(true)
//     try {
//       const result = await customerService.createCustomer()
//       if (result && result.EC === 0) {
//         toast.success('Customer generated successfully')
//       } else {
//         toast.error('Failed to generate customer')
//       }
//     } catch (error) {
//       toast.error('Error generating customer')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleGenerateCustomerCare = async () => {
//     setIsLoading(true)
//     try {
//       const result = await customerCareService.createCustomerCareRepresentative()
//       if (result && result.EC === 0) {
//         toast.success('Customer care representative generated successfully')
//       } else {
//         toast.error('Failed to generate customer care representative')
//       }
//     } catch (error) {
//       toast.error('Error generating customer care representative')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleGenerateDriver = async () => {
//     setIsLoading(true)
//     try {
//       const result = await driverService.createDriver()
//       if (result && result.EC === 0) {
//         toast.success('Driver generated successfully')
//       } else {
//         toast.error('Failed to generate driver')
//       }
//     } catch (error) {
//       toast.error('Error generating driver')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleGenerateRestaurantOwner = async () => {
//     setIsLoading(true)
//     try {
//       const result = await restaurantOwnerService.createRestaurantOwner()
//       if (result && result.EC === 0) {
//         toast.success('Restaurant owner generated successfully')
//       } else {
//         toast.error('Failed to generate restaurant owner')
//       }
//     } catch (error) {
//       toast.error('Error generating restaurant owner')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return (
//     <div className="space-y-6">
//       <Card>
//         <CardHeader>
//           <CardTitle>Generate Test Data</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <Button
//               onClick={handleGenerateCustomer}
//               disabled={isLoading}
//               className="h-24 flex flex-col items-center justify-center gap-2"
//             >
//               <span className="text-2xl">👥</span>
//               <span>Generate Customer</span>
//             </Button>
//             <Button
//               onClick={handleGenerateCustomerCare}
//               disabled={isLoading}
//               className="h-24 flex flex-col items-center justify-center gap-2"
//             >
//               <span className="text-2xl">🎯</span>
//               <span>Generate Customer Care</span>
//             </Button>
//             <Button
//               onClick={handleGenerateDriver}
//               disabled={isLoading}
//               className="h-24 flex flex-col items-center justify-center gap-2"
//             >
//               <span className="text-2xl">🚚</span>
//               <span>Generate Driver</span>
//             </Button>
//             <Button
//               onClick={handleGenerateRestaurantOwner}
//               disabled={isLoading}
//               className="h-24 flex flex-col items-center justify-center gap-2"
//             >
//               <span className="text-2xl">🍽️</span>
//               <span>Generate Restaurant Owner</span>
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//       <Spinner isVisible={isLoading} isOverlay />
//     </div>
//   )
// }

// const ProfileContent = () => {
//   const [isLoading, setIsLoading] = useState(false)
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     email: '',
//     phone: '',
//     address: '',
//     avatar: null as File | null
//   })

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }))
//   }

//   const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       setFormData(prev => ({
//         ...prev,
//         avatar: e.target.files![0]
//       }))
//     }
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setIsLoading(true)
//     try {
//       // TODO: Implement profile update logic
//       toast.success('Profile updated successfully')
//     } catch (error) {
//       toast.error('Failed to update profile')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return (
//     <div className="space-y-6">
//       <Card>
//         <CardHeader>
//           <CardTitle>Profile Settings</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="space-y-2">
//                 <Label htmlFor="firstName">First Name</Label>
//                 <Input
//                   id="firstName"
//                   name="firstName"
//                   value={formData.firstName}
//                   onChange={handleInputChange}
//                   placeholder="Enter your first name"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="lastName">Last Name</Label>
//                 <Input
//                   id="lastName"
//                   name="lastName"
//                   value={formData.lastName}
//                   onChange={handleInputChange}
//                   placeholder="Enter your last name"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="email">Email</Label>
//                 <Input
//                   id="email"
//                   name="email"
//                   type="email"
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   placeholder="Enter your email"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="phone">Phone</Label>
//                 <Input
//                   id="phone"
//                   name="phone"
//                   value={formData.phone}
//                   onChange={handleInputChange}
//                   placeholder="Enter your phone number"
//                 />
//               </div>
//               <div className="space-y-2 md:col-span-2">
//                 <Label htmlFor="address">Address</Label>
//                 <Input
//                   id="address"
//                   name="address"
//                   value={formData.address}
//                   onChange={handleInputChange}
//                   placeholder="Enter your address"
//                 />
//               </div>
//               <div className="space-y-2 md:col-span-2">
//                 <Label htmlFor="avatar">Profile Picture</Label>
//                 <Input
//                   id="avatar"
//                   name="avatar"
//                   type="file"
//                   accept="image/*"
//                   onChange={handleAvatarChange}
//                 />
//               </div>
//             </div>
//             <Button type="submit" className="w-full" disabled={isLoading}>
//               {isLoading ? 'Saving...' : 'Save Changes'}
//             </Button>
//           </form>
//         </CardContent>
//       </Card>
//       <Spinner isVisible={isLoading} isOverlay />
//     </div>
//   )
// }

// const ConditionalTabContentRender = ({ selectedTab }: PropsConditionalTabContentRender) => {
//   switch (selectedTab) {
//     case "Seeding":
//       return <SeedingContent />
//     case "Profile":
//       return <ProfileContent />
//     default:
//       return null
//   }
// }

// const Page = () => {
//   const [selectedTab, setSelectedTab] = useState(tabs[0].title)

//   return (
//     <div className="container mx-auto py-8">
//       <div className="flex flex-col md:flex-row gap-8">
//         <div className="w-full md:w-64 space-y-2">
//           {tabs.map(item => (
//             <Button
//               key={item.title}
//               onClick={() => setSelectedTab(item.title)}
//               className={`w-full justify-start gap-2 ${
//                 selectedTab === item.title
//                   ? "bg-primary text-primary-foreground"
//                   : "bg-secondary"
//               }`}
//               variant="outline"
//             >
//               <span>{item.icon}</span>
//               {item.title}
//             </Button>
//           ))}
//         </div>
//         <div className="flex-1">
//           <ConditionalTabContentRender selectedTab={selectedTab} />
//         </div>
//       </div>
//     </div>
//   )
// }

// export default Page
