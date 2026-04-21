defmodule QadamBackend.Claude.Client do
  @moduledoc """
  Claude API client for milestone verification.
  """

  @api_url "https://api.anthropic.com/v1/messages"
  @model "claude-sonnet-4-20250514"

  @doc "AI Helper — general purpose chat for creator assistance"
  def help(system_prompt, user_message) do
    api_key = Application.get_env(:qadam_backend, :claude_api_key)

    if is_nil(api_key) || api_key == "" do
      {:error, :no_api_key}
    else
      case Req.post(@api_url,
        json: %{
          model: @model,
          max_tokens: 512,
          system: system_prompt,
          messages: [%{role: "user", content: user_message}]
        },
        headers: [
          {"x-api-key", api_key},
          {"anthropic-version", "2023-06-01"},
          {"content-type", "application/json"}
        ],
        receive_timeout: 15_000
      ) do
        {:ok, %{status: 200, body: body}} ->
          text = body |> Map.get("content", []) |> Enum.find(%{}, &(&1["type"] == "text")) |> Map.get("text", "")
          {:ok, text}
        {:ok, %{status: status, body: body}} ->
          {:error, {:api_error, status, body}}
        {:error, reason} ->
          {:error, {:connection_error, reason}}
      end
    end
  end

  def verify_milestone(prompt) do
    api_key = Application.fetch_env!(:qadam_backend, :claude_api_key)

    start_time = System.monotonic_time(:millisecond)

    result =
      Req.post(@api_url,
        json: %{
          model: @model,
          max_tokens: 1024,
          messages: [%{role: "user", content: prompt}]
        },
        headers: [
          {"x-api-key", api_key},
          {"anthropic-version", "2023-06-01"},
          {"content-type", "application/json"}
        ],
        receive_timeout: 30_000
      )

    latency_ms = System.monotonic_time(:millisecond) - start_time

    case result do
      {:ok, %{status: 200, body: body}} ->
        response_text =
          body
          |> Map.get("content", [])
          |> Enum.find(%{}, &(&1["type"] == "text"))
          |> Map.get("text", "")

        {:ok, %{response: response_text, model: @model, latency_ms: latency_ms}}

      {:ok, %{status: status, body: body}} ->
        {:error, {:api_error, status, body}}

      {:error, reason} ->
        {:error, {:connection_error, reason}}
    end
  end
end
