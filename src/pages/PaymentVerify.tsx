import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const PaymentVerify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const reference = searchParams.get("reference") || "";
    const status = searchParams.get("status") || "pending";
    navigate(`/downloads?reference=${encodeURIComponent(reference)}&status=${encodeURIComponent(status)}`, { replace: true });
  }, [searchParams, navigate]);

  return null;
};

export default PaymentVerify;
