defmodule QadamBackendWeb.UploadController do
  use QadamBackendWeb, :controller

  @upload_dir "priv/static/uploads"
  @max_size 5_000_000  # 5MB

  @doc "Upload file (image or evidence), returns public URL"
  def cover(conn, %{"file" => %Plug.Upload{} = upload}) do
    with :ok <- validate_content_type(upload.content_type),
         :ok <- validate_size(upload.path) do
      File.mkdir_p!(@upload_dir)

      ext = Path.extname(upload.filename) |> String.downcase()
      name = "#{:crypto.strong_rand_bytes(16) |> Base.url_encode64(padding: false)}#{ext}"
      dest = Path.join(@upload_dir, name)

      File.cp!(upload.path, dest)

      host = QadamBackendWeb.Endpoint.url()
      url = "#{host}/uploads/#{name}"

      json(conn, %{url: url})
    else
      {:error, reason} ->
        conn |> put_status(:unprocessable_entity) |> json(%{error: reason})
    end
  end

  def cover(conn, _params) do
    conn |> put_status(:bad_request) |> json(%{error: "Missing file parameter"})
  end

  @allowed_types ~w(image/jpeg image/png image/webp image/gif application/pdf application/zip text/plain)
  defp validate_content_type(ct) when ct in @allowed_types, do: :ok
  defp validate_content_type(_), do: {:error, "Allowed: images, PDF, ZIP, text files"}

  defp validate_size(path) do
    case File.stat(path) do
      {:ok, %{size: size}} when size <= @max_size -> :ok
      {:ok, _} -> {:error, "File too large (max 5MB)"}
      _ -> {:error, "Cannot read file"}
    end
  end
end
