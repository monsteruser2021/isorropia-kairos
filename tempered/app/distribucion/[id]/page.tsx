import DistribucionDetalle from "../../components/distribucion-detalle";

type DistributionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DistributionDetailPage({ params }: DistributionPageProps) {
  const { id } = await params;
  return <DistribucionDetalle distributionId={id} />;
}
