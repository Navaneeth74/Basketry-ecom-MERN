import React, { createContext } from 'react';

export const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const formatPrice = (amount = 0) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{
      currency: 'INR',
      formatPrice
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};
