import React from 'react';
import { DesignConfig, ProductionMode, LaminationType } from '../types';

// Pricing and Time Data
const XEROX_PRICING_TIERS = [
    { maxQty: 2, price: 50.00 },
    { maxQty: 9, price: 35.00 },
    { maxQty: 24, price: 30.00 },
    { maxQty: 49, price: 25.00 },
    { maxQty: 99, price: 20.00 },
    { maxQty: Infinity, price: 18.00 },
];

const PLOTTER_PRICING_TIERS = [
    { maxQty: 1, price: 350.00 },
    { maxQty: 4, price: 250.00 },
    { maxQty: 9, price: 225.00 },
    { maxQty: 24, price: 200.00 },
    { maxQty: Infinity, price: 180.00 },
];

const LAMINATION_COST_PER_SHEET = 10;
const XEROX_PRINT_TIME_PER_SHEET = 10; // minutes
const XEROX_LAMINATION_TIME_PER_SHEET = 5; // minutes
const PLOTTER_PRINT_TIME_PER_SHEET = 30; // minutes
const MINIMUM_PRODUCTION_TIME = 120; // 2 hours in minutes

// Helper function to get the correct price per sheet based on quantity
const getPricePerSheet = (totalSheets: number, mode: ProductionMode) => {
    const tiers = mode === ProductionMode.XEROX ? XEROX_PRICING_TIERS : PLOTTER_PRICING_TIERS;
    for (const tier of tiers) {
        if (totalSheets <= tier.maxQty) {
            return tier.price;
        }
    }
    return tiers[tiers.length - 1].price; // Fallback
};

// Helper function to calculate delivery time respecting working hours
const calculateDeliveryTime = (productionMinutes: number): Date => {
    let deliveryDate = new Date();
    let remainingMinutes = productionMinutes;

    const workSchedule = {
        // day: [startHour, endHour]
        1: [9, 18], // Monday
        2: [9, 18], // Tuesday
        3: [9, 18], // Wednesday
        4: [9, 18], // Thursday
        5: [9, 18], // Friday
        6: [10, 15], // Saturday
    };

    while (remainingMinutes > 0) {
        const day = deliveryDate.getDay();
        const schedule = workSchedule[day as keyof typeof workSchedule];

        // If it's Sunday or outside of working hours, move to the next working period
        if (!schedule || deliveryDate.getHours() >= schedule[1]) {
            deliveryDate.setDate(deliveryDate.getDate() + 1);
            const nextDay = deliveryDate.getDay();
            // Find the next available working day's schedule
            let nextSchedule = workSchedule[nextDay as keyof typeof workSchedule];
            let daysToAdd = 1;
            while(!nextSchedule) {
                 const futureDay = (nextDay + daysToAdd) % 7;
                 nextSchedule = workSchedule[futureDay as keyof typeof workSchedule];
                 daysToAdd++;
            }
            deliveryDate.setHours(nextSchedule[0], 0, 0, 0);
            continue;
        }

        // If it's before working hours, move to the start of the working day
        if (deliveryDate.getHours() < schedule[0]) {
            deliveryDate.setHours(schedule[0], 0, 0, 0);
        }

        const endOfDay = new Date(deliveryDate);
        endOfDay.setHours(schedule[1], 0, 0, 0);

        const minutesLeftInDay = (endOfDay.getTime() - deliveryDate.getTime()) / 60000;

        if (remainingMinutes <= minutesLeftInDay) {
            deliveryDate.setMinutes(deliveryDate.getMinutes() + remainingMinutes);
            remainingMinutes = 0;
        } else {
            remainingMinutes -= minutesLeftInDay;
            deliveryDate.setDate(deliveryDate.getDate() + 1);
            const nextDay = deliveryDate.getDay();
             let nextSchedule = workSchedule[nextDay as keyof typeof workSchedule];
             let daysToAdd = 1;
             while(!nextSchedule) {
                 const futureDay = (nextDay + daysToAdd) % 7;
                 nextSchedule = workSchedule[futureDay as keyof typeof workSchedule];
                 daysToAdd++;
            }
            deliveryDate.setHours(nextSchedule[0], 0, 0, 0);
        }
    }

    return deliveryDate;
};


interface CostCalculatorProps {
    config: DesignConfig;
    totalSheets: number;
}


const CostCalculator: React.FC<CostCalculatorProps> = ({ config, totalSheets }) => {
    // Cost Calculation
    const pricePerSheet = getPricePerSheet(totalSheets, config.mode);
    const baseCost = totalSheets * pricePerSheet;
    const laminationCost = config.mode === ProductionMode.XEROX && config.lamination !== LaminationType.NONE
        ? totalSheets * LAMINATION_COST_PER_SHEET
        : 0;
    const totalCost = baseCost + laminationCost;

    // Time Calculation
    let productionMinutes = 0;
    if (config.mode === ProductionMode.XEROX) {
        productionMinutes = totalSheets * XEROX_PRINT_TIME_PER_SHEET;
        if (config.lamination !== LaminationType.NONE) {
            productionMinutes += totalSheets * XEROX_LAMINATION_TIME_PER_SHEET;
        }
    } else { // PLOTTER_HD
        productionMinutes = totalSheets * PLOTTER_PRINT_TIME_PER_SHEET;
    }

    const finalProductionTime = Math.max(productionMinutes, MINIMUM_PRODUCTION_TIME);
    const deliveryDate = calculateDeliveryTime(finalProductionTime);
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

     const formatDeliveryDate = (date: Date) => {
        return new Intl.DateTimeFormat('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        }).format(date);
    };

     const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        let result = '';
        if (h > 0) result += `${h} hr${h > 1 ? 's' : ''} `;
        if (m > 0) result += `${m} min${m > 1 ? 's' : ''}`;
        return result.trim();
    };

    return (
        <div className="space-y-4">
            {/* Cost Section */}
            <div className="p-4 bg-slate-100 rounded-lg space-y-3">
                <h3 className="text-lg font-bold text-slate-800">Estimación de Costo</h3>
                <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                        <span className="text-slate-600">{totalSheets} {config.mode === ProductionMode.XEROX ? 'planillas' : 'pliegos'} x {formatCurrency(pricePerSheet)}</span>
                        <span className="text-slate-800 font-medium">{formatCurrency(baseCost)}</span>
                    </div>
                    {laminationCost > 0 && (
                        <div className="flex justify-between">
                            <span className="text-slate-600">{totalSheets} x Acabado ({config.lamination})</span>
                            <span className="text-slate-800 font-medium">{formatCurrency(laminationCost)}</span>
                        </div>
                    )}
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-300">
                    <span className="font-bold text-slate-900">Total Estimado</span>
                    <span className="text-2xl font-bold text-cyan-600">{formatCurrency(totalCost)}</span>
                </div>
                <p className="text-xs text-slate-500 text-center pt-2">
                    Precios no incluyen IVA. Esta es una cotización preliminar.
                </p>
            </div>

            {/* Time Section */}
             <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <h3 className="text-lg font-bold text-slate-800">Tiempo de Entrega</h3>
                <div className="text-sm text-center">
                    <p className="text-slate-600">Tiempo de producción: <span className="font-semibold">{formatDuration(finalProductionTime)}</span></p>
                </div>
                <div className="text-center bg-white p-3 rounded-md mt-2 shadow-inner">
                    <p className="font-semibold text-blue-800">Fecha de entrega estimada:</p>
                    <p className="text-lg font-bold text-blue-600">{formatDeliveryDate(deliveryDate)}</p>
                </div>
                 <p className="text-xs text-slate-500 text-center pt-2">
                    Basado en un horario laboral de L-V 9am-6pm y Sáb 10am-3pm.
                </p>
            </div>
        </div>
    );
};

export default CostCalculator;