import { Route, Routes } from "react-router-dom";
import './App.css';
import { useAuth } from "./pages/auth/useAuth";
import { Analytics } from "./pages/analytics/Analytics";
import { Box, Spinner } from '@chakra-ui/react';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" h="100vh">
        <Spinner />
      </Box>
    );
  }

  if (!user) {
    return <Box>Failed to authenticate</Box>;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Analytics userId={user.uid} />} />
      </Routes>
    </>
  )
}

export default App
