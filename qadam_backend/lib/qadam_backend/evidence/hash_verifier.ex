defmodule QadamBackend.Evidence.HashVerifier do
  @moduledoc """
  Verifies that evidence content hash matches the on-chain hash.
  Prevents creator from submitting one hash on-chain and different content to backend.
  """

  @doc """
  Verify evidence hash for a milestone.
  Computes SHA-256 of the evidence content and compares with on-chain hash.
  """
  def verify(milestone) do
    case milestone.evidence_hash do
      nil -> {:ok, :no_hash_to_verify}
      on_chain_hash ->
        computed = compute_hash(milestone)

        if computed == on_chain_hash do
          {:ok, :hash_verified}
        else
          {:error, :hash_mismatch}
        end
    end
  end

  @doc """
  Compute SHA-256 hash of evidence content.
  Must match the client-side implementation exactly.
  """
  def compute_hash(milestone) do
    # Sort links and file hashes for determinism (matches frontend)
    content = %{
      "text" => String.trim(milestone.evidence_text || ""),
      "links" => Enum.sort(milestone.evidence_links || []),
      "file_hashes" => extract_and_sort_file_hashes(milestone.evidence_files),
      "milestone_index" => milestone.index,
      "campaign_id" => milestone.campaign_id
    }

    content
    |> Jason.encode!()
    |> then(&:crypto.hash(:sha256, &1))
    |> Base.encode16(case: :lower)
  end

  defp extract_and_sort_file_hashes(nil), do: []
  defp extract_and_sort_file_hashes(files) when is_map(files) do
    files
    |> Map.values()
    |> Enum.map(&(&1["hash"] || &1["cid"] || ""))
    |> Enum.sort()
  end
  defp extract_and_sort_file_hashes(_), do: []
end
