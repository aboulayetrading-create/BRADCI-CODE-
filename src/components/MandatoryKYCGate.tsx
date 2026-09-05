import React from 'react';

/**
 * MandatoryKYCGate
 * Global screen-blocking at registration/login has been removed per BRAD'CI trust specifications.
 * KYC verification is handled just-in-time when attempting transactional actions (buy/sell)
 * via KycRequiredModal.
 */
export const MandatoryKYCGate: React.FC = () => {
  return null;
};
