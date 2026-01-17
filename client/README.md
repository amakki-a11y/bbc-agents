# Client Documentation

The frontend application for BBC Agents, built with React and Vite.

## 🏗 Architecture

The client is a Single Page Application (SPA) that interacts with the backend JSON API. It uses:
- **React**: For UI components.
- **Vite**: For fast development and building.
- **Context API**: For global state management (Auth, Theme).
- **React Router**: For client-side navigation.

## 📂 Component Structure

- **`src/api`**: HTTP client setup (Axios) and API service functions.
- **`src/components`**: Reusable UI components (Buttons, Modals, Forms).
- **`src/context`**: React Context providers (e.g., `AuthContext`).
- **`src/pages`**: Top-level page components (Login, Dashboard, TaskDetails).
- **`src/index.css`**: Global styles.

## 🚀 Available Scripts

In the project directory, you can run:

### `npm run dev`
Runs the app in development mode.\
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

### `npm run build`
Builds the app for production to the `dist` folder.

### `npm run preview`
Locally preview the production build.

### `npm run lint`
Runs ESLint to check for code quality issues.

## 🌍 Environment Variables

Create a `.env` file in this directory:

```env
VITE_API_BASE_URL=http://localhost:3000
```
- **`VITE_API_BASE_URL`**: The URL of the backend API.
