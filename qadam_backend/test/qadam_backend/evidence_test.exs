defmodule QadamBackend.EvidenceTest do
  use QadamBackend.DataCase, async: true

  alias QadamBackend.Evidence.HashVerifier

  describe "compute_hash/1" do
    test "produces consistent SHA-256 hash" do
      milestone = %{
        evidence_text: "I built the prototype",
        evidence_links: ["https://demo.example.com", "https://github.com/test"],
        evidence_files: %{},
        index: 0,
        campaign_id: "test-campaign-id"
      }

      hash1 = HashVerifier.compute_hash(milestone)
      hash2 = HashVerifier.compute_hash(milestone)

      assert hash1 == hash2
      assert String.length(hash1) == 64 # SHA-256 hex = 64 chars
    end

    test "different content produces different hash" do
      base = %{evidence_text: "text", evidence_links: [], evidence_files: %{}, index: 0, campaign_id: "c1"}

      hash1 = HashVerifier.compute_hash(base)
      hash2 = HashVerifier.compute_hash(%{base | evidence_text: "different"})

      assert hash1 != hash2
    end

    test "link order doesn't matter (sorted)" do
      m1 = %{evidence_text: "t", evidence_links: ["b.com", "a.com"], evidence_files: %{}, index: 0, campaign_id: "c1"}
      m2 = %{evidence_text: "t", evidence_links: ["a.com", "b.com"], evidence_files: %{}, index: 0, campaign_id: "c1"}

      assert HashVerifier.compute_hash(m1) == HashVerifier.compute_hash(m2)
    end
  end

  describe "verify/1" do
    test "returns ok when no hash to verify" do
      milestone = %{evidence_hash: nil}
      assert {:ok, :no_hash_to_verify} = HashVerifier.verify(milestone)
    end

    test "returns ok when hash matches" do
      milestone = %{
        evidence_text: "test content",
        evidence_links: [],
        evidence_files: %{},
        index: 0,
        campaign_id: "c1",
        evidence_hash: nil
      }

      hash = HashVerifier.compute_hash(milestone)
      milestone = Map.put(milestone, :evidence_hash, hash)

      assert {:ok, :hash_verified} = HashVerifier.verify(milestone)
    end

    test "returns error when hash mismatches" do
      milestone = %{
        evidence_text: "test content",
        evidence_links: [],
        evidence_files: %{},
        index: 0,
        campaign_id: "c1",
        evidence_hash: "0000000000000000000000000000000000000000000000000000000000000000"
      }

      assert {:error, :hash_mismatch} = HashVerifier.verify(milestone)
    end
  end
end
