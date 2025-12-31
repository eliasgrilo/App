/**
 * QueryClientProvider - TanStack Query Configuration
 * 
 * Enterprise-grade query client with optimistic update defaults.
 */

import React from 'react';
import { QueryClient, QueryClientProvider as TanStackQueryClientProvider } from '@tanstack/react-query';

// Create query client with enterprise defaults
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Keep data fresh for 1 minute
            staleTime: 1000 * 60,
            // Cache for 5 minutes
            gcTime: 1000 * 60 * 5,
            // Retry failed queries 3 times
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
            // Don't refetch on window focus for better UX
            refetchOnWindowFocus: false,
        },
        mutations: {
            // Retry failed mutations 3 times
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        },
    },
});

// Provider component
export const QueryClientProvider: React.FC<{ children: React.ReactNode }> = ({
    children
}) => {
    return (
        <TanStackQueryClientProvider client={queryClient}>
            {children}
        </TanStackQueryClientProvider>
    );
};

export default QueryClientProvider;
