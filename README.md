# Quick Copy - Smart Clipboard Manager

A premium, aesthetic, and persistent clipboard manager built with React, Vite, and Tailwind CSS. Organizes your important links and text snippets with reorderable lists, pinning, and instant copy/save functionality.

![ScreenShot](https://via.placeholder.com/800x400?text=Quick+Copy+Interface)

## Features

- **📋 One-Click Copy**: Click any row to instantly copy its content to your clipboard.
- **💾 Persistence**: Automatically saves your data to browser cookies/local storage, surviving page refreshes.
- **📌 Pinning System**: Pin important items to the top of your list for quick access.
- **🔄 Drag & Drop**: Reorder your items intuitively by holding and dragging (powered by `@dnd-kit`).
- **✏️ Inline Editing**: Edit labels and values directly within the list.
- **📂 Smart Sorting**: Sort by Name, Date Created, or Custom order.
- **🎨 Premium UI**: A sleek, dark-themed interface designed with glassmorphism and smooth animations.

## Tech Stack

- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Heroicons](https://heroicons.com/)
- **Drag & Drop**: [@dnd-kit/core](https://dndkit.com/)

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd copy-paste
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```

4.  Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

## Usage Guide

- **Add Item**: Click the "+ Add Entry" button at the top.
- **Edit**: Click the pencil icon on a row to edit text. Click the checkmark (or "Save Changes" button) to save.
- **Reorder**: Click *and hold* a row for ~150ms to pick it up, then drag it to a new position.
- **Delete**: Click the trash icon to remove an item.
- **Save**: Changes are often saved automatically on action completion, or manually via the "Save Changes" button.

## License

This project is open source and available under the [MIT License](LICENSE).
