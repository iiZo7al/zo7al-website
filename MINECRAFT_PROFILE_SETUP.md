# Current player rank in the cart

The skin button opens an interactive 3D character inside the existing cart drawer. Skins load from MCHeads; the entered username is not an authenticated login. Player names are saved only on this device. No rank is inferred from cart contents or Tebex purchase history.

To show the actual current rank, connect a read-only HTTPS endpoint on your server backend that reads the player's current LuckPerms primary/display group:

- `MINECRAFT_PROFILE_URL`: trusted backend endpoint, e.g. `https://your-backend.example/player-profile`.
- `MINECRAFT_PROFILE_TOKEN`: optional server-side bearer token used to authenticate this website to that endpoint. Never use a `NEXT_PUBLIC_` variable for the token.

The website sends `GET <endpoint>?username=iiZo7al`. The backend must return JSON containing the matching username and a plain-text rank (maximum 64 characters), for example:

```json
{"username":"iiZo7al","rank":"OWNER"}
```

Use the actual in-game rank, including a default rank only when confirmed. Return `rank: null` for unknown players. Do not expose purchase records, private account information or administrator operations. Username lookup is public; apply rate limiting at the backend. Responses are cached server-side for 60 seconds and requests time out after 4 seconds. Redirects are rejected.

Without this bridge, or if the lookup fails, the UI honestly shows “Rank unavailable”. Adding these environment variables alone does not create the server-side LuckPerms endpoint. No server/plugin configuration has been changed by this PR.

MCHeads may not resolve every offline or Bedrock account skin. The viewer displays an error if skin loading or WebGL fails; checkout remains available.
