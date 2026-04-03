import { AppProviders } from "@app/providers/app-providers";
import { AppRouterProvider } from "@app/router";

function App() {
  return (
    <AppProviders>
      <AppRouterProvider />
    </AppProviders>
  );
}

export default App;
