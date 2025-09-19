import React from 'react';
import { DesignConfig, ProductionMode, LaminationType, LayoutInfo, MimakiInputMode } from '../types';

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

const MIMAKI_PRICE_PER_10CM = 100.00;
const MIMAKI_CONTAINER_COST = 100.00;
const MIMAKI_METER_OFFER_PRICE = 700.00;
const MIMAKI_HOLO_PRICE_PER_METER = 1000.00;

const LAMINATION_COST_PER_SHEET = 10;
const XEROX_PRINT_TIME_PER_SHEET = 10; // minutes
const XEROX_LAMINATION_TIME_PER_SHEET = 5; // minutes
const PLOTTER_PRINT_TIME_PER_SHEET = 30; // minutes
const MINIMUM_PRODUCTION_TIME = 120; // 2 hours in minutes

const getPricePerSheet = (totalSheets: number, mode: ProductionMode) => {
    const tiers = mode === ProductionMode.XEROX ? XEROX_PRICING_TIERS : PLOTTER_PRICING_TIERS;
    for (const tier of tiers) {
        if (totalSheets <= tier.maxQty) {
            return tier.price;
        }
    }
    return tiers[tiers.length - 1].price; // Fallback
};

const calculateHoloDeliveryDate = (): Date => {
    const now = new Date();
    const deadlineDay = 0; // Sunday
    const deadlineHour = 21; // 9 PM

    const deliveryDay = 1; // Monday
    const deliveryHour = 16; // 4 PM

    // Find the next delivery Monday
    let deliveryDate = new Date();
    deliveryDate.setDate(now.getDate() + (deliveryDay - now.getDay() + 7) % 7);
    deliveryDate.setHours(deliveryHour, 0, 0, 0);
    if(deliveryDate < now) { // If this Monday has already passed
        deliveryDate.setDate(deliveryDate.getDate() + 7);
    }
    
    // Check if the order was placed after the deadline for this coming Monday
    const dayOfWeek = now.getDay();
    const hour = now.getHours();

    if (dayOfWeek > deadlineDay || (dayOfWeek === deadlineDay && hour >= deadlineHour)) {
        // It's past the deadline, so push delivery to the *next* Monday
        deliveryDate.setDate(deliveryDate.getDate() + 7);
    }
    
    return deliveryDate;
};


const calculateDeliveryTime = (productionMinutes: number): Date => {
    let deliveryDate = new Date();
    let remainingMinutes = productionMinutes;

    const workSchedule = {
        1: [9, 18], 2: [9, 18], 3: [9, 18], 4: [9, 18], 5: [9, 18], 6: [10, 15],
    };

    while (remainingMinutes > 0) {
        const day = deliveryDate.getDay();
        const schedule = workSchedule[day as keyof typeof workSchedule];

        if (!schedule || deliveryDate.getHours() >= schedule[1]) {
            deliveryDate.setDate(deliveryDate.getDate() + 1);
            deliveryDate.setHours(workSchedule[deliveryDate.getDay() as keyof typeof workSchedule]?.[0] || 9, 0, 0, 0);
            continue;
        }

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
            deliveryDate.setHours(workSchedule[deliveryDate.getDay() as keyof typeof workSchedule]?.[0] || 9, 0, 0, 0);
        }
    }

    return deliveryDate;
};


interface CostCalculatorProps {
    config: DesignConfig;
    layout: LayoutInfo;
}


const CostCalculator: React.FC<CostCalculatorProps> = ({ config, layout }) => {
    const { totalSheets, linearMeters = 0 } = layout;

    const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        let result = '';
        if (h > 0) result += `${h} hr${h > 1 ? 's' : ''} `;
        if (m > 0) result += `${m} min${m > 1 ? 's' : ''}`;
        return result.trim() || '0 min';
    };
    const formatDeliveryDate = (date: Date) => new Intl.DateTimeFormat('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }).format(date);

    // Cost & Time Calculation
    let totalCost = 0;
    let finalProductionTime = 0;
    let costBreakdown: React.ReactNode = null;
    let specialOffer: React.ReactNode = null;
    let deliveryDate: Date;

    if (!config.mode) return null;

    if (config.mode === ProductionMode.MIMAKI_HOLO_UV) {
        const meters = Math.ceil(config.linearLengthCm / 100);
        totalCost = meters * MIMAKI_HOLO_PRICE_PER_METER;
        costBreakdown = (
            <div className="flex justify-between">
                <span className="text-slate-600">{meters} metro(s) x {formatCurrency(MIMAKI_HOLO_PRICE_PER_METER)}</span>
                <span className="text-slate-800 font-medium">{formatCurrency(totalCost)}</span>
            </div>
        );
        deliveryDate = calculateHoloDeliveryDate();

    } else if (config.mode === ProductionMode.MIMAKI_DTF_UV) {
        let baseCost = 0;

        if (config.mimakiInputMode === MimakiInputMode.LENGTH) {
            const linearCm = config.linearLengthCm;
            if (linearCm > 70) {
                baseCost = 700;
            } else {
                baseCost = Math.ceil(linearCm / 10) * MIMAKI_PRICE_PER_10CM;
            }
            costBreakdown = (
                <div className="flex justify-between">
                    <span className="text-slate-600">Impresión de {linearCm} cm</span>
                    <span className="text-slate-800 font-medium">{formatCurrency(baseCost)}</span>
                </div>
            );
        } else { // By QUANTITY
            const linearCm = linearMeters * 100;
            const blocksOf10cm = Math.ceil(linearCm / 10);
            baseCost = blocksOf10cm * MIMAKI_PRICE_PER_10CM;
            
            if (linearCm > 61 && linearCm < 100) {
                specialOffer = (
                    <div className="text-xs text-center p-2 bg-green-100 text-green-800 rounded-md">
                        ¡Oferta! Completa el metro lineal por solo <strong>{formatCurrency(MIMAKI_METER_OFFER_PRICE)}</strong>.
                    </div>
                );
            }

            costBreakdown = (
                <div className="flex justify-between">
                    <span className="text-slate-600">{blocksOf10cm} bloques de 10cm x {formatCurrency(MIMAKI_PRICE_PER_10CM)}</span>
                    <span className="text-slate-800 font-medium">{formatCurrency(baseCost)}</span>
                </div>
            );
        }
        
        const containerCost = config.container ? MIMAKI_CONTAINER_COST : 0;
        totalCost = baseCost + containerCost;

        const initialBreakdown = costBreakdown;
        costBreakdown = (
            <>
                {initialBreakdown}
                {containerCost > 0 && (
                    <div className="flex justify-between">
                        <span className="text-slate-600">Contenedor de cartón</span>
                        <span className="text-slate-800 font-medium">{formatCurrency(containerCost)}</span>
                    </div>
                )}
            </>
        );

        const meters = Math.ceil(linearMeters);
        let productionMinutes = 0;
        if (meters <= 2) {
            productionMinutes = meters * 120;
        } else {
            productionMinutes = 240 + (meters - 2) * 60; // 4h for first 2m, then 1h/m
        }
        finalProductionTime = Math.max(productionMinutes, MINIMUM_PRODUCTION_TIME);
        deliveryDate = calculateDeliveryTime(finalProductionTime);
    
    } else { // Xerox and Plotter
        const pricePerSheet = getPricePerSheet(totalSheets, config.mode);
        const baseCost = totalSheets * pricePerSheet;
        const laminationCost = config.mode === ProductionMode.XEROX && config.lamination !== LaminationType.NONE
            ? totalSheets * LAMINATION_COST_PER_SHEET
            : 0;
        totalCost = baseCost + laminationCost;

        costBreakdown = (
            <>
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
            </>
        );
        
        let productionMinutes = 0;
        if (config.mode === ProductionMode.XEROX) {
            productionMinutes = totalSheets * XEROX_PRINT_TIME_PER_SHEET;
            if (config.lamination !== LaminationType.NONE) {
                productionMinutes += totalSheets * XEROX_LAMINATION_TIME_PER_SHEET;
            }
        } else { // PLOTTER_EPSON
            productionMinutes = totalSheets * PLOTTER_PRINT_TIME_PER_SHEET;
        }
        finalProductionTime = Math.max(productionMinutes, MINIMUM_PRODUCTION_TIME);
        deliveryDate = calculateDeliveryTime(finalProductionTime);
    }

    return (
        <div className="space-y-4">
            <div className="p-4 bg-slate-100 rounded-lg space-y-3">
                <h3 className="text-lg font-bold text-slate-800">Estimación de Costo</h3>
                <div className="text-sm space-y-1">{costBreakdown}</div>
                {specialOffer}
                <div className="flex justify-between items-center pt-3 border-t border-slate-300">
                    <span className="font-bold text-slate-900">Total Estimado</span>
                    <span className="text-2xl font-bold text-cyan-600">{formatCurrency(totalCost)}</span>
                </div>
                <p className="text-xs text-slate-500 text-center pt-2">
                    Precios no incluyen IVA. Esta es una cotización preliminar.
                </p>
            </div>
             <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <h3 className="text-lg font-bold text-slate-800">Tiempo de Entrega</h3>
                {config.mode === ProductionMode.MIMAKI_HOLO_UV ? (
                    <>
                    <div className="text-center bg-white p-3 rounded-md mt-2 shadow-inner">
                        <p className="font-semibold text-blue-800">Entrega programada para el:</p>
                        <p className="text-lg font-bold text-blue-600">{formatDeliveryDate(deliveryDate)}</p>
                    </div>
                    <p className="text-xs text-slate-500 text-center pt-2">
                        Pedidos se entregan los Lunes a las 4pm si se confirman antes del Domingo a las 9pm.
                    </p>
                    </>
                ) : (
                    <>
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
                    </>
                )}
            </div>
        </div>
    );
};

export default CostCalculator;
