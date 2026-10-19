import { InfoContent, infoSlugs } from "@/components/info/info-content";

export function generateStaticParams() {
  return infoSlugs.map((slug) => ({ slug }));
}

export default function InfoPage({ params }: { params: { slug: string } }) {
  return <InfoContent slug={params.slug} />;
}
