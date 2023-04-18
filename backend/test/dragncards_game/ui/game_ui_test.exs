defmodule DragnCardsGame.GameUiTest do
  use ExUnit.Case, async: true
  use DragnCardsWeb.ConnCase
  alias DragnCards.{Plugins, Plugins.Plugin, Repo}
  alias DragnCards.Users.User
  import Ecto.Query
  alias Jason

  alias DragnCardsGame.{GameUI, Game, Evaluate}

  import ExUnit.Callbacks

  setup do
    user = Repo.one(from u in DragnCards.Users.User, limit: 1)
    plugin_id = 3

    plugin = Repo.one(from p in Plugin, where: p.id == ^plugin_id)
    card_db = plugin.card_db

    options = %{"pluginId" => plugin_id}

    gameui = GameUI.new("game_name", user, options)

    {:ok, file_content} = File.read("../frontend/src/features/plugins/lotrlcg/definitions/gameDefWotR.json")

    game_def = case Jason.decode(file_content) do
      {:ok, json_map} ->
        json_map
      {:error, reason} ->
        IO.puts("Error decoding JSON: #{reason}")
    end

    gameui = put_in(gameui["game"]["gameDef"], game_def)

    # Load a deck
    cards = plugin.game_def["preBuiltDecks"]["Trilogy"]["cards"]
    cards =
      Enum.map(cards, fn item ->
        %{
          "uuid" => item["uuid"],
          "quantity" => item["quantity"],
          "cardDetails" => card_db[item["uuid"]],
          "loadGroupId" => String.replace(item["loadGroupId"], "playerN", "player1")
        }
      end)
    gameui = GameUI.game_action(gameui, user.id, "load_cards", %{"load_list" => cards})

    # Return a tuple with the GameUI instance and the fetched user
    {:ok, %{gameui: gameui, user: user, plugin: plugin}}
  end



  test "GameUI initializes with the correct name", %{gameui: gameui, user: user} do
    # Get the game name from the GameUI instance in the setup block
    assert gameui["roomName"] == "game_name"
  end

  test "Load cards", %{gameui: gameui, user: user, plugin: plugin} do
    # Get the game name from the GameUI instance in the setup block
    assert Enum.count(gameui["game"]["groupById"]["player1Deck"]["stackIds"]) > 0
  end

  test "Aragorn trigger", %{gameui: gameui, user: user, plugin: plugin} do
    game = gameui["game"]
    card_by_id = game["cardById"]
    aragorn_card_db_id = "a6cdd8d3-cd6e-4d1a-908b-2f788fbb357e"
    strider_card_db_id = "f88cd1e7-0e1e-40d9-91bc-990ba64c5bc3"

    aragorn_card = Evaluate.evaluate(game, ["ONE_CARD", ["EQUAL", "$CARD.cardDbId", aragorn_card_db_id]])
    strider_card = Evaluate.evaluate(game, ["ONE_CARD", ["EQUAL", "$CARD.cardDbId", strider_card_db_id]])

    assert strider_card["groupId"] != "player3Eliminated"

    game = Evaluate.evaluate(game, ["MOVE_CARD", aragorn_card["id"], "player3Reserve", 0])

    strider_card = Evaluate.evaluate(game, ["ONE_CARD", ["EQUAL", "$CARD.cardDbId", strider_card_db_id]])
    # IO.inspect("strider 1")
    # IO.inspect(strider_card)
    # IO.inspect("strider 2")

    assert strider_card["groupId"] == "player3Eliminated"
  end


  test "Aragorn passive", %{gameui: gameui, user: user, plugin: plugin} do
    game = gameui["game"]
    card_by_id = game["cardById"]
    aragorn_card_db_id = "a6cdd8d3-cd6e-4d1a-908b-2f788fbb357e"
    knights_card_db_id = "fe77aaef-a595-47a8-bb0d-4d5796234fec"

    aragorn_card = Evaluate.evaluate(game, ["ONE_CARD", ["EQUAL", "$CARD.cardDbId", aragorn_card_db_id]])
    knights_card = Evaluate.evaluate(game, ["ONE_CARD", ["EQUAL", "$CARD.cardDbId", knights_card_db_id]])

    assert aragorn_card["tokens"]["attackBlue"] == nil

    game = Evaluate.evaluate(game, ["MOVE_CARD", aragorn_card["id"], "player3Reserve", 0])

    aragorn_card = Evaluate.evaluate(game, ["ONE_CARD", ["EQUAL", "$CARD.cardDbId", aragorn_card_db_id]])
    assert aragorn_card["tokens"]["attackBlue"] == nil

    game = Evaluate.evaluate(game, ["MOVE_CARD", knights_card["id"], "player1Reserve", 0])

    aragorn_card = Evaluate.evaluate(game, ["ONE_CARD", ["EQUAL", "$CARD.cardDbId", aragorn_card_db_id]])
    assert aragorn_card["tokens"]["attackBlue"] == nil

    game = Evaluate.evaluate(game, ["MOVE_CARD", knights_card["id"], "player3Reserve", 0])

    aragorn_card = Evaluate.evaluate(game, ["ONE_CARD", ["EQUAL", "$CARD.cardDbId", aragorn_card_db_id]])
    assert aragorn_card["tokens"]["attackBlue"] == 1

    game = Evaluate.evaluate(game, ["MOVE_CARD", knights_card["id"], "player1Reserve", 0])

    aragorn_card = Evaluate.evaluate(game, ["ONE_CARD", ["EQUAL", "$CARD.cardDbId", aragorn_card_db_id]])
    assert aragorn_card["tokens"]["attackBlue"] == 0

  end

  test "Infinite trigger loop", %{gameui: gameui, user: user, plugin: plugin} do
    game = gameui["game"]
    card_by_id = game["cardById"]
    aragorn_card_db_id = "a6cdd8d3-cd6e-4d1a-908b-2f788fbb357e"
    knights_card_db_id = "fe77aaef-a595-47a8-bb0d-4d5796234fec"

    aragorn_card = Evaluate.evaluate(game, ["ONE_CARD", ["EQUAL", "$CARD.cardDbId", aragorn_card_db_id]])

    assert aragorn_card["tokens"]["defenseBlue"] == nil
    game = Evaluate.evaluate_with_timeout(game,
      ["FOR_EACH_START_STOP_STEP", "$i", 0, 10000, 1,
        ["GAME_INCREASE_VAL", "/cardById/" <> aragorn_card["id"] <> "/tokens/defenseBlue", 1]
      ])
    aragorn_card = Evaluate.evaluate(game, ["ONE_CARD", ["EQUAL", "$CARD.cardDbId", aragorn_card_db_id]])

    assert aragorn_card["tokens"]["defenseBlue"] == nil
    assert Enum.count(game["messages"]) == 1

  end

  test "Peeking", %{gameui: gameui, user: user, plugin: plugin} do
    game = gameui["game"]
    card_by_id = game["cardById"]
    aragorn_card_db_id = "a6cdd8d3-cd6e-4d1a-908b-2f788fbb357e"

    aragorn_card_id = Evaluate.evaluate(game, ["ONE_CARD", ["EQUAL", "$CARD.cardDbId", aragorn_card_db_id]])["id"]

    game = Evaluate.evaluate(game, ["MOVE_CARD", aragorn_card_id, "player3Deck", 0])

    assert game["cardById"][aragorn_card_id]["peeking"]["player3"] == nil

    game = Evaluate.evaluate(game, ["MOVE_CARD", aragorn_card_id, "player3Hand", 0])

    assert game["cardById"][aragorn_card_id]["peeking"]["player3"] == true

    game = Evaluate.evaluate(game, ["MOVE_CARD", aragorn_card_id, "player3Reserve", 0])

    assert game["cardById"][aragorn_card_id]["peeking"]["player3"] == nil

    game = Evaluate.evaluate(game, ["MOVE_CARD", aragorn_card_id, "player3Hand", 0])

    assert game["cardById"][aragorn_card_id]["peeking"]["player3"] == true

    game = Evaluate.evaluate(game, ["MOVE_CARD", aragorn_card_id, "player3Deck", 0])

    assert game["cardById"][aragorn_card_id]["peeking"]["player3"] == nil

    game = Evaluate.evaluate(game, ["MOVE_CARD", aragorn_card_id, "player2Hand", 0])

    assert game["cardById"][aragorn_card_id]["peeking"]["player2"] == true

    game = Evaluate.evaluate(game, ["MOVE_CARD", aragorn_card_id, "player3Reserve", 0])

    assert game["cardById"][aragorn_card_id]["peeking"]["player2"] == nil

    game = Evaluate.evaluate(game, ["GAME_SET_VAL", "/cardById/" <> aragorn_card_id <> "/peeking/player3", true])

    assert game["cardById"][aragorn_card_id]["peeking"]["player3"] == true

    game = Evaluate.evaluate(game, ["MOVE_CARD", aragorn_card_id, "player2Reserve", 0])

    assert game["cardById"][aragorn_card_id]["peeking"]["player3"] == true

  end

end