Phase 0: Setup & Foundation

Task 0.1: Technology Selection & Setup (Covered by Initial Prompt)

Task 0.2: Management Backend Hosting (Manual Task)

(User Action) Provision VPS, secure it, install Node.js/Python, Git.

Task 0.3: Secure Backend-to-WG Server SSH

[ ] (Manual) Generate SSH key pair for the backend. Add public key to one test WG server's authorized_keys.

[ ] Backend: Install SSH library (ssh2 or paramiko).

[ ] Backend: Implement utility function loadSshPrivateKey() to securely load the private key (from environment variable SSH_PRIVATE_KEY_STRING or file path SSH_PRIVATE_KEY_PATH). Handle errors if the key is missing or invalid. (Rule #4)

[ ] Backend: Implement utility function createSshConnection(host, username, privateKey) that takes server details and the loaded private key, establishes an SSH connection, and returns the connection object/client. Include robust error handling for connection failures (timeout, auth failure, host not found). (Rule #5)

[ ] Backend: Implement utility function executeSshCommand(connection, command) that takes an active SSH connection and a command string, executes it remotely, and returns the stdout/stderr. Handle command execution errors. (Rule #5)

Task 0.4: Basic API Setup

[ ] Backend: Create a simple /health GET endpoint that returns { status: 'ok' }.

[ ] Backend: Implement middleware or decorator to check for a valid Authorization: Bearer <API_SECRET_KEY> header on all incoming requests (except potentially /health). Load API_SECRET_KEY from environment variables. Respond with 401/403 if invalid/missing. (Rule #4)

[ ] Frontend (Vercel API): Create Next.js API route pages/api/health.ts.

[ ] Frontend (Vercel API): Implement logic in /api/health to make a GET request to the Management Backend's /health endpoint (URL from process.env.NEXT_PUBLIC_MANAGEMENT_BACKEND_URL). Include the required Authorization header (using a secret stored in Vercel environment variables, e.g., MANAGEMENT_BACKEND_API_KEY). Handle fetch errors. Return the status from the backend or an error status. (Rule #5)

Task 0.5: Initial Deployment (Manual/Semi-Automated)

[ ] (Manual) Set up Vercel project, link Git repo.

[ ] (Manual) Configure Vercel environment variables (NEXT_PUBLIC_MANAGEMENT_BACKEND_URL, MANAGEMENT_BACKEND_API_KEY).

[ ] (Manual) Deploy Frontend to Vercel.

[ ] (Manual) Set up deployment for Management Backend on VPS (e.g., using PM2/Docker/Systemd, configure environment variables PORT, API_SECRET_KEY, SSH_PRIVATE_KEY_STRING/PATH).

[ ] (Manual) Test the /api/health endpoint on the deployed Vercel app.

Phase 1: MVP - Read-Only Dashboard

Task 1.1: Management Backend - Fetch WG Status

[ ] Backend: Define a JSON structure for representing wg show output (e.g., interface details, peer list with keys, IPs, handshake, transfer).

[ ] Backend: Create utility function parseWgShowOutput(outputString) that takes the raw output of wg show and returns the defined JSON structure. Handle potential parsing errors robustly.

[ ] Backend: Create a new authenticated GET endpoint /api/servers/{serverId}/status.

[ ] Backend: Inside the endpoint, retrieve server connection details (host, user) based on serverId (using the config from Task 1.2).

[ ] Backend: Call loadSshPrivateKey(), createSshConnection(), executeSshCommand(connection, 'sudo wg show [interface_name]'). Remember to get interface_name from config. Handle errors at each step. Ensure the connection is closed properly. (Rule #5)

[ ] Backend: Call parseWgShowOutput() on the command result.

[ ] Backend: Return the parsed JSON status or an appropriate error response.

Task 1.2: Server Configuration Storage

[ ] Backend: Create a simple servers.json file (or similar config) mapping serverId (e.g., "server-1") to { host: "...", username: "...", interfaceName: "wg0" }.

[ ] Backend: Implement a utility function getServerConfig(serverId) to load and return the config for a given ID.

[ ] Backend: Implement a utility function getAllServerConfigs() to return a list of all configured servers (just IDs and maybe friendly names).

Task 1.3: Vercel API Layer - Proxy Status Request

[ ] Frontend (Vercel API): Create dynamic API route pages/api/servers/[serverId]/status.ts.

[ ] Frontend (Vercel API): Get serverId from the request query. Validate it.

[ ] Frontend (Vercel API): Make an authenticated GET request to the Management Backend (/api/servers/{serverId}/status). Handle errors.

[ ] Frontend (Vercel API): Return the JSON response from the backend.

[ ] Frontend (Vercel API): Create API route pages/api/servers/index.ts to fetch the list of server IDs/names from the Management Backend (requires a new simple endpoint on the backend, e.g., GET /api/servers).

Task 1.4: Frontend - Display Server List & Status

[ ] Frontend: Create basic UI layout using chosen component library (e.g., ResizablePanelGroup from Shadcn/UI for sidebar/main).

[ ] Frontend: Create a ServerList component. Fetch server list from /api/servers on component mount (useEffect). Display server IDs/names. Handle loading/error states.

[ ] Frontend: Implement state to track the currently selected serverId. Update state when a server is clicked in ServerList.

[ ] Frontend: Create a ServerStatusDisplay component. When selectedServerId changes, fetch status from /api/servers/[serverId]/status.

[ ] Frontend: Display the fetched status information clearly (interface details, table for peers). Use components like Card, Table from the UI library. Handle loading/error states.

Task 1.5: Deployment & Testing (Manual/Semi-Automated)

[ ] Deploy updates. Test fetching status for the configured test server.

Phase 2: Peer Management & Basic Controls

Task 2.1: Management Backend - Add Peer Logic

[ ] Backend: Install necessary libraries for config file editing if needed (or use standard file I/O carefully).

[ ] Backend: Implement utility function generateWgKeyPair() using wg genkey | wg pubkey.

[ ] Backend: Implement utility function addPeerToConfig(filePath, peerConfig):

Reads the config file content.

Safely appends a correctly formatted [Peer] section. Consider edge cases (file not found, permissions).

Writes the modified content back. Crucial: Implement backup/restore or locking mechanism. (Rule #4)

[ ] Backend: Implement utility function restartWgInterface(connection, interfaceName) using executeSshCommand with sudo systemctl restart wg-quick@<interfaceName> or sudo wg-quick down <interfaceName> && sudo wg-quick up <interfaceName>. Handle errors.

[ ] Backend: Create authenticated POST endpoint /api/servers/{serverId}/peers. Accept peer details (e.g., { description: "..." }).

[ ] Backend: Inside the endpoint: Get server config, generate key pair, determine next available IP (Task 2.3), construct peer config section, connect via SSH, call addPeerToConfig, call restartWgInterface. Handle errors throughout.

[ ] Backend: Return the full client config details (private key, address, server public key, endpoint, etc.).

Task 2.2: Management Backend - Remove Peer Logic

[ ] Backend: Implement utility function removePeerFromConfig(filePath, peerPublicKey):

Reads config file content line by line or using a parser.

Safely removes the entire [Peer] section matching the public key.

Writes the modified content back (with backup/locking). (Rule #4)

[ ] Backend: Create authenticated DELETE endpoint /api/servers/{serverId}/peers/{peerPublicKey}.

[ ] Backend: Inside the endpoint: Get server config, connect via SSH, call removePeerFromConfig, call restartWgInterface. Handle errors. Return success/failure status.

Task 2.3: IP Address Management

[ ] Backend: Implement utility function getNextAvailableIp(filePath, subnetCidr):

Parses the WG config file to find all AllowedIPs in [Peer] sections.

Determines the next available IP address within the given subnet (e.g., 10.0.0.0/24). Handle IP allocation logic carefully.

Task 2.4: Vercel API Layer - Proxy Peer Management

[ ] Frontend (Vercel API): Create pages/api/servers/[serverId]/peers/index.ts (for POST). Proxy request to backend.

[ ] Frontend (Vercel API): Create pages/api/servers/[serverId]/peers/[peerPublicKey].ts (for DELETE). Proxy request to backend. Validate inputs (serverId, peerPublicKey, request body for POST).

Task 2.5: Frontend - Peer Management UI

[ ] Frontend: Add an "Add Peer" button/dialog to ServerStatusDisplay. Include a form for optional description. Call the POST API endpoint on submit. Display success/error messages. Show the generated client config details.

[ ] Frontend: Add a "Remove" button next to each peer in the peers table. Add confirmation dialog. Call the DELETE API endpoint on confirmation. Refresh the status display on success/error.

Task 2.6: (Optional) Client Config Download & QR Code

[ ] Backend: Add endpoint to generate .conf file content for a given peer.

[ ] Frontend (Vercel API): Add API route to proxy this request. Set correct Content-Disposition header for download.

[ ] Frontend: Add "Download Config" button.

[ ] Frontend: Install QR code generation library (e.g., qrcode.react). Add button/modal to display QR code generated from the .conf file content.

Task 2.7: Deployment & Testing (Manual/Semi-Automated)

[ ] Deploy updates. Test adding/removing peers. Verify server config file changes and interface restarts.

Phase 3: Enhancements & Polish (Lower Priority for Initial AI Pass)

(Tasks 3.1 - 3.6 can be requested as follow-up prompts after the MVP and Peer Management phases are stable)

Task 3.1 (Dashboard Auth): Requires integrating an auth solution like NextAuth.js.

Task 3.2 (Logging/Error Handling): Refine error messages, add logging framework to backend.

Task 3.3 (Server Management): Requires backend endpoints and UI to manage the servers.json config (or database).

Task 3.4 (Server Controls): Add backend endpoints/logic for start/stop/restart commands and corresponding UI buttons.

Task 3.5 (UI/UX): Refine styles, add loading spinners, visual cues for peer status.

Task 3.6 (Security Hardening): Review code, add rate limiting, refine permissions.