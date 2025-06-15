import { IDashboardListCards } from '@/utils/sample/DashboardListCards';
import React from 'react'
import { FaArrowDown, FaArrowUp } from "react-icons/fa";

const DashboardListCards = ({ data }: { data: IDashboardListCards[] }) => {
    if (!data) return
    return (
        <div className="jb gap-4 py-6 max-lg:grid max-lg:grid-cols-2 ">
            {data.map(item => {
                return (
                    <div key={item.id} className="card md:flex-1  flex items-center min-h-32   gap-4 relative hover-sd">
                        <div className={`absolute top-0 right-0  p-2 max-md:p-1 rounded-md shadow ${item.difference > 0 ? 'shadow-success-700' : 'shadow-danger-500'}`}>
                            <div className="flex items-center gap-1 text-sm">
                                <div className={`circle w-6 cc ${item.difference > 0 ? 'bg-success-100' : 'bg-danger-100'}`}>
                                    {item.difference > 0 ?
                                        <FaArrowUp className='text-green-700 text-xs' /> :
                                        <FaArrowDown className='text-red-500 text-xs' />
                                    }
                                </div>
                                <p className={`font-extrabold max-md:font-bold text-xs${item.difference > 0 ? " text-success-700" : " text-danger-500"}`}>{item.difference}%</p>
                            </div>
                        </div>
                        <div className="circle w-12 bg-primary-100 cc">
                            {React.createElement(item.icon, { className: "text-xl text-primary-500" })}
                        </div>
                        <div className="fc flex-1">
                            <div className="jb gap-4 ">
                                <h1 className="text-xl max-md:text-lg max-md:font-bold font-extrabold">{item.value}</h1>
                            </div>
                            <h1 className="font-bold max-md:font-semibold text-primary-700 text-xs">{item.label}</h1>

                        </div>

                    </div>
                )
            })
            }

        </div>
    )
}

export default DashboardListCards
