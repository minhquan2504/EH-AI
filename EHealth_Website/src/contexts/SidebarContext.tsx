"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface SidebarContextType {
    collapsed: boolean;
    toggleSidebar: () => void;
    setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
    collapsed: false,
    toggleSidebar: () => {},
    setCollapsed: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);

    const toggleSidebar = useCallback(() => {
        setCollapsed((prev) => !prev);
    }, []);

    return (
        <SidebarContext.Provider value={{ collapsed, toggleSidebar, setCollapsed }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    return useContext(SidebarContext);
}
