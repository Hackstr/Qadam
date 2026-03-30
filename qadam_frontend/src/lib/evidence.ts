/**
 * Calculate SHA-256 evidence hash client-side.
 * Must match the backend hash verification exactly.
 */
export async function calculateEvidenceHash(evidence: {
  text: string;
  links: string[];
  fileHashes: string[];
  milestoneIndex: number;
  campaignId: string;
}): Promise<string> {
  // Deterministic content object — sorted for consistency
  const contentObject = {
    text: evidence.text.trim(),
    links: [...evidence.links].sort(),
    file_hashes: [...evidence.fileHashes].sort(),
    milestone_index: evidence.milestoneIndex,
    campaign_id: evidence.campaignId,
  };

  const content = JSON.stringify(contentObject);
  const buffer = new TextEncoder().encode(content) as unknown as ArrayBuffer;
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Hash a file's content using SHA-256.
 */
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer as ArrayBuffer);

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
