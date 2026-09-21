"use client";

import { useParams } from "next/navigation";
import DistribucionDetalle from "../../components/distribucion-detalle";

export default function DistributionDetailPage() {
  const params = useParams<{ id: string }>();
  return <DistribucionDetalle distributionId={params.id} />;
}
