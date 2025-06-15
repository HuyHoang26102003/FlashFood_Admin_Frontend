import { CardCategory } from "../constants/card"; // Ensure this is correctly defined
import { PiUsersThreeDuotone, PiListHeartDuotone } from "react-icons/pi";
import { LuPackageOpen } from "react-icons/lu";
import { TfiStatsUp } from "react-icons/tfi";
import { IconType } from "react-icons"; // Import IconType

export interface IDashboardListCards {
    id: number;
    type: CardCategory;
    value: string | number;
    difference: number;
    label: string;
    icon: IconType; // Change this to IconType to reference the icon component type
}

export const sampleDashboardListCards: IDashboardListCards[] = [
    {
        id: Math.random(),
        type: 'TOTAL_USERS', // Ensure this is a valid CardCategory
        value: 250, // Example value
        difference: 4, // Example difference
        icon: PiUsersThreeDuotone,// Use the icon type directly without JSX,
        label: 'Total Users',

    },
    {
        id: Math.random(),
        type: 'TOTAL_REVENUE', // Ensure this is a valid CardCategory
        value: '$128', // Example value
        difference: -12, // Example difference
        icon: TfiStatsUp,// Use the icon type directly without JSX,
        label: 'Total Revenue',

    },
    {
        id: Math.random(),
        type: 'ORDER_FULFILLMENT_RATE', // Ensure this is a valid CardCategory
        value: '95%', // Example value
        difference: 4, // Example difference
        icon: LuPackageOpen,// Use the icon type directly without JSX,
        label: 'Order Fulfillment Rate',

    },
    {
        id: Math.random(),
        type: 'SATISFACTION_RATE', // Ensure this is a valid CardCategory
        value: '85%', // Example value
        difference: 1, // Example difference
        icon: PiListHeartDuotone,// Use the icon type directly without JSX,
        label: 'Satisfaction Rate',

    },
];
