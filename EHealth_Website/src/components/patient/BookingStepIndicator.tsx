interface BookingStepIndicatorProps {
    currentStep: number;
    steps: { label: string; icon: string }[];
}

export function BookingStepIndicator({ currentStep, steps }: BookingStepIndicatorProps) {
    return (
        <div className="w-full">
            {/* Desktop */}
            <div className="hidden md:flex items-center justify-between relative">
                {/* Progress line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 mx-12">
                    <div className="h-full bg-gradient-to-r from-[#3C81C6] to-[#2563eb] transition-all duration-500 ease-out"
                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }} />
                </div>

                {steps.map((step, i) => {
                    const stepNum = i + 1;
                    const isCompleted = stepNum < currentStep;
                    const isCurrent = stepNum === currentStep;
                    const isFuture = stepNum > currentStep;

                    return (
                        <div key={i} className="relative flex flex-col items-center z-10" style={{ flex: 1 }}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 
                                ${isCompleted ? "bg-gradient-to-br from-[#3C81C6] to-[#2563eb] text-white shadow-lg shadow-[#3C81C6]/25" : ""}
                                ${isCurrent ? "bg-gradient-to-br from-[#3C81C6] to-[#2563eb] text-white shadow-lg shadow-[#3C81C6]/30 ring-4 ring-[#3C81C6]/20 scale-110" : ""}
                                ${isFuture ? "bg-gray-100 text-gray-400" : ""}`}>
                                {isCompleted ? (
                                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>check</span>
                                ) : (
                                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{step.icon}</span>
                                )}
                            </div>
                            <span className={`mt-2 text-xs font-medium text-center max-w-[80px] leading-tight transition-colors
                                ${isCurrent ? "text-[#3C81C6] font-semibold" : isCompleted ? "text-gray-700" : "text-gray-400"}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Mobile */}
            <div className="md:hidden flex items-center gap-2 px-1">
                {steps.map((step, i) => {
                    const stepNum = i + 1;
                    const isCompleted = stepNum < currentStep;
                    const isCurrent = stepNum === currentStep;

                    return (
                        <div key={i} className="flex items-center gap-2" style={{ flex: isCurrent ? 3 : 1 }}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all
                                ${isCompleted ? "bg-[#3C81C6] text-white" : isCurrent ? "bg-[#3C81C6] text-white ring-2 ring-[#3C81C6]/20" : "bg-gray-100 text-gray-400"}`}>
                                {isCompleted ? <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check</span> : stepNum}
                            </div>
                            {isCurrent && <span className="text-xs font-semibold text-[#3C81C6] truncate">{step.label}</span>}
                            {i < steps.length - 1 && <div className={`h-0.5 flex-1 min-w-4 rounded-full ${isCompleted ? "bg-[#3C81C6]" : "bg-gray-200"}`} />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
