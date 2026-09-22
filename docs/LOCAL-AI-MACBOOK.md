# M1: network MacBook and local models

`M1` is the canonical project name for this network MacBook. Use this reference when controlling M1 or using its local Ollama models. The inventory was last verified on 2026-09-21; live commands remain authoritative.

## Device identity and access

- SSH alias: `M1` (`new-macbook` remains as a compatibility alias)
- Primary command: `ssh M1`
- Account: `new`
- mDNS name: `MacBook-Pro-2.local` (`LocalHostName`: `MacBook-Pro-2`)
- Hardware: `MacBookPro18,2`, Apple M1 Max, 32 GiB unified memory
- SSH ED25519 **server** fingerprint: `SHA256:e2GtnqVZpq4rDNvFsAayCsdu1iSqkFoX8CJCkxazwcM`

The aliases, dedicated identity key, and IPv4 preference are configured in the current user's `~/.ssh/config`. Preserve that configuration and key. Never print or commit private-key contents, passwords, or a DHCP-assigned IP address. Prefer mDNS because the IP can change. The IPv4 preference avoids intermittent link-local IPv6 timeouts.

Before a state-changing operation, verify that the connection still reaches this device:

```sh
ssh M1 'printf "user=%s\n" "$USER"; scutil --get LocalHostName; sysctl -n hw.model; ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub'
```

Expected identity: user `new`, local host `MacBook-Pro-2`, model `MacBookPro18,2`, and the server fingerprint above. Stop if these do not all match.

Remote Login and Remote Management are enabled. The separate Screen Sharing toggle can be disabled with “this service is currently being controlled by a remote management service”; that means Remote Management owns screen sharing, not that GUI access is unavailable. For GUI control, connect Screen Sharing or Apple Remote Desktop to `MacBook-Pro-2.local`. Its launch daemons are on demand, so a `not running` state while idle is normal.

## Ollama

Ollama runs as a daemon on the MacBook. Its CLI is not assumed to be on `PATH`:

```sh
/Applications/Ollama.app/Contents/Resources/ollama
```

The API is available on the MacBook at `http://127.0.0.1:11434`. Execute CLI or API calls through SSH; do not expose the API to the LAN merely for convenience.

Useful checks:

```sh
ssh M1 '/Applications/Ollama.app/Contents/Resources/ollama list'
ssh M1 '/Applications/Ollama.app/Contents/Resources/ollama ps'
ssh M1 '/Applications/Ollama.app/Contents/Resources/ollama show qwen3.8:27b-mlx'
```

### Installed-model snapshot

| Model | Size | Parameters | Context | Quantization | Capabilities | Runtime check |
|---|---:|---:|---:|---|---|---|
| `qwen3.8:27b-mlx` | 18 GB | 27.8B | 262,144 | NVFP4 | text, vision, tools, thinking | Passed generation (`OK`) |
| `muse-glimmer:30b-mlx` | 19 GB | 32.3B | 131,072 | NVFP4 | text, vision, tools, thinking | Passed generation (`OK`) |
| `gemma4:31b-mlx` | 19 GB | 31.7B | 262,144 | NVFP4 | text, vision, tools, thinking | Passed generation (`OK`) |
| `gemma4:26b` | 17 GB | 25.8B | 262,144 | Q4_K_M | text, vision, tools, thinking | Pre-existing; no recent smoke test |

The first three models were pulled, checksum-verified by Ollama, and smoke-tested through `/api/generate` on 2026-09-21. Tests used `stream: false`, `think: false`, and `keep_alive: 0`, so successful tests unloaded the models afterward. Muse can consume more than 16 output tokens before visible text even with thinking disabled; allow at least `num_predict: 128` for its smoke test.

Use `ollama list` and `ollama show MODEL` for current inventory and metadata. Models load into unified memory on demand; an empty `ollama ps` means they are installed but currently unloaded, not unavailable. Use `ollama stop MODEL` when a persistent session should be unloaded.
