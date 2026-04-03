import { AppProviders } from "@app/providers/app-providers";
import { AppRouterProvider } from "@app/router";
import { useUpdater } from "@features/updater/use-updater";

function App() {
  useUpdater();

  return (
    <AppProviders>
      <AppRouterProvider />
    </AppProviders>
  );
}

export default App;
