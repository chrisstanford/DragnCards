  defmodule DragnCardsGame.Game do
  @moduledoc """
  Represents a game of dragncards.
  In early stages of the app, it only represents a
  some toy game used to test everything around it.
  """
  import Ecto.Query
  alias DragnCardsGame.{Groups, Game, PlayerData}
  alias DragnCards.{Repo, Replay, Plugins}

  @type t :: Map.t()

  @doc """
  load/2:  Create a game with specified options.
  """
  @spec load(String.t(), Map.t()) :: Game.t()
  def load(room_slug, options) do
    game_def = Plugins.get_game_def(options["pluginId"])
    game = if options["replayId"] != nil and options["replayId"] != "" do
      gameid = options["replayId"]
      query = Ecto.Query.from(e in Replay,
        where: e.uuid == ^gameid,
        order_by: [desc: e.inserted_at],
        limit: 1)
      replay = Repo.one(query)
      if replay.game_json do replay.game_json else Game.new(room_slug, options) end
      # TODO: Set room name
    else
      Game.new(room_slug, options)
    end
    # Refresh id so that replay does not get overwritten
    put_in(game["id"], Ecto.UUID.generate)
  end

  @doc """
  new/2:  Create a game with specified options.
  """
  @spec new(String.t(), Map.t()) :: Game.t()
  def new(room_slug, options) do
    IO.puts("game new 1")
    game_def = Plugins.get_game_def(options["pluginId"])
    default_layout_info = Enum.at(game_def["layoutMenu"],0)
    layout_id = default_layout_info["layoutId"]
    base = %{
      "id" => Ecto.UUID.generate,
      "roomSlug" => room_slug,
      "roomName" => room_slug,
      "pluginId" => options["pluginId"],
      "pluginVersion" => options["pluginVersion"],
      "numPlayers" => default_layout_info["numPlayers"],
      "roundNumber" => 0,
      "layoutId" => layout_id,
      "layoutVariants" => game_def["layouts"][layout_id]["defaultVariants"] || %{},
      "firstPlayer" => "player1",
      "stepIndex" => 0,
      "groupById" => Groups.new(game_def["groups"]),
      "stackById" => %{},
      "cardById"  => %{},
      "options" => options,
      "variables" => %{},
      "automation" => %{},
      "messages" => [] # These messages will be delivered to the GameUi parent, which will then relay them to chat
    }
    IO.puts("game new 2")
    # Add player data
    player_data = %{}
    player_data = Enum.reduce(1..game_def["maxPlayers"], player_data, fn(n, acc) ->
      put_in(acc["player"<>Integer.to_string(n)], PlayerData.new(game_def))
    end)
    base = put_in(base["playerData"], player_data)
    # Add custom properties
    game = Enum.reduce(game_def["gameProperties"], base, fn({key,val}, acc) ->
      put_in(acc[key], val["default"])
    end)
  end


end
