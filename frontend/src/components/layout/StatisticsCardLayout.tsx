import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatisticsCardProps {
    icon: LucideIcon;
    title: string;
    value: string | number;
    iconColor: string;
    subtitle?: string;
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({
    icon: Icon,
    title,
    value,
    iconColor,
    subtitle
}) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <div className="flex items-center">
                <Icon className={`h-8 w-8 ${iconColor}`} />
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-semibold text-gray-900">{value}</p>
                    {subtitle && (
                        <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatisticsCard;