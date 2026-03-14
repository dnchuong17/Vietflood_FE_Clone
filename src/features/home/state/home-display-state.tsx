"use client";

import {
    createContext,
    type Dispatch,
    type ReactNode,
    useContext,
    useMemo,
    useReducer,
} from "react";

type HomeDisplayState = {
    isWeatherStatsVisible: boolean;
};

type HomeDisplayAction =
    | { type: "toggleWeatherStatsVisibility" }
    | { type: "setWeatherStatsVisibility"; payload: boolean };

const initialHomeDisplayState: HomeDisplayState = {
    isWeatherStatsVisible: false,
};

function homeDisplayReducer(
    state: HomeDisplayState,
    action: HomeDisplayAction,
): HomeDisplayState {
    switch (action.type) {
        case "toggleWeatherStatsVisibility":
            return {
                ...state,
                isWeatherStatsVisible: !state.isWeatherStatsVisible,
            };
        case "setWeatherStatsVisibility":
            return { ...state, isWeatherStatsVisible: action.payload };
        default:
            return state;
    }
}

type HomeDisplayContextValue = {
    state: HomeDisplayState;
    dispatch: Dispatch<HomeDisplayAction>;
};

const HomeDisplayContext = createContext<HomeDisplayContextValue | null>(null);

export function HomeDisplayProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(homeDisplayReducer, initialHomeDisplayState);
    const value = useMemo(() => ({ state, dispatch }), [state]);

    return <HomeDisplayContext.Provider value={value}>{children}</HomeDisplayContext.Provider>;
}

export function useHomeDisplayState() {
    const context = useContext(HomeDisplayContext);

    if (!context) {
        throw new Error("useHomeDisplayState must be used within HomeDisplayProvider");
    }

    return context;
}
