import React from 'react'

import { FaChevronDown } from "react-icons/fa6";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"


import { Calendar } from "@/components/ui/calendar"
import { IoCalendarOutline } from "react-icons/io5";
import { formatDate } from '@/utils/functions/formatDate';

const Compare2Date = ({ date1, setDate1, date2, setDate2 }: { date1: Date | undefined, setDate1: (date1: Date | undefined) => void, date2: Date | undefined, setDate2: (date2: Date | undefined) => void }) => {
    return (
        <div className="card hover:duration-300 hover:bg-slate-100 jb gap-3 max-md:hidden" >
            <div className="bg-primary-100 cc p-2 rounded-lg">
                <IoCalendarOutline className="text-primary-500" />
            </div>
            <div className="fc ">
                <h4 className="cursor-default text-lg font-semibold">Filter Periode</h4>
                <p className="text-xs font-thin ">
                    <Popover>
                        <PopoverTrigger className="link-date-hover">
                            {formatDate(date1 as Date)}
                        </PopoverTrigger>
                        <PopoverContent>
                            <div className="flex justify-between space-x-4">
                                <Calendar
                                    mode="single"
                                    selected={date1}
                                    onSelect={setDate1}
                                    className="rounded-md border"
                                />
                            </div></PopoverContent>
                    </Popover>
                    {' '}  - {' '}
                    <Popover>
                        <PopoverTrigger className="link-date-hover">
                            {formatDate(date2 as Date)}
                        </PopoverTrigger>
                        <PopoverContent>
                            <div className="flex justify-between space-x-4">
                                <Calendar
                                    mode="single"
                                    selected={date2}
                                    onSelect={setDate2}
                                    className="rounded-md border"
                                />
                            </div></PopoverContent>
                    </Popover>
                </p>
            </div>
        </div>
    )
}

export default Compare2Date
