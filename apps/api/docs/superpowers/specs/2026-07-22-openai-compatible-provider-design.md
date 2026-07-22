# OpenAI Compatible Provider Design

## Goal

Let an authenticated Toonflow user add an OpenAI-compatible relay provider by
entering a provider name, base URL, and API key, then import models returned by
the relay's `GET /models` endpoint.

## User Flow

1. In Model Providers, the user selects the new OpenAI Compatible Relay option.
2. They enter a name, base URL, and API key and request the model list.
3. Toonflow calls the relay from its backend with a Bearer token, then shows the
   returned model IDs.
4. The user selects models and assigns each one a Toonflow type: text, image, or
   video. Existing per-type capability controls remain available.
5. On import, Toonflow saves an ordinary vendor script and model records. The
   existing Agent and production model selectors use those records unchanged.

## Architecture

The backend exposes an authenticated `fetchModels` endpoint. It validates the
base URL, normalizes it to a single `/models` URL, forwards the API key only in
the request Authorization header, and returns a normalized, de-duplicated list
of model IDs. The key is neither logged nor persisted by that endpoint.

The frontend adds a relay form to the existing provider-add dialog. It calls the
endpoint, lets the user classify selected entries, and creates a vendor using a
generated OpenAI-compatible adapter. Imported models are persisted through the
existing add-model endpoint.

## Error Handling And Safety

- Only `http:` and `https:` base URLs are accepted, with no embedded credentials.
- Missing credentials, unsupported response shapes, non-OK provider responses,
  and empty model lists produce actionable messages.
- A failed request keeps the user's entered values and previously fetched list.
- Model types are selected by the user because `/models` responses do not have a
  dependable cross-provider modality field.

## Verification

- Unit tests cover base URL normalization and OpenAI `/models` response parsing.
- A backend route test covers authenticated relay forwarding without exposing the
  API key in the response.
- Frontend type checking verifies the new configuration UI.
