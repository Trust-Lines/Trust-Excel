import React, { createContext, useContext, useState, useEffect } from 'react';
import { PaymentRule, getPaymentRules } from '../lib/payment-rules';
import { useAuth } from './AuthContext';

interface PaymentRulesContextType {
  paymentRules: PaymentRule[];
  loading: boolean;
  error: string | null;
  refreshRules: () => Promise<void>;
  addRule: (rule: PaymentRule) => void;
}

const PaymentRulesContext = createContext<PaymentRulesContextType | undefined>(undefined);

export const usePaymentRules = () => {
  const context = useContext(PaymentRulesContext);
  if (context === undefined) {
    throw new Error('usePaymentRules must be used within a PaymentRulesProvider');
  }
  return context;
};

interface PaymentRulesProviderProps {
  children: React.ReactNode;
}

export const PaymentRulesProvider: React.FC<PaymentRulesProviderProps> = ({ children }) => {
  const [paymentRules, setPaymentRules] = useState<PaymentRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const refreshRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const rules = await getPaymentRules();
      setPaymentRules(rules);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment rules');
      console.error('❌ Failed to load payment rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const addRule = (rule: PaymentRule) => {
    setPaymentRules(prev => [...prev, rule]);
  };

  // Wait for auth to be ready before fetching payment rules
  useEffect(() => {
    // Only fetch if:
    // 1. Auth is not loading (session has been restored or determined to not exist)
    // 2. User is authenticated
    if (!isAuthLoading && isAuthenticated) {
      refreshRules();
    } else if (!isAuthLoading && !isAuthenticated) {
    } else {
    }
  }, [isAuthenticated, isAuthLoading]);

  const value: PaymentRulesContextType = {
    paymentRules,
    loading,
    error,
    refreshRules,
    addRule
  };

  return (
    <PaymentRulesContext.Provider value={value}>
      {children}
    </PaymentRulesContext.Provider>
  );
};