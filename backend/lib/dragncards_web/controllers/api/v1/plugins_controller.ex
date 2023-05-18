defmodule DragnCardsWeb.PluginsController do
  use DragnCardsWeb, :controller
  import Ecto.Query

  alias DragnCards.{Plugins, Plugins.Plugin, Repo}

  action_fallback DragnCardsWeb.FallbackController

  def index(conn, _params) do
    conn
    plugins = Plugins.list_plugins_info()
    render(conn, "index.json", plugins: plugins)
    #json(conn, %{plugins: nil})
  end

  @spec show(Conn.t(), map()) :: Conn.t()
  def show(conn, %{"plugin_id" => plugin_id}) do
    conn
  end

  def get_plugin(conn, params) do
    IO.puts("get_plugin 1")
    IO.inspect(params)
    {plugin_id, ""} = Integer.parse(params["plugin_id"])
    IO.puts("get_plugin 2")
    IO.inspect(plugin_id)
    plugin = Repo.get_by(Plugin, id: plugin_id)
    IO.puts("get_plugin 3")
    IO.inspect(plugin.id)
    render(conn, "single.json", plugin: plugin)
  end

end
