import AppRouter from "./app/router";
import AnalyticsRouteListener from "./shared/analytics/AnalyticsRouteListener";

function App() {
  return (
    <>
      <AnalyticsRouteListener />
      <AppRouter />
    </>
  );
}

export default App;
