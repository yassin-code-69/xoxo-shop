"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function OrderRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  useEffect(() => {
    router.replace(`/payment/${orderId}`);
  }, [orderId, router]);

  return null;
}
