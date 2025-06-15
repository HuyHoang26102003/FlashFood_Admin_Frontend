import React from 'react'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Compare2Date from "@/components/Compare2Date";


const PageTitle = ({ date1, setDate1, date2, setDate2, isDashboard = false }: { date1: Date | undefined, setDate1: (date1: Date | undefined) => void, date2: Date | undefined, setDate2: (date2: Date | undefined) => void; isDashboard?: boolean }) => {
    return (
        <div className="jb">
            <div className="fc gap-2">
                <h1 className="md:text-xl max-md:text-lg font-bold">DASHBOARD</h1>
                <Breadcrumb >
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink className="text-primary-600 max-md:text-xs font-bold" href="/">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="text-primary-600 max-md:text-xs font-bold" />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="text-primary-600 max-md:text-xs font-bold">Dashboard</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

            </div>
            {!!isDashboard &&
                <Compare2Date date1={date1} setDate1={setDate1} date2={date2} setDate2={setDate2} />
            }
        </div>
    )
}

export default PageTitle
