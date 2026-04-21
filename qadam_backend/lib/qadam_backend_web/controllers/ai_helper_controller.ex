defmodule QadamBackendWeb.AiHelperController do
  @moduledoc "AI Helper — assists creators with writing campaign content"
  use QadamBackendWeb, :controller

  alias QadamBackend.Claude.Client

  @system_prompts %{
    "title" => "You are helping a startup founder write a clear, memorable project title and one-line pitch for their crowdfunding campaign. Keep it concise. Suggest 2-3 options. No buzzwords. Be direct and specific.",
    "description" => "You are helping a startup founder write a clear project description for their crowdfunding campaign. Structure it as: What problem, Why now, What you're building, Who benefits. Keep it honest and specific. 150-300 words.",
    "milestones" => "You are helping a startup founder break their project into 2-4 clear milestones for crowdfunding. Each milestone should have: a title, what will be delivered, and specific acceptance criteria that backers can verify (e.g. 'live demo at URL', 'screenshot of analytics'). Be practical and realistic.",
    "evidence" => "You are helping a project creator describe what they accomplished for a milestone. Help them be specific and provide verifiable proof. Suggest what links, screenshots, or metrics to include.",
    "update" => "You are helping a project creator write an engaging update for their backers. Keep it honest, specific, and brief. Include what was done, what's next, and any challenges."
  }

  def help(conn, %{"context" => context, "message" => message}) do
    system = Map.get(@system_prompts, context, @system_prompts["description"])

    case Client.help(system, message) do
      {:ok, response} ->
        json(conn, %{response: response})

      {:error, :no_api_key} ->
        conn |> put_status(:service_unavailable) |> json(%{error: "AI Helper not configured"})

      {:error, reason} ->
        conn |> put_status(:bad_gateway) |> json(%{error: "AI temporarily unavailable"})
    end
  end

  def help(conn, _params) do
    conn |> put_status(:bad_request) |> json(%{error: "Missing context and message"})
  end
end
