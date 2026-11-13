import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlannedPage, plannedFeatures, type PlannedFeature } from "@/components/nodus/planned-page";

type Props = { params: Promise<{ feature: string }> };
const isFeature = (value: string): value is PlannedFeature => Object.hasOwn(plannedFeatures, value);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { feature } = await params;
  return { title: `${isFeature(feature) ? plannedFeatures[feature].title : "Financeiro"} | Viniccius` };
}
export default async function Route({ params }: Props) {
  const { feature } = await params;
  if (!isFeature(feature)) notFound();
  return <PlannedPage feature={feature} />;
}
