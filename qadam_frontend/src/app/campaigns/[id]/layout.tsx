import type { Metadata } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${API_URL}/campaigns/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error("not found");
    const { data: campaign } = await res.json();

    const title = `${campaign.title} | Qadam`;
    const description = campaign.description?.slice(0, 160) ||
      "Milestone-based crowdfunding on Solana. SOL in escrow until verified by AI.";
    const image = campaign.cover_image_url || "/og-image.png";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: image, width: 1200, height: 630 }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: "Qadam — Milestone Crowdfunding on Solana",
      description: "SOL stays in escrow until AI verifies each milestone.",
    };
  }
}

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
