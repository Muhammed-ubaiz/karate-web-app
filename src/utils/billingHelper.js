/**
 * Shared VAT & Fee Calculation Utilities for Al Muharib Karate Center
 * Ensures consistent 5% UAE VAT calculation across Fee Plans, Enrollment,
 * Record Payment, Edit Payment, Dues Tracking, and Receipts.
 */

export const roundCurrency = (value) => {
  const num = Number(value) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const formatCurrencyAmount = (value) => {
  const rounded = roundCurrency(value);
  return Number.isInteger(rounded) ? rounded.toLocaleString() : rounded.toFixed(2);
};

export const calculatePlanRenewalBreakdown = (plan) => {
  const baseAmount = roundCurrency(plan?.tuitionFee ?? 250);
  const vatRate = Number(plan?.vatRate ?? 5);
  const vatAmount = roundCurrency((baseAmount * vatRate) / 100);
  const totalWithVat = roundCurrency(baseAmount + vatAmount);

  return {
    baseAmount,
    vatRate,
    vatAmount,
    totalWithVat
  };
};

export const calculateEnrollmentBreakdown = (
  plan,
  { includeRegistrationFee = false, includeUniform = false } = {}
) => {
  const tuition = roundCurrency(plan?.tuitionFee ?? 0);
  const admission = includeRegistrationFee ? roundCurrency(plan?.registrationFee ?? 100) : 0;
  const uniform = includeUniform ? roundCurrency(plan?.uniformFee ?? 0) : 0;
  const baseAmount = roundCurrency(tuition + admission + uniform);
  const vatRate = Number(plan?.vatRate ?? 5);
  const vatAmount = roundCurrency((baseAmount * vatRate) / 100);
  const totalWithVat = roundCurrency(baseAmount + vatAmount);

  return {
    tuition,
    admission,
    uniform,
    baseAmount,
    vatRate,
    vatAmount,
    totalWithVat
  };
};

export const calculateVatBreakdownFromTotal = (totalAmount, vatRate = 5) => {
  const totalWithVat = roundCurrency(totalAmount);
  const rate = Number(vatRate ?? 5);
  const baseAmount = rate > 0
    ? roundCurrency(totalWithVat / (1 + rate / 100))
    : totalWithVat;
  const vatAmount = roundCurrency(totalWithVat - baseAmount);

  return {
    baseAmount,
    vatRate: rate,
    vatAmount,
    totalWithVat
  };
};

export const calculateVatBreakdownFromBase = (baseAmount, vatRate = 5) => {
  const base = roundCurrency(baseAmount);
  const rate = Number(vatRate ?? 5);
  const vatAmount = roundCurrency((base * rate) / 100);
  const totalWithVat = roundCurrency(base + vatAmount);

  return {
    baseAmount: base,
    vatRate: rate,
    vatAmount,
    totalWithVat
  };
};
