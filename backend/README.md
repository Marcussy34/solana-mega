# Project Setup: WSL + Cursor

This guide outlines the steps to set up and open this project using Windows Subsystem for Linux (WSL) and the Cursor editor.

## Prerequisites

*   WSL installed (e.g., Ubuntu distribution).
*   Cursor installed on Windows.

## Setup via Terminal (Recommended)

1.  **Open your WSL Terminal** (e.g., Ubuntu).

2.  **Navigate to the project directory**:
    ```bash
    # Replace /home/marcu with your actual WSL home directory if different
    cd /home/marcu/projects/solana-mega
    ```

3.  **Open the project in Cursor**:
    ```bash
    code .
    ```

    This command will:
    *   Launch Cursor if it's not running.
    *   Connect the Cursor instance to your WSL environment.
    *   Open the current project folder (`/home/marcu/projects/solana-mega`).

    Any terminal opened within Cursor (`Terminal > New Terminal`) will now operate within the WSL environment, ready for project-specific commands (`anchor`, `git`, `npm`, etc.).

## Setup via Cursor UI

1.  **Open Cursor** on Windows.
2.  **Connect to WSL**:
    *   Click the green remote connection button (usually `><`) in the bottom-left corner.
    *   Select "Connect to WSL" from the command palette.
3.  **Open the project folder**:
    *   Once connected to WSL, go to `File > Open Folder...`.
    *   Navigate to and select the project directory (`/home/marcu/projects/solana-mega`) within the WSL filesystem.

Using the `code .` command in the terminal is generally the faster method. 