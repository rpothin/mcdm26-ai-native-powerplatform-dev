import { Navigate, Route, HashRouter, Routes } from 'react-router-dom'
import { NavShell } from './components/NavShell/NavShell'
import { SubmitScreen } from './screens/SubmitScreen'
import { BrowseScreen } from './screens/BrowseScreen'
import { MapScreen } from './screens/MapScreen'
import { LeaderboardsScreen } from './screens/LeaderboardsScreen'
import { ChatScreen } from './screens/ChatScreen'

/**
 * Phase 0 nav shell: Submit / Browse / Map / Leaderboards, plus a disabled
 * "coming soon" Chat entry reserved for the embedded conversational agent
 * (wired in a later phase via agent-implementation). Screens are placeholder
 * empty states until their respective build phases land.
 *
 * HashRouter is used (not BrowserRouter) because the app is hosted by the
 * Power Apps player, which does not support arbitrary deep-link server
 * routing for client-side paths.
 */
function App() {
  return (
    <HashRouter>
      <NavShell>
        <Routes>
          <Route path="/" element={<Navigate to="/submit" replace />} />
          <Route path="/submit" element={<SubmitScreen />} />
          <Route path="/browse" element={<BrowseScreen />} />
          <Route path="/map" element={<MapScreen />} />
          <Route path="/leaderboards" element={<LeaderboardsScreen />} />
          <Route path="/chat" element={<ChatScreen />} />
          <Route path="*" element={<Navigate to="/submit" replace />} />
        </Routes>
      </NavShell>
    </HashRouter>
  )
}

export default App
