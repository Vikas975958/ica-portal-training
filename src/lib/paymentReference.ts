export const paymentModeRequiresReference = (paymentMode: string): boolean =>
  paymentMode === "UPI" || paymentMode === "Bank Transfer";

export const getPaymentReferenceCopy = (paymentMode: string) => {
  if (paymentMode === "UPI") {
    return {
      label: "UPI Reference ID",
      placeholder: "Enter UPI transaction/reference ID",
    };
  }

  return {
    label: "Bank Transaction Reference No.",
    placeholder: "Enter Bank Transaction Reference No. (UTR/Reference No.)",
  };
};
