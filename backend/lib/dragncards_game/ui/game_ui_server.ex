defmodule DragnCardsGame.GameUIServer do
  @moduledoc """
  GenServer for holding GameUI state.
  """
  use GenServer
  @timeout :timer.minutes(60)

  require Logger
  alias DragnCardsGame.{Game, Card, GameUI, GameRegistry, Groups, User, Stack, Tokens, PlayerInfo}
  alias DragnCards.Users

  def is_player(gameui, user_id) do
    ids = gameui["playerInfo"]
    if Enum.member?([ids["player1"]["id"], ids["player2"]["id"], ids["player3"]["id"], ids["player4"]["id"]], user_id) do
        true
    else
        false
    end
  end

  @doc """
  start_link/3: Generates a new game server under a provided name.
  """
  @spec start_link(String.t(), User.t(), %{}) :: {:ok, pid} | {:error, any}
  def start_link(game_name, user, %{} = options) do
    Logger.debug("gameuiserver: start_link")
    GenServer.start_link(__MODULE__, {game_name, user, options}, name: via_tuple(game_name))
  end

  @doc """
  via_tuple/1: Given a game name string, generate a via tuple for addressing the game.
  """
  def via_tuple(game_name),
    do: {:via, Registry, {DragnCardsGame.GameUIRegistry, {__MODULE__, game_name}}}

  @doc """
  gameui_pid/1: Returns the `pid` of the game server process registered
  under the given `game_name`, or `nil` if no process is registered.
  """
  def gameui_pid(game_name) do
    game_name
    |> via_tuple()
    |> GenServer.whereis()
  end

  @doc """
  state/1:  Retrieves the game state for the game under a provided name.
  """
  @spec state(String.t()) :: GameUI.t() | nil
  def state(game_name) do
    case gameui_pid(game_name) do
      nil -> nil
      _ -> GenServer.call(via_tuple(game_name), :state)
    end
  end

  @doc """
  game_exists?/1:  Check if the game exists.
  """
  @spec game_exists?(String.t()) :: boolean
  def game_exists?(game_name) do
    gameui_pid(game_name) != nil
  end

  @doc """
  game_action/4: Perform given action on a card.
  """
  @spec game_action(String.t(), integer, String.t(), Map.t()) :: GameUI.t()
  def game_action(game_name, user_id, action, options) do
    game_exists?(game_name) && GenServer.call(via_tuple(game_name), {:game_action, user_id, action, options})
  end

  @doc """
  set_game_def/3: Set a new game definition.
  """
  @spec set_game_def(String.t(), integer, Map.t()) :: GameUI.t()
  def set_game_def(game_name, user_id, game_def) do
    game_exists?(game_name) && GenServer.call(via_tuple(game_name), {:set_game_def, user_id, game_def})
  end

  @doc """
  game_action/4: Perform given action on a card.
  """
  @spec step_through(String.t(), Map.t()) :: GameUI.t()
  def step_through(game_name, options) do
    game_exists?(game_name) && GenServer.call(via_tuple(game_name), {:step_through, options})
  end

  @doc """
  set_seat/4: Set a seat value.
  """
  @spec set_seat(String.t(), integer, String.t(), integer) :: GameUI.t()
  def set_seat(game_name, user_id, player_i, new_user_id) do
    game_exists?(game_name) && GenServer.call(via_tuple(game_name), {:set_seat, user_id, player_i, new_user_id})
  end

  @doc """
  add_player_to_room/2: Add a player to the room.
  """
  @spec add_player_to_room(String.t(), integer, pid()) :: GameUI.t()
  def add_player_to_room(game_name, user_id, pid) do
    GenServer.call(via_tuple(game_name), {:add_player_to_room, user_id, pid})
  end

  @doc """
  close_room/2: Shut down the GenServer.
  """
  @spec close_room(String.t(), integer) :: GameUI.t()
  def close_room(game_name, user_id) do
    GenServer.call(via_tuple(game_name), {:close_room})
  end

  @doc """
  leave/2: User just leave the room (Closed browser or clicked out).
  If they're in a seat, we need to mark them as gone.
  Maybe eventually there will be some sophisticated disconnect/reconnect
  system?
  """
  def leave(game_name, user_id, pid) do
    game_exists?(game_name) && GenServer.call(via_tuple(game_name), {:leave, user_id, pid})
  end
  #####################################
  ####### IMPLEMENTATION ##############
  #####################################

  def init({game_name, user, options = %{}}) do
    Logger.debug("gameuiserver init")
    options = put_in(options, ["language"], user.language)
    gameui =
      case :ets.lookup(:game_uis, game_name) do
        [] ->
          IO.puts("gameuiserver init 1")
          gameui = GameUI.new(game_name, user.id, options)
          :ets.insert(:game_uis, {game_name, gameui})

          IO.puts("gameuiserver init 2")
          gameui

        [{^game_name, gameui}] ->
          gameui
      end
    IO.puts("game_ui_server init")
    IO.inspect(gameui["roomSlug"])
    # path = [:code.priv_dir(:dragncards), "python", "lotrlcg"] |> Path.join()
    # {:ok, pypid} = :python.start([{:python_path, to_charlist(path)}, {:python, 'python3'}])
    # IO.puts("game_ui_server init")
    # IO.inspect(:code.priv_dir(:dragncards))
    # gameui = put_in(gameui["pypid"], :erlang.pid_to_list(pypid))
    gr = GameRegistry.add(gameui["roomSlug"], gameui)
    IO.puts("game_ui_server GameRegistry")
    IO.inspect(gr)
    #GameRegistry.add(gameui["roomName"]<>"-pypid", pypid)
    {:ok, gameui, timeout(gameui)}
  end

  def handle_call(:state, _from, state) do
    reply(state)
  end

  def handle_call({:game_action, user_id, action, options}, _from, gameui) do
    Logger.debug("handle game_action #{user_id} #{action}")
    gameui
    try do
      gameui = GameUI.game_action(gameui, user_id, action, options)
      gameui = put_in(gameui["error"], false)
      # IO.puts("pypid")
      # pypid = gameui["pypid"] |> :erlang.list_to_pid()
      # #IO.inspect(gameui["pypid"])
      # IO.puts("+==================================================================+")
      # IO.inspect(Jason.encode(gameui))
      # {status, gameui_json} = Jason.encode(gameui)
      # plugin_action = gameui["pluginId"]
      # gameui_json = :python.call(pypid, :lotrlcg_action, :increase_threat, [gameui_json])
      # IO.puts("gameui_json")
      # IO.inspect(gameui_json)
      # {status, gameui} = Jason.decode(gameui_json)
      gameui = put_in(gameui["game"]["last_action"], action)
    rescue
      exception ->
        stack_trace = System.stacktrace()
        Logger.error("Error in my_function: #{inspect exception}, stack trace: #{inspect stack_trace}")
      #e in RuntimeError ->
      #  IO.inspect(e)
        put_in(gameui["logMessages"], ["ERROR: " <> inspect(stack_trace)])
    end
    |> save_and_reply()
  end

  def handle_call({:step_through, options}, _from, gameui) do
    Logger.debug("handle step_through")
    try do
      gameui = GameUI.step_through(gameui, options)
      gameui = put_in(gameui["error"], false)
    rescue
      e in RuntimeError ->
        IO.inspect(e)
        put_in(gameui["error"],true)
    end
    |> save_and_reply()
  end

  def handle_call({:set_game_def, user_id, game_def}, _from, gameui) do
    Logger.debug("handle step_through")
    try do
      gameui = GameUI.new(gameui, user_id, gameui["options"])
      gameui = put_in(gameui["error"], false)
    rescue
      e in RuntimeError ->
        IO.inspect(e)
        put_in(gameui["error"],true)
    end
    |> save_and_reply()
  end

  def handle_call({:set_seat, user_id, player_i, new_user_id}, _from, gameui) do
    try do
      gameui = put_in(gameui["playerInfo"][player_i],PlayerInfo.new(new_user_id))
    rescue
      e in RuntimeError ->
        IO.inspect(e)
        put_in(gameui["error"],true)
    end
    |> save_and_reply()
  end

  def handle_call({:add_player_to_room, user_id, pid}, _from, gameui) do
    put_in(gameui, ["sockets", pid_to_string(pid)], user_id)
    |> save_and_reply()
  end

  def handle_call({:close_room}, _from, gameui) do
    Process.send_after(self(), :close_room, 1000)
    gameui |> save_and_reply()
  end

  def handle_info(:close_room, state) do
    {:stop, :normal, state}
  end

  defp reply(new_gameui) do
    {:reply, new_gameui, new_gameui, timeout(new_gameui)}
  end

  defp save_and_reply(new_gameui) do
    # Async GameRegistry.update Should improve performance,
    # but causes tests to fail.  Not sure it's a real failure
    # spawn_link(fn ->

    GameRegistry.update(new_gameui["roomSlug"], new_gameui)
    # end)

    spawn_link(fn ->
      :ets.insert(:game_uis, {new_gameui["roomSlug"], new_gameui})
    end)

    {:reply, new_gameui, new_gameui, timeout(new_gameui)}
  end

  # timeout/1
  # Given the current state of the game, what should the
  # GenServer timeout be? (Games with winners expire quickly)
  defp timeout(_state) do
    @timeout
  end

  def handle_call({:leave, user_id, pid}, _from, gameui) do
    Map.delete(gameui, ["sockets", pid_to_string(pid)])
    |> save_and_reply()
  end

  # When timing out, the order is handle_info(:timeout, _) -> terminate({:shutdown, :timeout}, _)
  def handle_info(:timeout, state) do
    {:stop, {:shutdown, :timeout}, state}
  end

  def terminate({:shutdown, :timeout}, state) do
    Logger.info("Terminate (Timeout) running for #{state["roomSlug"]}")
    :ets.delete(:game_uis, state["roomSlug"])
    GameRegistry.remove(state["roomSlug"])
    :ok
  end

  # Do I need to trap exits here?
  def terminate(_reason, state) do
    Logger.info("Terminate (Non Timeout) running for #{state["roomSlug"]}")
    GameRegistry.remove(state["roomSlug"])
    :ok
  end

  def pid_to_string(pid) do
    list = pid |> :erlang.pid_to_list()
    to_string(list)
  end
end
