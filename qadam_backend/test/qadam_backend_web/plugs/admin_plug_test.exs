defmodule QadamBackendWeb.Plugs.AdminPlugTest do
  use QadamBackendWeb.ConnCase, async: true

  alias QadamBackendWeb.Plugs.AdminPlug

  @admin_wallet "AdminWallet1111111111111111111111111111111"
  @non_admin_wallet "RegularUser1111111111111111111111111111111"

  setup do
    # Configure admin wallets for tests
    original = Application.get_env(:qadam_backend, :admin_wallets, [])
    Application.put_env(:qadam_backend, :admin_wallets, [@admin_wallet])
    on_exit(fn -> Application.put_env(:qadam_backend, :admin_wallets, original) end)
    :ok
  end

  test "allows admin wallet through", %{conn: conn} do
    conn = conn |> Plug.Conn.assign(:current_wallet, @admin_wallet)
    result = AdminPlug.call(conn, [])
    refute result.halted
  end

  test "blocks non-admin wallet with 403", %{conn: conn} do
    conn = conn |> Plug.Conn.assign(:current_wallet, @non_admin_wallet)
    result = AdminPlug.call(conn, [])
    assert result.halted
    assert result.status == 403
  end

  test "blocks unauthenticated request (no wallet)", %{conn: conn} do
    result = AdminPlug.call(conn, [])
    assert result.halted
    assert result.status == 403
  end

  test "supports multiple admin wallets" do
    second_admin = "AdminWallet2222222222222222222222222222222"
    Application.put_env(:qadam_backend, :admin_wallets, [@admin_wallet, second_admin])

    conn = build_conn() |> Plug.Conn.assign(:current_wallet, second_admin)
    result = AdminPlug.call(conn, [])
    refute result.halted
  end
end
